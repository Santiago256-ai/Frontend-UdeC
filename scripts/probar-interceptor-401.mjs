/**
 * Pruebas del interceptor 401 de services/api.js y del aviso de sesión vencida
 * de la landing.
 *
 * Uso:
 *   1. En una terminal:  npm run dev          (deja Vite en http://localhost:5173)
 *   2. En otra:          npm run probar:interceptor
 *
 * Nunca llama al backend de producción: todo lo que vaya a backend-ude-c.vercel.app
 * se responde con page.route (401, 403 o datos vacíos según el caso). Usa sesiones
 * y tokens inventados.
 *
 * Cubre: 401 con token (egresado y empresa) → una sola salida a la landing con el
 * aviso y sólo se borran token y usuario; 401 sin token no actúa; 403 no redirige;
 * login con credenciales malas se queda en la pantalla; endpoints de /auth y
 * pantallas públicas exentos. Además mide el aviso en los 7 tamaños (geometría real)
 * y guarda capturas en tests/evidencia/interceptor-401/.
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const BASE = process.env.LOGIN_URL || 'http://localhost:5173';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, '../tests/evidencia/interceptor-401');

const EGRESADO = { id: 77, nombres: 'Laura', apellidos: 'Gómez', correo: 'laura@ejemplo.com', programa: 'Ingeniería Ambiental' };
const EMPRESA = { id: 3, nombre: 'Agro Andes', rol: 'empresa' };
const TOKEN = 'token-inventado-de-prueba';
const TAMANOS = [[390, 844], [360, 780], [360, 640], [768, 1024], [820, 1180], [1280, 800], [1280, 650]];

let fallos = 0;
let fueraDeLocal = 0;
const check = (ok, etiqueta, detalle = '') => {
  if (!ok) fallos++;
  console.log(`  ${ok ? '✓' : '✗'} ${etiqueta}${detalle ? ` — ${detalle}` : ''}`);
};

/**
 * `respuesta(req)` decide qué devuelve el backend simulado. La sesión se siembra
 * una sola vez por pestaña (marca en sessionStorage), para que la recarga de la
 * salida no la vuelva a escribir.
 */
async function nuevaPagina(browser, { sesion, token = TOKEN, respuesta, viewport = { width: 1280, height: 800 } }) {
  const context = await browser.newContext({ viewport });
  if (sesion) {
    await context.addInitScript(([u, t]) => {
      if (sessionStorage.getItem('__sembrado')) return;
      sessionStorage.setItem('__sembrado', '1');
      localStorage.setItem('usuario', JSON.stringify(u));
      if (t) localStorage.setItem('token', t);
      localStorage.setItem('otra-clave', 'se-queda');
      sessionStorage.setItem('recuperar-enfriamiento', JSON.stringify({ hasta: 0, correo: '' }));
    }, [sesion, token]);
  }
  context.on('request', (r) => {
    const u = r.url();
    if (!u.startsWith(BASE) && !u.startsWith('data:') && !/backend-ude-c\.vercel\.app/.test(u)) fueraDeLocal++;
  });
  await context.route(/backend-ude-c\.vercel\.app/, (route) => {
    const req = route.request();
    const [status, body] = respuesta(req);
    return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
  });
  const page = await context.newPage();
  const salidas = [];
  // Se cuentan las cargas reales del documento de salida (framenavigated se dispara
  // dos veces por carga en esta app y daría un falso "dos salidas").
  page.on('request', (r) => { if (r.isNavigationRequest() && r.url().includes('motivo=expirada')) salidas.push(r.url()); });
  return { context, page, salidas };
}

const conToken = (req) => Boolean(req.headers().authorization);
// Espera la salida a la landing limpia; si no llega, el chequeo correspondiente falla (no corta el script).
const esperarLanding = (page, timeout) => page.waitForURL((u) => u.pathname === '/' && !u.search, { timeout }).then(() => true, () => false);
const almacen = (page) => page.evaluate(() => ({
  token: localStorage.getItem('token'), usuario: localStorage.getItem('usuario'),
  otra: localStorage.getItem('otra-clave'), enfriamiento: sessionStorage.getItem('recuperar-enfriamiento'),
}));
const avisoVisible = async (page) => (await page.locator('.landing-aviso-sesion').count()) > 0
  && (await page.locator('.landing-aviso-sesion').innerText()).includes('Tu sesión expiró, vuelve a entrar.');

const browser = await chromium.launch();
await mkdir(OUT, { recursive: true });

console.log('\n401 con token → una sola salida a la landing, sólo se borra la sesión');
for (const [nombre, sesion, ruta] of [['egresado', EGRESADO, '/vacantes-dashboard'], ['empresa', EMPRESA, '/empresa-dashboard']]) {
  const { context, page, salidas } = await nuevaPagina(browser, {
    sesion, respuesta: (req) => (conToken(req) ? [401, { message: 'Token inválido o expirado' }] : [200, []]),
  });
  await page.goto(BASE + ruta);
  check(await esperarLanding(page, 15000), `${nombre}: vuelve a la landing`);
  await page.waitForTimeout(1500); // los sondeos siguen fallando: no debe haber una segunda salida
  const a = await almacen(page);
  check(salidas.length === 1, `${nombre}: una sola salida aunque fallen varias peticiones`, `${salidas.length}`);
  check(a.token === null && a.usuario === null, `${nombre}: token y usuario borrados`);
  check(a.otra === 'se-queda' && a.enfriamiento !== null, `${nombre}: el resto de localStorage y sessionStorage intacto`);
  check(await avisoVisible(page), `${nombre}: la landing muestra "Tu sesión expiró, vuelve a entrar."`);
  check(new URL(page.url()).search === '', `${nombre}: la URL queda limpia (recargar no repite el aviso)`);
  await context.close();
}

console.log('\n401 sin token → no actúa');
{
  const { context, page, salidas } = await nuevaPagina(browser, { sesion: EGRESADO, token: null, respuesta: () => [401, { message: 'x' }] });
  await page.goto(BASE + '/vacantes-dashboard');
  await page.waitForTimeout(3000);
  const a = await almacen(page);
  check(salidas.length === 0 && new URL(page.url()).pathname === '/vacantes-dashboard', 'se queda en el panel del egresado');
  check(a.usuario !== null, 'no borra el usuario');
  await context.close();
}

console.log('\n403 con token → no redirige');
{
  const { context, page, salidas } = await nuevaPagina(browser, { sesion: EMPRESA, respuesta: () => [403, { error: 'No tienes permiso.' }] });
  await page.goto(BASE + '/empresa-dashboard');
  await page.waitForTimeout(3000);
  const a = await almacen(page);
  check(salidas.length === 0 && new URL(page.url()).pathname === '/empresa-dashboard', 'se queda en el panel de la empresa');
  check(a.token === TOKEN && a.usuario !== null, 'conserva la sesión');
  await context.close();
}

console.log('\nLogin con credenciales malas → se queda en la pantalla');
{
  const { context, page, salidas } = await nuevaPagina(browser, {
    sesion: EGRESADO, // una sesión vieja en el navegador no cambia nada
    respuesta: (req) => (req.url().endsWith('/auth/login') ? [401, { success: false, message: 'Credenciales no encontradas' }] : [200, []]),
  });
  await page.goto(BASE + '/');
  await page.fill('input[type="email"]', 'persona@ejemplo.com');
  await page.fill('input.password-field', 'clave-equivocada');
  await page.click('.btn-login-submit');
  await page.locator('.error-message-sutil').waitFor({ timeout: 10000 });
  check(salidas.length === 0 && new URL(page.url()).pathname === '/', 'sigue en la landing, sin aviso de sesión');
  check(await page.locator('.error-message-sutil').isVisible(), 'muestra el error del login');
  await context.close();
}

// Egresado y empresa entran por el mismo formulario y el mismo POST /auth/login;
// con credenciales malas el servidor real responde 200 { success: false } (no 401).
// Se prueban las dos formas, sin sesión previa, para ver que no se escribe nada.
console.log('\nCredenciales malas de egresado y de empresa (200 success:false y 401)');
for (const [rol, correo] of [['egresado', 'laura@ejemplo.com'], ['empresa', 'talento@agroandes.co']]) {
  for (const [forma, status, cuerpo] of [
    ['200 { success: false }', 200, { success: false, message: 'Contraseña incorrecta' }],
    ['401', 401, { message: 'Credenciales no encontradas' }],
  ]) {
    const pedidosLogin = [];
    const { context, page, salidas } = await nuevaPagina(browser, {
      respuesta: (req) => {
        if (req.url().endsWith('/auth/login')) { pedidosLogin.push(req.postDataJSON()); return [status, cuerpo]; }
        return [200, []];
      },
    });
    await page.goto(BASE + '/');
    await page.fill('input[type="email"]', correo);
    await page.fill('input.password-field', 'clave-equivocada');
    await page.click('.btn-login-submit');
    const error = page.locator('.error-message-sutil');
    const seVe = await error.waitFor({ timeout: 10000 }).then(() => true, () => false);
    await page.waitForTimeout(500);
    const a = await almacen(page);
    const etiqueta = `${rol}, ${forma}`;
    check(pedidosLogin.length === 1 && pedidosLogin[0].correo === correo, `${etiqueta}: un solo POST a /auth/login con el correo escrito`);
    check(salidas.length === 0 && new URL(page.url()).pathname === '/', `${etiqueta}: sin salida, sigue en la landing`);
    check(a.token === null && a.usuario === null, `${etiqueta}: no escribe token ni usuario`);
    check(seVe && (await error.innerText()).trim() === cuerpo.message, `${etiqueta}: muestra el error`, seVe ? `"${(await error.innerText()).trim()}"` : 'no aparece');
    await context.close();
  }
}

console.log('\nExenciones (llamando al cliente API directamente)');
{
  const { context, page, salidas } = await nuevaPagina(browser, { sesion: EGRESADO, respuesta: () => [401, { message: 'x' }] });
  const llamar = (metodo, url) => page.evaluate(async ([m, u]) => {
    const { default: API } = await import('/src/services/api.js');
    try { await API[m](u, {}); } catch { /* el error sigue llegando a quien llama */ }
  }, [metodo, url]);
  await page.goto(BASE + '/home'); // pantalla interna sin peticiones propias
  await page.waitForTimeout(500);
  await llamar('post', '/auth/login');
  await llamar('post', '/auth/admin/login');
  await llamar('post', '/estudiantes/login');
  await page.waitForTimeout(800);
  check(salidas.length === 0 && (await almacen(page)).token === TOKEN, '401 de /auth/* y /estudiantes/login: no actúa');
  await page.goto(BASE + '/registro-egresado'); // pantalla pública
  await llamar('get', '/vacantes');
  await page.waitForTimeout(800);
  check(salidas.length === 0 && (await almacen(page)).token === TOKEN, '401 en una pantalla pública: no actúa');
  await page.goto(BASE + '/home');
  await llamar('get', '/vacantes');
  await esperarLanding(page, 10000);
  check(salidas.length === 1, 'control: el mismo 401 en una pantalla interna sí sale');
  await context.close();
}

console.log('\nAviso en la landing: geometría real en los 7 tamaños');
for (const [w, h] of TAMANOS) {
  const medir = async (url) => {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: w < 640 ? 2 : 1, isMobile: w < 640, hasTouch: w < 640 });
    await ctx.route(/backend-ude-c\.vercel\.app/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
    const p = await ctx.newPage();
    await p.goto(BASE + url);
    await p.locator('.btn-login-submit').waitFor();
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(300);
    const g = await p.evaluate(() => {
      const r = (s) => document.querySelector(s)?.getBoundingClientRect();
      const panel = document.querySelector('.actions-section-white');
      return {
        desborde: document.documentElement.scrollWidth - innerWidth,
        scrollDoc: document.documentElement.scrollHeight - innerHeight,
        scrollPanel: panel ? panel.scrollHeight - panel.clientHeight : 0,
        aviso: r('.landing-aviso-sesion'), boton: r('.btn-login-submit'),
      };
    });
    return { ctx, p, g };
  };
  const base = await medir('/');
  const con = await medir('/?motivo=expirada');
  const g = con.g;
  check(g.desborde <= 0, `${w}×${h}: sin desborde horizontal`, `${g.desborde}`);
  check(g.aviso && g.aviso.left >= 0 && g.aviso.right <= w, `${w}×${h}: el aviso cabe a lo ancho`, g.aviso ? `${Math.round(g.aviso.left)}–${Math.round(g.aviso.right)}, alto ${Math.round(g.aviso.height)}` : 'no aparece');
  console.log(`    scroll del documento ${base.g.scrollDoc}→${g.scrollDoc}px · scroll del panel ${base.g.scrollPanel}→${g.scrollPanel}px · INGRESAR termina en y=${Math.round(g.boton.bottom)} de ${h}`);
  if ((w === 1280 && h === 800) || w === 390 || (w === 360 && h === 640)) {
    await con.p.screenshot({ path: path.join(OUT, `landing-aviso-${w}x${h}.png`) });
  }
  await base.ctx.close();
  await con.ctx.close();
}

await browser.close();
console.log(`\nPedidos fuera de localhost (sin contar el backend simulado): ${fueraDeLocal}`);
console.log(fallos ? `\n${fallos} chequeo(s) fallaron` : '\nTodos los chequeos pasan');
process.exit(fallos ? 1 : 0);
