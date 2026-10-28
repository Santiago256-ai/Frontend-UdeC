/**
 * Pruebas del acceso de administrador (DESIGN.md §8 y §9, sección 6.2 del informe).
 *
 * Uso:
 *   1. En una terminal:  npm run dev          (deja Vite en http://localhost:5173)
 *   2. En otra:          npm run probar:acceso-admin
 *
 * Nunca llama al backend de producción: todo lo que vaya a backend-ude-c.vercel.app
 * se responde con page.route. Sesiones y tokens inventados (los JWT de prueba no
 * están firmados: el frontend sólo lee su "exp").
 *
 * Las credenciales del acceso antiguo de Landing.jsx nunca se escriben aquí: si se
 * quiere probar que ya no llevan al panel, se pasan por variables de entorno
 * locales ADMIN_ANTIGUO_CORREO y ADMIN_ANTIGUO_CLAVE (sin ellas, ese caso se omite).
 *
 * Cubre: (1) el formulario público siempre consulta /auth/login; (2) /admin sin
 * sesión, con sesión de egresado o vencida termina en /admin/acceso; (3) con las dos
 * sesiones cargadas, las 13 llamadas del panel llevan el token de admin y ninguna el
 * del egresado; (4) 401 en el panel borra sólo admin-sesion, 403 no redirige y el
 * cierre de sesión conserva las demás claves; la pantalla /admin/acceso (éxito, 401,
 * 429, 5xx, red caída, aviso de sesión vencida) y su geometría en los 7 tamaños.
 * Capturas en tests/evidencia/acceso-admin/.
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const BASE = process.env.LOGIN_URL || 'http://localhost:5173';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, '../tests/evidencia/acceso-admin');
const TAMANOS = [[390, 844], [360, 780], [360, 640], [768, 1024], [820, 1180], [1280, 800], [1280, 650]];

const b64url = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const jwtDePrueba = (segundos) => `${b64url({ alg: 'none', typ: 'JWT' })}.${b64url({
  rol: 'admin', aud: 'admin', sub: '1', exp: Math.floor(Date.now() / 1000) + segundos,
})}.firma-de-prueba`;
const USUARIO_ADMIN = { usuario: 'admin.prueba', nombre: 'Oficina de prueba', rol: 'admin' };
const sesionAdmin = (segundos = 7200) => {
  const token = jwtDePrueba(segundos);
  return { token, usuario: USUARIO_ADMIN, exp: (Math.floor(Date.now() / 1000) + segundos) * 1000 };
};
const TOKEN_EGRESADO = 'token-de-egresado-de-prueba';
const EGRESADO = { id: 7, nombres: 'Laura', apellidos: 'Gómez', correo: 'laura@ejemplo.com' };

const STATS = {
  vacantesActivas: 7, vacantesFinalizadas: 3, totalEgresados: 120, totalEmpresas: 15, postulacionesHoy: 2,
  empresasRecientes: [{ id: 3, nombre: 'Agro Andes', nit: '900123456' }],
  vacantesPorSector: [{ economicSector: 'Agro', _count: { _all: 4 } }],
  postulacionesPorEstado: [{ estado: 'PENDIENTE', _count: { _all: 5 } }],
  datosCrecimiento: [{ mes: 'Oct', egresados: 120, empresas: 15 }],
  vacantesPorModalidad: [{ modalidad: 'Presencial', _count: { _all: 7 } }],
  egresadosPorFacultad: [{ facultad: 'Ingeniería', _count: { _all: 60 } }],
};
const USUARIOS = [{ id: 7, nombres: 'Laura', apellidos: 'Gómez', correo: 'laura@ejemplo.com', celular: '3000000000',
  facultad: 'Ingeniería', programa: 'Sistemas', estado: 'ACTIVO', createdAt: '2026-01-10T10:00:00Z' }];
const EMPRESAS = [{ id: 3, nombre: 'Agro Andes', nit: '900123456', email: 'talento@agroandes.co', estado: 'ACTIVO',
  economicSector: ['Agro'], createdAt: '2026-02-01T10:00:00Z', vacantes: [] }];

let fallos = 0;
let fueraDeLocal = 0;
const hostsExternos = new Set();
const check = (ok, etiqueta, detalle = '') => {
  if (!ok) fallos++;
  console.log(`  ${ok ? '✓' : '✗'} ${etiqueta}${detalle ? ` — ${detalle}` : ''}`);
};

/** Datos de prueba del panel; `modo` cambia la respuesta de las rutas del panel. */
function respuestaPanel(url, metodo, modo) {
  if (modo === '401') return [401, { codigo: 'sesion_invalida' }];
  if (modo === '403') return [403, { error: 'Esta acción está deshabilitada temporalmente mientras se habilita el acceso de administrador.' }];
  if (metodo !== 'GET') return [200, { message: 'ok' }];
  if (url.includes('/vacantes/stats')) return [200, STATS];
  if (url.includes('/usuarios/admin/todos')) return [200, USUARIOS];
  if (url.includes('/empresas/admin/todas')) return [200, EMPRESAS];
  return [200, []];
}

async function nuevaPagina(browser, { admin = null, egresado = false, modo = 'ok', login = null, viewport, extra = {} } = {}) {
  const context = await browser.newContext({ viewport: viewport || { width: 1280, height: 800 }, ...extra });
  await context.addInitScript(([s, conEgresado, eg, tk]) => {
    if (sessionStorage.getItem('__sembrado')) return;
    sessionStorage.setItem('__sembrado', '1');
    if (s) sessionStorage.setItem('admin-sesion', JSON.stringify(s));
    if (conEgresado) { localStorage.setItem('token', tk); localStorage.setItem('usuario', JSON.stringify(eg)); }
    localStorage.setItem('otra-clave', 'se-queda');
    sessionStorage.setItem('recuperar-enfriamiento', JSON.stringify({ hasta: 0, correo: '' }));
  }, [admin, egresado, EGRESADO, TOKEN_EGRESADO]);
  const pedidos = [];
  context.on('request', (r) => {
    const u = r.url();
    if (!u.startsWith(BASE) && !u.startsWith('data:') && !/backend-ude-c\.vercel\.app/.test(u)) { fueraDeLocal++; hostsExternos.add(new URL(u).host); }
  });
  await context.route(/backend-ude-c\.vercel\.app/, async (route) => {
    const req = route.request();
    const url = req.url();
    pedidos.push({ url, metodo: req.method(), auth: req.headers().authorization || null, cuerpo: req.postData() });
    if (url.endsWith('/auth/admin/login')) {
      const [status, body, demora = 0] = (login || (() => [401, { message: 'Usuario o contraseña incorrectos' }]))(req);
      if (status === 'red') return route.abort('internetdisconnected');
      if (demora) await new Promise((r) => setTimeout(r, demora));
      return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
    }
    const [status, body] = respuestaPanel(url, req.method(), modo);
    return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
  });
  const page = await context.newPage();
  page.on('dialog', (d) => d.dismiss());
  return { context, page, pedidos };
}

const ruta = (page) => { const u = new URL(page.url()); return u.pathname + u.search; };
const almacen = (page) => page.evaluate(() => ({
  admin: sessionStorage.getItem('admin-sesion'), token: localStorage.getItem('token'), usuario: localStorage.getItem('usuario'),
  otra: localStorage.getItem('otra-clave'), enfriamiento: sessionStorage.getItem('recuperar-enfriamiento'),
}));
const esperar = (page, pred, timeout = 10000) => page.waitForURL(pred, { timeout }).then(() => true, () => false);
const panelVisible = (page) => page.locator('.admin-layout-wrapper').waitFor({ timeout: 10000 }).then(() => true, () => false);

const browser = await chromium.launch();
await mkdir(OUT, { recursive: true });

// ---------------------------------------------------------------- 6.2 (1)
console.log('\n(1) Formulario público: siempre consulta /auth/login, nunca entra al panel');
{
  const { context, page, pedidos } = await nuevaPagina(browser);
  await context.route(/\/api\/auth\/login$/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"success":false,"message":"Credenciales no encontradas"}' }));
  await page.goto(BASE + '/');
  await page.fill('input[type="email"]', 'alguien@ejemplo.com');
  await page.fill('input.password-field', 'clave-de-prueba');
  await page.click('.btn-login-submit');
  await page.locator('.error-message-sutil').waitFor({ timeout: 10000 }).catch(() => {});
  const a = await almacen(page);
  check(ruta(page) === '/' && a.token === null, 'credenciales cualesquiera: sigue en la landing y no escribe token');
  void pedidos;
  await context.close();
}
if (process.env.ADMIN_ANTIGUO_CORREO && process.env.ADMIN_ANTIGUO_CLAVE) {
  const { context, page } = await nuevaPagina(browser);
  await page.goto(BASE + '/');
  await page.fill('input[type="email"]', process.env.ADMIN_ANTIGUO_CORREO);
  await page.fill('input.password-field', process.env.ADMIN_ANTIGUO_CLAVE);
  await page.click('.btn-login-submit');
  await page.waitForTimeout(1500);
  check(!/^\/admin\/?$/i.test(new URL(page.url()).pathname) && !(await page.locator('.admin-layout-wrapper').count()),
    'credenciales del acceso antiguo: no abren el panel', ruta(page));
  await context.close();
} else {
  console.log('  · credenciales del acceso antiguo: omitido (sin ADMIN_ANTIGUO_CORREO / ADMIN_ANTIGUO_CLAVE)');
}

// ---------------------------------------------------------------- 6.2 (2)
console.log('\n(2) /admin sin sesión de administrador válida termina en /admin/acceso');
for (const [caso, opciones, destino] of [
  ['sin sesión', {}, '/admin/acceso'],
  ['con sesión de egresado', { egresado: true }, '/admin/acceso'],
  ['con sesión de admin vencida', { admin: sesionAdmin(-60) }, '/admin/acceso?motivo=expirada'],
]) {
  const { context, page, pedidos } = await nuevaPagina(browser, opciones);
  await page.goto(BASE + '/admin');
  const llego = await esperar(page, (u) => u.pathname + u.search === destino);
  check(llego, `${caso} → ${destino}`, ruta(page));
  check(!(await page.locator('.admin-layout-wrapper').count()) && !pedidos.some((p) => /\/admin\/|\/stats/.test(p.url)),
    `${caso}: no se monta el panel ni se piden sus datos`);
  if (destino.includes('expirada')) {
    check((await page.locator('.acceso-admin-aviso').innerText().catch(() => '')).includes('Tu sesión expiró, vuelve a entrar.'), `${caso}: muestra el aviso`);
    check((await almacen(page)).admin === null, `${caso}: borra admin-sesion`);
  }
  await context.close();
}
{
  const { context, page } = await nuevaPagina(browser, { admin: sesionAdmin(), modo: '403' });
  await page.goto(BASE + '/admin');
  check(await panelVisible(page), 'con sesión de admin válida → se monta el panel');
  await page.waitForTimeout(1500);
  check(ruta(page) === '/admin', 'con 403 en todas las rutas del panel, no redirige');
  await context.close();
}
{
  const { context, page } = await nuevaPagina(browser, { admin: sesionAdmin() });
  await page.goto(BASE + '/admin/acceso');
  check(await esperar(page, (u) => u.pathname === '/admin'), '/admin/acceso con sesión válida → /admin');
  await context.close();
}

// ---------------------------------------------------------------- 6.2 (3)
console.log('\n(3) Con sesión de admin y de egresado a la vez, las 13 llamadas del panel llevan el token de admin');
{
  const s = sesionAdmin();
  const { context, page, pedidos } = await nuevaPagina(browser, { admin: s, egresado: true });
  const marca = () => pedidos.length;
  const desde = (i) => pedidos.slice(i);
  const sitios = [];
  const registrar = (nombre, i, filtro) => sitios.push({ nombre, pedidos: desde(i).filter(filtro) });
  const menu = (n) => page.locator('.admin-menu-item').nth(n).click();
  // Un paso que no se puede completar no corta el script: su sitio queda sin pedidos y falla abajo.
  const paso = async (fn) => { try { await fn(); } catch (e) { console.log(`    (paso no completado: ${e.message.split(/\r?\n/)[0]})`); } };
  const cerrarModal = () => paso(() => page.locator('[class*="udec_det_closeBtn"], [class*="udec_corp_close"]').first().click({ timeout: 3000 }));

  let i = marca();
  await page.goto(BASE + '/admin');
  await panelVisible(page);
  await page.waitForTimeout(1200);
  registrar('Admin.jsx: GET /vacantes/admin/todas', i, (p) => p.url.includes('/vacantes/admin/todas'));
  registrar('Admin.jsx: GET /vacantes/stats', i, (p) => p.url.includes('/vacantes/stats'));
  check((await page.locator('.card', { hasText: 'Vacantes Activas' }).innerText().catch(() => '')).includes('7'), 'KPI "Vacantes Activas" muestra vacantesActivas (7)');

  i = marca(); await menu(1); await page.waitForTimeout(1200);
  registrar('ItemUsuarios: GET /usuarios/admin/todos', i, (p) => p.url.includes('/usuarios/admin/todos'));
  i = marca(); await paso(() => page.locator('button[title^="Click para"]').first().click({ timeout: 5000 })); await page.waitForTimeout(600);
  registrar('ItemUsuarios: PUT /usuarios/:id (estado)', i, (p) => p.metodo === 'PUT' && /\/usuarios\/7$/.test(p.url));
  i = marca();
  await paso(async () => {
    await page.locator('button[title="Ver Perfil"]').first().click({ timeout: 5000 });
    await page.locator('button', { hasText: 'Editar Expediente' }).click({ timeout: 5000 });
    await page.fill('input[name="celular"]', '3110000000');
    await page.locator('button', { hasText: 'Guardar Cambios' }).click({ timeout: 5000 });
  });
  await page.waitForTimeout(600);
  registrar('ItemUsuarios: PUT /usuarios/:id (editar)', i, (p) => p.metodo === 'PUT' && /\/usuarios\/7$/.test(p.url));
  if (await page.locator('[class*="udec_det_closeBtn"]').count()) await cerrarModal();
  i = marca(); await page.locator('button[title="Eliminar"]').first().click({ timeout: 5000 }).catch(() => {});
  await page.locator('[class*="btnEliminar"]').click({ timeout: 5000 }).catch(() => {}); await page.waitForTimeout(600);
  registrar('ItemUsuarios: DELETE /usuarios/:id', i, (p) => p.metodo === 'DELETE' && /\/usuarios\/7$/.test(p.url));

  i = marca(); await menu(2); await page.waitForTimeout(1200);
  registrar('ItemEmpresas: GET /empresas/admin/todas', i, (p) => p.url.includes('/empresas/admin/todas'));
  i = marca(); await paso(() => page.locator('button[title^="Click para"]').first().click({ timeout: 5000 })); await page.waitForTimeout(600);
  registrar('ItemEmpresas: PUT /empresas/admin/estado/:id', i, (p) => p.metodo === 'PUT' && p.url.includes('/empresas/admin/estado/3'));
  i = marca();
  await paso(async () => {
    await page.locator('button[title="Ver detalles"]').first().click({ timeout: 5000 });
    await page.locator('button', { hasText: 'Editar Expediente' }).click({ timeout: 5000 });
    await page.fill('input[name="city"]', 'Fusagasugá');
    await page.locator('button', { hasText: 'Guardar Cambios' }).click({ timeout: 5000 });
  });
  await page.waitForTimeout(600);
  registrar('ModalDetalleEmpresa: PUT /empresas/admin/:id', i, (p) => p.metodo === 'PUT' && /\/empresas\/admin\/3$/.test(p.url));
  if (await page.locator('[class*="udec_corp_close"]').count()) await cerrarModal();
  i = marca(); await page.locator('button[title="Eliminar Empresa"]').first().click({ timeout: 5000 }).catch(() => {});
  await page.locator('[class*="btnEliminar"]').click({ timeout: 5000 }).catch(() => {}); await page.waitForTimeout(600);
  registrar('ItemEmpresas: DELETE /empresas/admin/:id', i, (p) => p.metodo === 'DELETE' && /\/empresas\/admin\/3$/.test(p.url));

  i = marca(); await menu(3); await page.waitForTimeout(1200);
  registrar('ItemVacantes: GET /vacantes/admin/todas', i, (p) => p.url.includes('/vacantes/admin/todas'));
  i = marca(); await menu(4); await page.waitForTimeout(1200);
  registrar('ItemPostulaciones: GET /postulaciones/admin/todas', i, (p) => p.url.includes('/postulaciones/admin/todas'));
  i = marca(); await menu(5); await page.waitForTimeout(1200);
  registrar('MetricasyReportesAdmin: GET /vacantes/stats', i, (p) => p.url.includes('/vacantes/stats'));

  for (const sitio of sitios) {
    const ok = sitio.pedidos.length > 0 && sitio.pedidos.every((p) => p.auth === `Bearer ${s.token}`);
    check(ok, sitio.nombre, sitio.pedidos.length ? sitio.pedidos.map((p) => (p.auth === `Bearer ${s.token}` ? 'admin' : p.auth ? 'otro token' : 'sin token')).join(', ') : 'no se llamó');
  }
  check(sitios.length === 13, 'se recorrieron los 13 sitios de llamada', `${sitios.length}`);
  const delPanel = pedidos.filter((p) => !p.url.includes('/auth/'));
  check(delPanel.every((p) => p.auth === `Bearer ${s.token}`) && !delPanel.some((p) => p.auth === `Bearer ${TOKEN_EGRESADO}`),
    'ningún pedido del panel lleva el token del egresado ni va sin token', `${delPanel.length} pedidos`);
  await context.close();
}

// ---------------------------------------------------------------- 6.2 (4)
console.log('\n(4) 401 en el panel, 403 y cierre de sesión');
{
  const { context, page } = await nuevaPagina(browser, { admin: sesionAdmin(), egresado: true, modo: '401' });
  await page.goto(BASE + '/admin');
  const llego = await esperar(page, (u) => u.pathname + u.search === '/admin/acceso?motivo=expirada');
  const a = await almacen(page);
  check(llego, '401 { codigo: "sesion_invalida" } → /admin/acceso?motivo=expirada', ruta(page));
  check(a.admin === null && a.token === TOKEN_EGRESADO && a.usuario !== null && a.otra === 'se-queda' && a.enfriamiento !== null,
    '401: borra sólo admin-sesion (la sesión del egresado y el resto siguen)');
  await context.close();
}
{
  const { context, page } = await nuevaPagina(browser, { admin: sesionAdmin(), modo: '403' });
  await page.goto(BASE + '/admin');
  await panelVisible(page);
  await page.waitForTimeout(1500);
  check(ruta(page) === '/admin' && (await almacen(page)).admin !== null, '403: no redirige y conserva admin-sesion');
  await context.close();
}
{
  const { context, page } = await nuevaPagina(browser, { admin: sesionAdmin(), egresado: true });
  await page.goto(BASE + '/admin');
  await panelVisible(page);
  await page.waitForTimeout(800);
  await page.locator('.admin-avatar-circle').click();
  await page.locator('.admin-logout-btn').click();
  await page.locator('button', { hasText: /^\s*Cerrar sesión\s*$/ }).click();
  const llego = await esperar(page, (u) => u.pathname === '/admin/acceso');
  const a = await almacen(page);
  check(llego, 'cierre de sesión → /admin/acceso', ruta(page));
  check(a.admin === null && a.token === TOKEN_EGRESADO && a.otra === 'se-queda' && a.enfriamiento !== null,
    'cierre de sesión: borra sólo admin-sesion');
  await context.close();
}
{
  // Vence en 34 s; con el margen de 30 s de sesionAdmin.js, el temporizador salta a los ~4 s.
  const { context, page } = await nuevaPagina(browser, { admin: sesionAdmin(34) });
  await page.goto(BASE + '/admin');
  check(await panelVisible(page), 'sesión a punto de vencer: el panel se monta primero');
  const llego = await esperar(page, (u) => u.pathname + u.search === '/admin/acceso?motivo=expirada', 15000);
  check(llego, 'la sesión vence con el panel abierto → /admin/acceso?motivo=expirada', ruta(page));
  await context.close();
}

// ---------------------------------------------------------------- pantalla /admin/acceso
console.log('\nPantalla /admin/acceso');
const entrar = async (page, usuario = '  Admin.Prueba ', clave = 'clave-de-prueba') => {
  await page.fill('#acceso-admin-usuario', usuario);
  await page.fill('#acceso-admin-password', clave);
  await page.press('#acceso-admin-password', 'Enter');
};
{
  const s = sesionAdmin();
  const { context, page, pedidos } = await nuevaPagina(browser, {
    login: () => [200, { token: s.token, usuario: USUARIO_ADMIN }, 300],
  });
  await page.goto(BASE + '/admin/acceso');
  await page.locator('#acceso-admin-usuario').waitFor();
  await entrar(page);
  await page.locator('.acceso-admin-boton').click().catch(() => {}); // doble envío durante la carga
  const llego = await esperar(page, (u) => u.pathname === '/admin');
  const guardada = JSON.parse((await almacen(page)).admin || 'null');
  const logins = pedidos.filter((p) => p.url.endsWith('/auth/admin/login'));
  check(llego, 'éxito → /admin', ruta(page));
  check(logins.length === 1, 'un solo pedido aunque se envíe dos veces', `${logins.length}`);
  check(logins[0] && JSON.parse(logins[0].cuerpo).usuario === 'admin.prueba', 'el usuario se recorta y pasa a minúsculas');
  check(guardada?.token === s.token && guardada?.usuario?.rol === 'admin' && Math.abs(guardada.exp - s.exp) < 2000,
    'guarda { token, usuario, exp } en sessionStorage (exp leído del token)');
  check((await almacen(page)).token === null, 'no escribe localStorage.token');
  await context.close();
}
for (const [caso, login, mensaje] of [
  ['401', () => [401, { message: 'Usuario o contraseña incorrectos' }], 'Usuario o contraseña incorrectos'],
  ['429', () => [429, { message: 'Demasiados intentos' }], 'Demasiados intentos. Espera unos minutos y vuelve a intentarlo.'],
  ['500', () => [500, { message: 'x' }], 'No pudimos iniciar sesión. Intenta de nuevo.'],
  ['red caída', () => ['red'], 'No se pudo conectar con el servidor.'],
]) {
  const { context, page } = await nuevaPagina(browser, { login });
  await page.goto(BASE + '/admin/acceso');
  await page.locator('#acceso-admin-usuario').waitFor();
  await entrar(page);
  await page.locator('.acceso-admin-error').waitFor({ timeout: 10000 }).catch(() => {});
  const texto = await page.locator('.acceso-admin-vivo').innerText().catch(() => '');
  const st = await page.evaluate(() => ({ vivo: document.querySelector('.acceso-admin-vivo')?.getAttribute('aria-live'), foco: document.activeElement?.id }));
  check(texto.includes(mensaje) && st.vivo === 'assertive', `${caso}: "${mensaje}" anunciado`, texto || 'sin mensaje');
  check(ruta(page) === '/admin/acceso' && (await almacen(page)).admin === null, `${caso}: se queda y no guarda sesión`);
  if (caso === '401') check(st.foco === 'acceso-admin-password', '401: el foco vuelve a la contraseña');
  await context.close();
}

// ---------------------------------------------------------------- geometría
console.log('\n/admin/acceso: geometría real en los 7 tamaños (normal y con error)');
for (const [w, h] of TAMANOS) {
  const movil = w < 640;
  const { context, page } = await nuevaPagina(browser, { viewport: { width: w, height: h }, extra: { deviceScaleFactor: movil ? 2 : 1, isMobile: movil, hasTouch: movil } });
  await page.goto(BASE + '/admin/acceso');
  await page.locator('#acceso-admin-usuario').waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  const medir = () => page.evaluate(() => {
    const r = (s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return { top: b.top + scrollY, bottom: b.bottom + scrollY, left: b.left, right: b.right, w: b.width, h: b.height }; };
    const input = getComputedStyle(document.querySelector('.acceso-admin-input'));
    return { desborde: document.documentElement.scrollWidth - innerWidth, scroll: Math.max(0, document.documentElement.scrollHeight - innerHeight),
      boton: r('.acceso-admin-boton'), error: r('.acceso-admin-error'), ojo: r('.acceso-admin-ojo'),
      inputPx: parseFloat(input.fontSize), fuente: input.fontFamily.split(',')[0] };
  });
  const n = await medir();
  if (w === 1280 && h === 800) await page.screenshot({ path: path.join(OUT, `acceso-${w}x${h}-normal.png`) });
  await entrar(page);
  await page.locator('.acceso-admin-error').waitFor({ timeout: 10000 }).catch(() => {});
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(250);
  const e = await medir();
  if ((w === 1280 && h === 800) || w === 390 || (w === 360 && h === 640)) await page.screenshot({ path: path.join(OUT, `acceso-${w}x${h}-error.png`) });
  const nombre = `${w}×${h}`;
  check(n.desborde <= 0 && e.desborde <= 0, `${nombre}: sin desborde horizontal`);
  check(e.boton && e.boton.bottom <= h && e.error && e.error.bottom <= h, `${nombre}: botón y error visibles sin desplazar`, e.boton ? `botón hasta ${Math.round(e.boton.bottom)}, scroll ${n.scroll}/${e.scroll}px` : 'sin botón');
  check(n.ojo.w >= 44 && n.ojo.h >= 44 && n.inputPx >= 16 && n.fuente.includes('Montserrat'), `${nombre}: ojo 44×44, campos a 16px, Montserrat`);
  await context.close();
}
{
  const { context, page } = await nuevaPagina(browser);
  await page.goto(BASE + '/admin/acceso?motivo=expirada');
  await page.locator('.acceso-admin-aviso').waitFor({ timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(400); // que termine la entrada de 240 ms antes de capturar
  await page.screenshot({ path: path.join(OUT, 'acceso-1280x800-expirada.png') });
  check((await page.locator('.acceso-admin-aviso').count()) === 1, '?motivo=expirada: aviso en la pantalla de acceso');
  await context.close();
}

await browser.close();
console.log(`\nPedidos fuera de localhost (sin contar el backend simulado): ${fueraDeLocal}${hostsExternos.size ? ` (${[...hostsExternos].join(', ')})` : ''}`);
console.log(fallos ? `\n${fallos} chequeo(s) fallaron` : '\nTodos los chequeos pasan');
process.exit(fallos ? 1 : 0);
