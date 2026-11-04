/**
 * Menú de navegación del Administrador (AdminNav, Rumbo B "Sello en Marcha"):
 * verificación con geometría real + evidencia visual.
 *
 * Uso:
 *   1. En una terminal:  npm run dev                 (Vite en http://localhost:5173)
 *   2. En otra:          npm run capturar:menu-admin
 *
 * Nunca llama al backend de producción: todo lo que vaya a backend-ude-c.vercel.app
 * se responde con page.route y cualquier otro host externo se aborta. Sesión de
 * administrador inventada en sessionStorage (admin-sesion; el JWT de prueba no está
 * firmado: el frontend sólo lee su "exp").
 *
 * Comprueba en 390×844, 360×640, 768×1024, 820×1180, 1280×800, 1280×650,
 * 1276×551 a escala 1,5 (la pantalla real del usuario), 1920×1080 y 2560×1440:
 *   - los 7 destinos visibles enteros (boundingBox dentro del viewport, etiqueta
 *     sin recortar), sin scroll horizontal de la página;
 *   - barra superior desde 926px, barra inferior de solo íconos por debajo
 *     (y el borde 925/926);
 *   - nada tapa el contenido (arriba: empieza bajo el menú; abajo: el final del
 *     contenido queda sobre la barra inferior);
 *   - clic y teclado (Tab + Enter, foco visible) en los 7; Configuración
 *     ("próximamente", aria-disabled) se alcanza con Tab pero no navega ni recibe
 *     la pestaña activa ni el glider;
 *   - sticky tras 120 y 400px de scroll; los modales del panel quedan encima;
 *   - pantalla de carga de Inicio: encima del panel montado (el menú no se vuelve
 *     a montar), los datos se recargan y no se puede hacer clic por debajo;
 *   - móvil: los toasts no tapan la barra inferior;
 *   - salida: tras /admin y cerrar sesión, la landing, /admin/acceso,
 *     /empresa-dashboard y /vacantes-dashboard conservan el overflow y el scroll
 *     de una carga limpia (también saliendo del panel sin recarga).
 * Además captura los menús de Egresado y Empresa para comparar.html.
 *
 * Sale con código 1 si algo falla. Evidencia en frontend/tests/evidencia/menu-admin/.
 */
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const BASE = process.env.MENU_URL || 'http://localhost:5173';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, '../tests/evidencia/menu-admin');
const CORTE = 926; // desde aquí, barra superior; por debajo, barra inferior
const MONITORES = [[1920, 1080], [2560, 1440]];
const PROXIMAMENTE = 6; // índice de Configuración

const b64url = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const sesionAdmin = () => {
  const exp = Math.floor(Date.now() / 1000) + 7200;
  return {
    token: `${b64url({ alg: 'none', typ: 'JWT' })}.${b64url({ rol: 'admin', aud: 'admin', sub: '1', exp })}.firma-de-prueba`,
    usuario: { usuario: 'admin.prueba', nombre: 'Oficina de prueba', rol: 'admin' },
    exp: exp * 1000,
  };
};
const EMPRESA = { id: 7, nombres: 'Dollarcity S.A.S.', nombre: 'Dollarcity S.A.S.', rol: 'empresa', correo: 'rrhh@dollarcity.co' };
const EGRESADO = { id: 'egresado-demo', nombres: 'Deivid Santiago', apellidos: 'Olivar Rodriguez', programa: 'Ingeniería Ambiental', rol: 'EGRESADO' };

const STATS = {
  vacantesActivas: 7, vacantesFinalizadas: 3, totalEgresados: 120, totalEmpresas: 15, postulacionesHoy: 2,
  empresasRecientes: [{ id: 3, nombre: 'Agro Andes', nit: '900123456' }],
  vacantesPorSector: [{ economicSector: 'Agro', _count: { _all: 4 } }],
  postulacionesPorEstado: [{ estado: 'PENDIENTE', _count: { _all: 5 } }, { estado: 'ACEPTADO', _count: { _all: 2 } }],
  datosCrecimiento: [{ mes: 'Sep', egresados: 90, empresas: 11 }, { mes: 'Oct', egresados: 120, empresas: 15 }],
  vacantesPorModalidad: [{ modalidad: 'Presencial', _count: { _all: 7 } }],
  egresadosPorFacultad: [{ facultad: 'Ingeniería', _count: { _all: 60 } }],
};
const VACANTES_ADMIN = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1, titulo: `Analista ambiental junior ${i + 1}`, estado: i % 3 ? 'ABIERTA' : 'CERRADA', ubicacion: 'Soacha',
  createdAt: '2026-10-01T10:00:00Z', empresa: { nombre: 'Agro Andes' },
}));
const USUARIOS = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1, nombres: `Laura ${i + 1}`, apellidos: 'Gómez', correo: `laura${i + 1}@ejemplo.com`, celular: '3000000000',
  facultad: 'Ingeniería', programa: 'Sistemas', estado: 'ACTIVO', createdAt: '2026-01-10T10:00:00Z',
}));
const EMPRESAS = Array.from({ length: 8 }, (_, i) => ({
  id: i + 1, nombre: `Agro Andes ${i + 1}`, nit: '900123456', email: 'talento@agroandes.co', estado: 'ACTIVO',
  economicSector: ['Agro'], createdAt: '2026-02-01T10:00:00Z', vacantes: [],
}));
const POSTULACIONES_ADMIN = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1, estado: 'PENDIENTE', fecha: '2026-10-29T14:00:00Z', calificacionAdmin: i === 0 ? 4 : null,
  egresado: { nombres: 'Laura', apellidos: 'Gómez', correo: 'laura@ejemplo.com' },
  vacante: { titulo: 'Analista ambiental', empresa: { nombre: 'Agro Andes' } },
}));
// Datos de Empresa y Egresado (comparar.html y la salida del panel)
const vac = (id) => ({
  id, titulo: `Analista ambiental junior ${id}`, descripcion: '<p>Apoyo al sistema de gestión ambiental.</p>',
  estado: 'ABIERTA', modalidad: 'PRESENCIAL', ubicacion: 'Soacha', salario: '2500000', tipoSalario: 'FIJO',
  tipo: 'Término Fijo', jornada: 'Tiempo Completo', horario: 'Lunes a viernes', fechaCierre: '2026-12-24',
  fechaCreacion: '2026-10-01', limitePostulantes: 8, _count: { postulaciones: 2 },
});
const VACANTES = [1, 2, 3, 4, 5, 6].map(vac);

function stub(url) {
  if (url.includes('/vacantes/stats')) return STATS;
  if (url.includes('/vacantes/admin/todas')) return VACANTES_ADMIN;
  if (url.includes('/usuarios/admin/todos')) return USUARIOS;
  if (url.includes('/empresas/admin/todas')) return EMPRESAS;
  if (url.includes('/postulaciones/admin/todas')) return POSTULACIONES_ADMIN;
  if (url.includes('/metricas-pro')) return { vacantes: VACANTES, postulacionesRecientes: [], notificacionesRecientes: [] };
  if (url.includes('/vacantes')) return VACANTES;
  if (url.includes('/mis-chats/') || url.includes('/notificaciones/') || url.includes('/postulaciones')) return [];
  return {};
}

const fallos = [];
const ok = (cond, msg) => { if (!cond) fallos.push(msg); console.log(`  ${cond ? '✓' : '✗'} ${msg}`); };
const externos = new Set();

/** `perfil`: 'admin' (sessionStorage), 'empresa' / 'egresado' (localStorage) o null. `demora(url)`: ms antes de responder. */
async function contexto(browser, { w, h, dsf = 1, perfil = 'admin', reducedMotion = 'no-preference', pedidos = null, demora = null }) {
  const c = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dsf, reducedMotion });
  await c.addInitScript(([perfil, s, emp, egr]) => {
    if (sessionStorage.getItem('__sembrado')) return;
    sessionStorage.setItem('__sembrado', '1');
    if (perfil === 'admin') sessionStorage.setItem('admin-sesion', JSON.stringify(s));
    const u = perfil === 'empresa' ? emp : perfil === 'egresado' ? egr : null;
    if (u) { localStorage.setItem('usuario', JSON.stringify(u)); localStorage.setItem('token', 'demo-token'); }
  }, [perfil, sesionAdmin(), EMPRESA, EGRESADO]);
  await c.route('**/backend-ude-c.vercel.app/**', async r => {
    const url = r.request().url();
    if (pedidos) pedidos.push(`${r.request().method()} ${new URL(url).pathname}`);
    const ms = demora ? demora(url) : 0;
    if (ms) await new Promise(res => setTimeout(res, ms));
    await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(stub(url)) }).catch(() => {});
  });
  await c.route(u => !u.href.startsWith(BASE) && !u.href.startsWith('data:') && !/backend-ude-c\.vercel\.app/.test(u.href),
    r => { externos.add(new URL(r.request().url()).host); return r.abort(); });
  return c;
}

async function abrir(c, ruta = '/admin', sel = '.adm-nav-tab') {
  const p = await c.newPage();
  p.on('pageerror', e => fallos.push(`pageerror ${ruta}: ${e.message}`));
  p.on('dialog', d => d.dismiss());
  await p.goto(BASE + ruta, { waitUntil: 'domcontentloaded' });
  await p.waitForSelector(sel, { timeout: 15000 });
  if (ruta === '/admin') await p.waitForSelector('.admin-loading-screen', { state: 'detached', timeout: 15000 });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(900); // entrada escalonada + glider
  return p;
}

const shot = async (p, nombre, opts = {}) => { await p.screenshot({ path: path.join(OUT, `${nombre}.png`), ...opts }); console.log(`  · ${nombre}.png`); };
const vista = (p) => p.evaluate(() => {
  const m = document.querySelector('main.admin-content-panel');
  return [...m.children].filter(e => !e.classList.contains('admin-panel-habilitacion')).map(e => e.className).join(' ') + '|' + m.innerText.slice(0, 40);
});

/** Geometría del menú en el estado actual. */
const geometria = (p) => p.evaluate(() => {
  const r = (el) => { const b = el.getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height, r: b.right, b: b.bottom }; };
  const nav = document.querySelector('.adm-nav'), row = document.querySelector('.adm-nav-row');
  const tabs = [...document.querySelectorAll('.adm-nav-tab')];
  return {
    vw: innerWidth, vh: innerHeight,
    pageScrollW: document.documentElement.scrollWidth,
    nav: r(nav), row: r(row), rowPos: getComputedStyle(row).position,
    rowScroll: row.scrollWidth - row.clientWidth,
    tabs: tabs.map(t => {
      const lab = t.querySelector('.adm-nav-tab-label');
      const ls = getComputedStyle(lab);
      return { name: t.getAttribute('aria-label'), visible: lab.textContent, ...r(t), labelVisible: ls.display !== 'none', labelCortada: lab.scrollWidth > lab.clientWidth + 0.5, current: t.getAttribute('aria-current') };
    }),
    avatar: r(document.querySelector('.adm-nav-user-avatar')),
    font: getComputedStyle(tabs[0]).fontFamily,
    content: r(document.querySelector('main.admin-content-panel')),
  };
});

async function verificarTamano(browser, t) {
  console.log(`\n▶ ${t.w}×${t.h}${t.dsf ? ` @${t.dsf}x` : ''}`);
  const c = await contexto(browser, t);
  const p = await abrir(c);
  const g = await geometria(p);
  const abajo = t.w < CORTE;
  const etiqueta = `${t.w}x${t.h}${t.dsf ? `@${t.dsf}` : ''}`;

  ok(g.tabs.length === 7, `${etiqueta}: 7 destinos en el DOM`);
  ok(g.tabs.every(b => b.name.toLowerCase().includes(b.visible.toLowerCase())), `${etiqueta}: cada nombre accesible contiene su etiqueta visible`);
  ok(abajo ? g.rowPos === 'fixed' : g.rowPos !== 'fixed', `${etiqueta}: ${abajo ? 'barra inferior fija' : 'barra horizontal arriba'} (position ${g.rowPos})`);
  ok(g.tabs.every(b => b.x >= -0.5 && b.r <= g.vw + 0.5 && b.w > 0 && b.h >= (abajo ? 44 : 30)), `${etiqueta}: los 7 enteros dentro del viewport (x ${g.tabs.map(b => `${Math.round(b.x)}–${Math.round(b.r)}`).join(', ')})`);
  ok(g.rowScroll <= 0.5, `${etiqueta}: la fila no necesita scroll (sobra ${Math.round(g.rowScroll)}px)`);
  if (!abajo) ok(g.tabs.every(b => b.labelVisible && !b.labelCortada), `${etiqueta}: etiquetas visibles y sin recortar`);
  else ok(g.tabs.every(b => !b.labelVisible && b.name), `${etiqueta}: solo íconos, nombre accesible presente`);
  ok(g.pageScrollW <= g.vw, `${etiqueta}: sin scroll horizontal de página (${g.pageScrollW} ≤ ${g.vw})`);
  ok(g.avatar.x >= 0 && g.avatar.r <= g.vw && g.avatar.b <= g.vh, `${etiqueta}: avatar (cerrar sesión) a la vista`);
  ok(/Montserrat/.test(g.font) && !/^Inter/.test(g.font), `${etiqueta}: Montserrat en el menú`);
  ok(g.content.y >= g.nav.b - 0.5, `${etiqueta}: el contenido empieza bajo el menú (${Math.round(g.content.y)} ≥ ${Math.round(g.nav.b)})`);
  if (!abajo) {
    const m = await p.evaluate(() => {
      const r = (s) => document.querySelector(s).getBoundingClientRect();
      const ul = r('.adm-nav-tablist'), logo = r('.adm-nav-brand-logo'), udec = r('.adm-nav-brand-udec'), av = r('.adm-nav-user-avatar');
      const pad = parseFloat(getComputedStyle(document.querySelector('.adm-nav-identity')).paddingLeft);
      const panel = r('main.admin-content-panel');
      return { centroUl: ul.left + ul.width / 2, pad, logoX: logo.left, logoH: logo.height, udecH: udec.height, avR: av.right,
        panelL: panel.left, panelR: document.documentElement.clientWidth - panel.right, panelW: panel.width };
    });
    ok(Math.abs(m.centroUl - g.vw / 2) <= 1, `${etiqueta}: fila de pestañas centrada (centro ${m.centroUl.toFixed(1)} vs ${g.vw / 2})`);
    ok(Math.abs(m.logoX - m.pad) <= 1 && Math.abs((g.vw - m.avR) - m.pad) <= 1, `${etiqueta}: identidad en sus bordes (logo en x=${Math.round(m.logoX)}, avatar a ${Math.round(g.vw - m.avR)}px del borde; relleno ${Math.round(m.pad)})`);
    ok(Math.round(m.logoH) === 34 && Math.round(m.udecH) === 40, `${etiqueta}: logos a su escala (Empres360 ${Math.round(m.logoH)}px, UdeC ${Math.round(m.udecH)}px)`);
    ok(Math.abs(m.panelL - m.panelR) <= 2, `${etiqueta}: contenido con márgenes simétricos (${Math.round(m.panelL)}/${Math.round(m.panelR)}, ${Math.round(m.panelW)}px de ancho)`);
  }
  console.log(`    alto del menú ${Math.round(g.nav.h)}px · fila ${Math.round(g.row.h)}px · ${Math.round(g.nav.h / g.vh * 100)} % del alto`);
  await shot(p, `${etiqueta}-default`);

  // --- Final del contenido sobre la barra inferior ---
  if (abajo) {
    await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await p.waitForTimeout(200);
    const fin = await p.evaluate(() => {
      const main = document.querySelector('main.admin-content-panel'), row = document.querySelector('.adm-nav-row');
      const items = [...main.querySelectorAll('*')].filter(e => e.getClientRects().length);
      const ultimo = Math.max(...items.map(e => e.getBoundingClientRect().bottom));
      return { ultimo, barTop: row.getBoundingClientRect().top };
    });
    ok(fin.ultimo <= fin.barTop + 0.5, `${etiqueta}: al final del scroll el contenido termina sobre la barra (${Math.round(fin.ultimo)} ≤ ${Math.round(fin.barTop)})`);
    await shot(p, `${etiqueta}-fin-scroll`);
    await p.evaluate(() => window.scrollTo(0, 0));
  }

  // --- Clic en los 7 (Configuración: no navega) ---
  const firmas = new Set();
  for (let i = 0; i < 7; i++) {
    const antes = await vista(p);
    // force: Playwright no pulsa elementos con aria-disabled; el ratón real sí llega a Configuración.
    await p.locator('.adm-nav-tab').nth(i).click({ force: i === PROXIMAMENTE });
    await p.waitForSelector('.admin-loading-screen', { state: 'detached' });
    await p.waitForTimeout(350);
    const s = await p.evaluate((i) => {
      const t = document.querySelectorAll('.adm-nav-tab')[i];
      return { current: t.getAttribute('aria-current'), activos: document.querySelectorAll('.adm-nav-tab[aria-current="page"]').length };
    }, i);
    const despues = await vista(p);
    if (i === PROXIMAMENTE) {
      ok(s.current === null && s.activos === 1 && despues === antes, `${etiqueta}: clic en Configuración no navega ni cambia la pestaña activa`);
    } else {
      firmas.add(despues);
      ok(s.current === 'page' && s.activos === 1, `${etiqueta}: clic en destino ${i + 1} → aria-current="page"`);
    }
  }
  ok(firmas.size === 6, `${etiqueta}: los 6 destinos navegables muestran 6 vistas distintas`);

  // --- Teclado: Tab hasta las pestañas, foco visible, Enter navega ---
  // Recarga: tras un clic, Chromium usa el botón pulsado como punto de partida del siguiente Tab.
  await p.reload({ waitUntil: 'domcontentloaded' });
  await p.waitForSelector('.adm-nav-tab');
  await p.waitForSelector('.admin-loading-screen', { state: 'detached' });
  await p.waitForTimeout(900);
  await p.mouse.move(0, 0);
  let llegadas = 0;
  for (let n = 0; n < 12 && llegadas === 0; n++) {
    await p.keyboard.press('Tab');
    if (await p.evaluate(() => document.activeElement?.classList.contains('adm-nav-tab'))) llegadas = 1;
  }
  ok(llegadas === 1, `${etiqueta}: Tab llega a la primera pestaña`);
  let focoRef = null;
  for (let i = 0; i < 7; i++) {
    if (i > 0) await p.keyboard.press('Tab');
    const f = await p.evaluate((i) => {
      const a = document.activeElement, t = document.querySelectorAll('.adm-nav-tab')[i];
      const s = getComputedStyle(a);
      // Opacidad efectiva del anillo: producto de la opacidad del botón y de sus ancestros.
      let opa = 1;
      for (let e = a; e; e = e.parentElement) opa *= parseFloat(getComputedStyle(e).opacity);
      return { esEsta: a === t, outline: `${s.outlineStyle} ${s.outlineWidth}`, color: s.outlineColor, opa, focusVisible: a.matches(':focus-visible') };
    }, i);
    ok(f.esEsta && f.focusVisible && f.outline === 'solid 2px', `${etiqueta}: foco visible en destino ${i + 1} (${f.outline})`);
    if (i === 0) focoRef = f;
    else ok(f.color === focoRef.color && Math.abs(f.opa - focoRef.opa) < 0.001,
      `${etiqueta}: el foco del destino ${i + 1} tiene el contraste del primero (${f.color}, opacidad ${f.opa})`);
    if (i === 2) await shot(p, `${etiqueta}-foco-teclado`);
    if (i === PROXIMAMENTE) await shot(p, `${etiqueta}-foco-configuracion`);
    const antes = await vista(p);
    await p.keyboard.press('Enter');
    await p.waitForSelector('.admin-loading-screen', { state: 'detached' });
    await p.waitForTimeout(300);
    const cur = await p.evaluate((i) => ({
      esta: document.querySelectorAll('.adm-nav-tab')[i].getAttribute('aria-current'),
      activos: document.querySelectorAll('.adm-nav-tab[aria-current="page"]').length,
    }), i);
    if (i === PROXIMAMENTE) ok(cur.esta === null && cur.activos === 1 && (await vista(p)) === antes, `${etiqueta}: Enter en Configuración no navega`);
    else ok(cur.esta === 'page', `${etiqueta}: Enter en destino ${i + 1} navega`);
  }
  await c.close();
}

async function verificarProximamente(browser) {
  console.log('\n▶ Configuración ("próximamente")');
  const c = await contexto(browser, { w: 1276, h: 551, dsf: 1.5 });
  const p = await abrir(c);
  const a = await p.evaluate(() => {
    const t = document.querySelectorAll('.adm-nav-tab')[6];
    return { disabled: t.getAttribute('aria-disabled'), name: t.getAttribute('aria-label'), title: t.title, tabIndex: t.tabIndex, nativo: t.disabled };
  });
  ok(a.disabled === 'true' && !a.nativo && a.tabIndex === 0, `aria-disabled="true" sin disabled nativo (sigue en el orden de Tab)`);
  ok(a.name === 'Configuración, próximamente', `nombre accesible "${a.name}"`);
  ok(a.title === 'Próximamente', `title "${a.title}"`);
  await p.locator('.adm-nav-tab').nth(6).hover({ force: true });
  await p.waitForTimeout(300);
  const g = await p.evaluate(() => {
    const gl = document.querySelector('.adm-nav-glider').getBoundingClientRect(), t = document.querySelectorAll('.adm-nav-tab');
    const ini = t[0].getBoundingClientRect(), conf = t[6].getBoundingClientRect();
    const filete = getComputedStyle(t[6], '::before').display;
    const op = (sel) => getComputedStyle(t[6].querySelector(sel)).opacity;
    return { gliderEnInicio: Math.abs(gl.left - ini.left) < 1, gliderEnConf: Math.abs(gl.left - conf.left) < 1, filete,
      boton: getComputedStyle(t[6]).opacity, icono: op('.adm-nav-tab-icon'), texto: op('.adm-nav-tab-label') };
  });
  ok(g.gliderEnInicio && !g.gliderEnConf, 'el glider se queda en la pestaña activa al pasar sobre Configuración');
  ok(g.filete === 'none', 'sin filete dorado al pasar el ratón');
  ok(g.boton === '1' && g.icono === '0.5' && g.texto === '0.5', `apagada solo en ícono y texto (botón ${g.boton}, ícono ${g.icono}, texto ${g.texto}): el anillo de foco no se atenúa`);
  await shot(p, 'estado-configuracion-hover', { clip: { x: 0, y: 0, width: 1276, height: 140 } });
  await c.close();
}

async function verificarCapas(browser) {
  console.log('\n▶ Sticky y capas (1276×551 @1.5x y 1280×650)');
  for (const t of [{ w: 1276, h: 551, dsf: 1.5 }, { w: 1280, h: 650 }]) {
    const et = `${t.w}x${t.h}`;
    const c = await contexto(browser, t);
    const p = await abrir(c);
    for (const [idx, nombreVista] of [[0, 'Inicio'], [1, 'Egresados']]) {
      await p.locator('.adm-nav-tab').nth(idx).click();
      await p.waitForSelector('.admin-loading-screen', { state: 'detached' });
      await p.waitForTimeout(700);
      for (const y of [120, 400]) {
        await p.evaluate(() => window.scrollTo(0, 0));
        await p.mouse.move(t.w / 2, 400);
        await p.mouse.wheel(0, y);
        await p.waitForTimeout(350);
        const s = await p.evaluate(() => {
          const nav = document.querySelector('.adm-nav'), r = nav.getBoundingClientRect();
          const puntos = [0.1, 0.5, 0.9].map(f => document.elementFromPoint(innerWidth * f, r.top + r.height * 0.75));
          return { top: r.top, scrollY, encima: puntos.every(e => nav.contains(e)) };
        });
        ok(Math.round(s.scrollY) === y && Math.abs(s.top) < 0.5, `${et} ${nombreVista}: tras ${Math.round(s.scrollY)}px de scroll el menú sigue arriba (top ${s.top})`);
        ok(s.encima, `${et} ${nombreVista}: el menú queda encima del contenido`);
      }
      if (t.dsf) await shot(p, `${et}@1.5-sticky-${nombreVista.toLowerCase()}`);
    }
    // Modales encima del menú
    const encima = () => p.evaluate(() => {
      const nav = document.querySelector('.adm-nav'), r = nav.getBoundingClientRect();
      return [0.1, 0.5, 0.9].every(f => !nav.contains(document.elementFromPoint(innerWidth * f, r.top + 30)));
    });
    await p.evaluate(() => window.scrollTo(0, 0));
    await p.locator('.adm-nav-user-avatar').click();
    if (t.dsf) await shot(p, `${et}@1.5-menu-avatar`);
    await p.getByRole('menuitem', { name: 'Cerrar sesión' }).click();
    await p.waitForTimeout(400);
    ok(await encima(), `${et}: el modal de cerrar sesión queda encima del menú`);
    if (t.dsf) await shot(p, `${et}@1.5-modal-cerrar-sesion`);
    await p.getByRole('button', { name: 'Cancelar' }).click();
    // Egresados: "Ver Perfil" (ModalDetalle, z 10000) y "Eliminar" (ModalConfirmacion, z 9999)
    await p.locator('button[title="Ver Perfil"]').first().click();
    await p.waitForTimeout(400);
    ok(await encima(), `${et}: el modal "Ver perfil" del egresado queda encima del menú`);
    if (t.dsf) await shot(p, `${et}@1.5-modal-ver-perfil`);
    await p.locator('[class*="udec_det_closeBtn"], [class*="udec_corp_close"]').first().click();
    await p.locator('button[title="Eliminar"]').first().click();
    await p.waitForTimeout(400);
    ok(await encima(), `${et}: el modal de confirmación "Eliminar" queda encima del menú`);
    await p.keyboard.press('Escape');
    await p.goto(BASE + '/admin'); await p.waitForSelector('.admin-loading-screen', { state: 'detached' });
    // Postulaciones: "Ver calificación" (z 2000, el más bajo del panel). Se espera a que
    // termine el fundido de 0,5s de la vista: mientras dura, su opacidad < 1 crea un
    // contexto de apilamiento y el modal queda bajo el menú (DESIGN.md §9).
    await p.locator('.adm-nav-tab').nth(4).click();
    await p.waitForTimeout(700);
    await p.locator('button[title="Ver Calificación de la Empresa"]').first().click();
    await p.waitForTimeout(400);
    ok(await encima(), `${et}: el modal de calificación (z-index 2000) queda encima del menú`);
    if (t.dsf) await shot(p, `${et}@1.5-modal-calificacion`);
    await c.close();
  }
}

async function verificarCarga(browser) {
  console.log('\n▶ Pantalla de carga de Inicio encima del panel montado');
  const pedidos = [];
  let lento = false;
  const c = await contexto(browser, { w: 1276, h: 551, dsf: 1.5, pedidos, demora: (u) => (lento && u.includes('/vacantes/stats') ? 1500 : 0) });
  const p = await abrir(c);
  const cuenta = (frag) => pedidos.filter(x => x.includes(frag)).length;
  await p.locator('.adm-nav-tab').nth(1).click();
  await p.waitForTimeout(800);
  await p.evaluate(() => { window.__nav = document.querySelector('.adm-nav'); window.__tab = document.querySelectorAll('.adm-nav-tab')[1]; });
  const stats0 = cuenta('/vacantes/stats'), todas0 = cuenta('/vacantes/admin/todas');
  lento = true;
  await p.locator('.adm-nav-tab').nth(0).click();
  await p.waitForSelector('.admin-loading-screen');
  await p.waitForTimeout(150);
  const durante = await p.evaluate(() => {
    const wrap = document.querySelector('.admin-layout-wrapper');
    const e = document.elementFromPoint(innerWidth / 2, innerHeight * 0.7);
    const g = document.querySelector('.adm-nav-glider');
    return {
      mismoMenu: window.__nav === document.querySelector('.adm-nav') && window.__tab === document.querySelectorAll('.adm-nav-tab')[1],
      entrada: document.getAnimations().filter(a => a.animationName === 'admn-tab-in' && a.playState === 'running').length,
      gliderTrans: getComputedStyle(g).transform,
      inert: wrap.inert, encima: !!e?.closest('.admin-loading-screen'),
    };
  });
  ok(durante.mismoMenu, 'al volver a Inicio el menú es el mismo nodo (no se vuelve a montar)');
  ok(durante.entrada === 0, `sin animación de entrada de las pestañas (${durante.entrada} en curso)`);
  const xGlider = Number(durante.gliderTrans.match(/matrix\([^,]+,[^,]+,[^,]+,[^,]+,\s*([-\d.]+)/)?.[1] ?? 0);
  ok(xGlider > 50, `el glider sale de su sitio, no de x=0 (translateX ${Math.round(xGlider)}px durante la carga)`);
  ok(durante.inert && durante.encima, 'mientras carga, la pantalla cubre el panel y el panel está inert');
  await shot(p, 'estado-cargando-inicio');
  // Clic y Tab por debajo no hacen nada
  const pos = await p.evaluate(() => { const b = document.querySelectorAll('.adm-nav-tab')[1].getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; });
  await p.mouse.click(pos.x, pos.y); // sobre la pestaña Egresados, tapada por la pantalla de carga
  await p.keyboard.press('Tab');
  const foco = await p.evaluate(() => !!document.activeElement?.closest('.admin-layout-wrapper'));
  ok(!foco, 'mientras carga, Tab no entra al panel');
  await p.waitForSelector('.admin-loading-screen', { state: 'detached', timeout: 10000 });
  await p.waitForTimeout(300);
  const tras = await p.evaluate(() => document.querySelectorAll('.adm-nav-tab')[0].getAttribute('aria-current'));
  ok(tras === 'page', 'el clic sobre Egresados durante la carga no cambió de vista (sigue en Inicio)');
  ok(cuenta('/vacantes/stats') === stats0 + 1 && cuenta('/vacantes/admin/todas') === todas0 + 1,
    `al volver a Inicio recarga los datos (stats +${cuenta('/vacantes/stats') - stats0}, vacantes +${cuenta('/vacantes/admin/todas') - todas0})`);
  ok(await p.evaluate(() => !document.querySelector('.admin-layout-wrapper').inert), 'al terminar de cargar el panel deja de estar inert');
  await c.close();
}

async function verificarMovilToasts(browser) {
  console.log('\n▶ Móvil: toasts frente a la barra inferior');
  for (const t of [{ w: 390, h: 844, dsf: 2 }, { w: 360, h: 640, dsf: 2 }, { w: 820, h: 1180 }]) {
    const et = `${t.w}x${t.h}`;
    const c = await contexto(browser, t);
    const p = await abrir(c);
    await p.locator('.adm-nav-tab').nth(1).click();
    await p.locator('button[title^="Click para"]').first().click(); // toast.success("Usuario desactivado")
    await p.waitForSelector('.Toastify__toast', { timeout: 5000 });
    await p.waitForTimeout(700);
    const tt = await p.evaluate(() => {
      const bar = document.querySelector('.adm-nav-row').getBoundingClientRect();
      const b = document.querySelector('.Toastify__toast').getBoundingClientRect();
      const sobre = Math.max(0, Math.min(b.bottom, bar.bottom) - Math.max(b.top, bar.top)) * Math.max(0, Math.min(b.right, bar.right) - Math.max(b.left, bar.left));
      return { area: Math.round(sobre), bottom: Math.round(b.bottom), barTop: Math.round(bar.top) };
    });
    ok(tt.area === 0, `${et}: el toast no tapa la barra inferior (toast termina en ${tt.bottom}, barra en ${tt.barTop})`);
    await shot(p, `${et}-toast`);
    await c.close();
  }
}

/** Lo que define el scroll de una ruta: overflow calculado de html/body y adónde va la rueda. */
async function medirScroll(p) {
  const estilo = await p.evaluate(() => {
    const h = getComputedStyle(document.documentElement), b = getComputedStyle(document.body);
    return { html: `${h.overflowX}/${h.overflowY}`, body: `${b.overflowX}/${b.overflowY}`, panelMontado: !!document.querySelector('.admin-layout-wrapper') };
  });
  await p.evaluate(() => { window.scrollTo(0, 0); document.querySelectorAll('*').forEach(e => { if (e.scrollTop) e.scrollTop = 0; }); });
  await p.mouse.move(p.viewportSize().width / 2, p.viewportSize().height / 2);
  await p.mouse.wheel(0, 400);
  await p.waitForTimeout(400);
  const desplazo = await p.evaluate(() => {
    const otros = [...document.querySelectorAll('*')].filter(e => e.scrollTop > 0).map(e => `${e.tagName.toLowerCase()}.${String(e.className).split(' ')[0]}:${Math.round(e.scrollTop)}`);
    return { ventana: Math.round(scrollY), interno: otros.join(',') || '—' };
  });
  return { ...estilo, ...desplazo };
}

async function verificarSalidaDelPanel(browser) {
  console.log('\n▶ Salida del panel: las demás páginas como en una carga limpia');
  const w = 1276, h = 551;
  const rutas = [['/admin/acceso', 'acceso admin', null], ['/', 'landing', null], ['/empresa-dashboard', 'empresa', 'empresa'], ['/vacantes-dashboard', 'egresado', 'egresado']];
  const sembrar = (p, perfil) => p.evaluate(([perfil, emp, egr]) => {
    const u = perfil === 'empresa' ? emp : egr;
    localStorage.setItem('usuario', JSON.stringify(u)); localStorage.setItem('token', 'demo-token');
  }, [perfil, EMPRESA, EGRESADO]);
  const limpiar = (p) => p.evaluate(() => { localStorage.removeItem('usuario'); localStorage.removeItem('token'); });

  // Línea base: cada ruta en una carga limpia, sin haber pasado por el panel.
  const base = {};
  for (const [ruta, nombre, perfil] of rutas) {
    const c = await contexto(browser, { w, h, perfil });
    const p = await c.newPage();
    await p.goto(BASE + ruta, { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(1500);
    base[nombre] = await medirScroll(p);
    await c.close();
  }

  const recorrer = async (p, etiqueta) => {
    for (const [ruta, nombre, perfil] of rutas) {
      await limpiar(p);
      if (perfil) await sembrar(p, perfil);
      await p.evaluate((r) => { history.pushState({}, '', r); dispatchEvent(new PopStateEvent('popstate')); }, ruta);
      await p.waitForTimeout(1500);
      const tras = await medirScroll(p);
      const b = base[nombre];
      ok(!tras.panelMontado, `${etiqueta} → ${nombre}: el panel de administración ya no está montado`);
      ok(tras.html === b.html && tras.body === b.body, `${etiqueta} → ${nombre}: overflow igual que en carga limpia (html ${tras.html} / body ${tras.body}; limpia ${b.html} / ${b.body})`);
      ok(tras.ventana === b.ventana && tras.interno === b.interno, `${etiqueta} → ${nombre}: la rueda desplaza igual (ventana ${tras.ventana} vs ${b.ventana}; interno ${tras.interno} vs ${b.interno})`);
    }
  };

  // (a) Cerrar sesión: recarga completa a /admin/acceso.
  {
    const c = await contexto(browser, { w, h });
    const p = await abrir(c);
    const enPanel = await p.evaluate(() => getComputedStyle(document.body).overflowX);
    ok(enPanel === 'clip', `con el panel montado, <body> usa overflow-x: ${enPanel}`);
    await p.locator('.adm-nav-user-avatar').click();
    await p.getByRole('menuitem', { name: 'Cerrar sesión' }).click();
    await p.getByRole('button', { name: 'Cerrar sesión', exact: true }).click();
    await p.waitForURL(BASE + '/admin/acceso');
    ok(await p.evaluate(() => sessionStorage.getItem('admin-sesion') === null), 'cerrar sesión borra admin-sesion');
    await p.waitForTimeout(800);
    await recorrer(p, 'tras cerrar sesión');
    await c.close();
  }
  // (b) Salir del panel sin recarga (SPA): la regla body:has() deja de aplicarse.
  // Se borra admin-sesion antes (con sesión válida /admin/acceso devuelve al panel).
  {
    const c = await contexto(browser, { w, h });
    const p = await abrir(c);
    await p.evaluate(() => sessionStorage.removeItem('admin-sesion'));
    await recorrer(p, 'sin recarga');
    await c.close();
  }
}

async function capturasEstados(browser) {
  console.log('\n▶ Estados (1276×551 @1.5x) y los otros dos menús para comparar');
  const t = { w: 1276, h: 551, dsf: 1.5 };
  let c = await contexto(browser, t);
  let p = await abrir(c);
  await p.locator('.adm-nav-tab').nth(2).hover();
  await p.waitForTimeout(250);
  await shot(p, 'estado-hover', { clip: { x: 0, y: 0, width: t.w, height: 140 } });
  await p.locator('.adm-nav-tab').nth(5).click();
  await p.waitForTimeout(500);
  await shot(p, 'estado-activo-metricas', { clip: { x: 0, y: 0, width: t.w, height: 140 } });
  await p.locator('.adm-nav-tab').nth(0).click();
  await p.waitForSelector('.admin-loading-screen', { state: 'detached' });
  await p.waitForTimeout(500);
  await shot(p, 'comparar-admin-1276x551');
  await c.close();
  for (const [w, h] of MONITORES) {
    c = await contexto(browser, { w, h });
    p = await abrir(c);
    await shot(p, `comparar-admin-${w}x${h}`);
    await c.close();
  }

  c = await contexto(browser, { ...t, reducedMotion: 'reduce' });
  p = await abrir(c);
  const rm = await p.evaluate(() => ({
    glider: getComputedStyle(document.querySelector('.adm-nav-glider')).transitionProperty,
    entrada: getComputedStyle(document.querySelector('.adm-nav-tablist li')).animationName,
    filete: getComputedStyle(document.querySelectorAll('.adm-nav-tab')[1], '::before').transitionDuration,
  }));
  ok(rm.glider === 'opacity' && rm.entrada === 'none' && rm.filete === '0s', `reduced-motion: glider solo cruza opacidad (${rm.glider}), sin entrada escalonada (${rm.entrada}), filete sin transición (${rm.filete})`);
  await shot(p, 'estado-reduced-motion', { clip: { x: 0, y: 0, width: t.w, height: 140 } });
  await c.close();

  const alturas = {};
  for (const [perfil, ruta, sel, nav] of [['egresado', '/vacantes-dashboard', '.ex-tab', '.ex-nav'], ['empresa', '/empresa-dashboard', '.emp-nav-tab', '.emp-nav']]) {
    c = await contexto(browser, { ...t, perfil });
    p = await abrir(c, ruta, sel);
    await shot(p, `comparar-${perfil}-1276x551`);
    alturas[perfil] = await p.evaluate((s) => Math.round(document.querySelector(s).getBoundingClientRect().height), nav);
    await c.close();
    for (const [w, h] of MONITORES) {
      c = await contexto(browser, { w, h, perfil });
      p = await abrir(c, ruta, sel);
      await shot(p, `comparar-${perfil}-${w}x${h}`);
      await c.close();
    }
  }
  c = await contexto(browser, t);
  p = await abrir(c);
  alturas.admin = await p.evaluate(() => Math.round(document.querySelector('.adm-nav').getBoundingClientRect().height));
  await c.close();
  console.log(`    alto del menú en 1276×551: egresado ${alturas.egresado}px · empresa ${alturas.empresa}px · admin ${alturas.admin}px`);
  ok(alturas.admin === alturas.empresa, `admin y empresa miden lo mismo de alto (${alturas.admin} / ${alturas.empresa})`);

  const pares = [['1276x551', '1276×551 a escala 1,5 (pantalla real del usuario)'], ...MONITORES.map(([w, h]) => [`${w}x${h}`, `${w}×${h}`])];
  await writeFile(path.join(OUT, 'comparar.html'), `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Menús Egresado, Empresa y Admin</title>
<style>
  :root { --verde: #00482B; --papel: #fff; --fondo: #f0f2f5; --gris: #4D4D4D; }
  body { margin: 0; padding: 24px 16px; background: var(--fondo); color: var(--gris); font-family: Montserrat, 'Segoe UI', sans-serif; }
  h1 { margin: 0 0 4px; font-size: 1.1rem; color: var(--verde); }
  h2 { margin: 28px 0 10px; font-size: .9rem; color: var(--verde); }
  p { margin: 0 0 20px; font-size: .85rem; }
  .trio { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 420px), 1fr)); gap: 20px; }
  figure { margin: 0; background: var(--papel); border-radius: 10px; padding: 12px; box-shadow: 0 6px 20px -14px rgba(0,72,43,.4); }
  figcaption { font-weight: 700; color: var(--verde); font-size: .8rem; margin-bottom: 8px; text-transform: uppercase; letter-spacing: .04em; }
  img { width: 100%; height: auto; display: block; border: 1px solid rgba(77,77,77,.14); }
</style></head><body>
<h1>Menú "Sello en Marcha": Egresado, Empresa y Administrador lado a lado</h1>
<p>Capturas generadas por <code>npm run capturar:menu-admin</code> con datos de prueba. Alto del menú en 1276×551: egresado ${alturas.egresado}px · empresa ${alturas.empresa}px · admin ${alturas.admin}px.</p>
${pares.map(([id, txt]) => `<h2>${txt}</h2>
<div class="trio">
  <figure><figcaption>Egresado · /vacantes-dashboard</figcaption><img src="comparar-egresado-${id}.png" alt="Menú de egresado en ${txt}"></figure>
  <figure><figcaption>Empresa · /empresa-dashboard</figcaption><img src="comparar-empresa-${id}.png" alt="Menú de empresa en ${txt}"></figure>
  <figure><figcaption>Administrador · /admin</figcaption><img src="comparar-admin-${id}.png" alt="Menú de administrador en ${txt}"></figure>
</div>`).join('\n')}
</body></html>
`);
  console.log('  · comparar.html');
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  try {
    for (const t of [
      { w: 390, h: 844, dsf: 2 }, { w: 360, h: 640, dsf: 2 }, { w: 768, h: 1024 }, { w: 820, h: 1180 },
      { w: 1280, h: 800 }, { w: 1280, h: 650 }, { w: 1276, h: 551, dsf: 1.5 },
      ...MONITORES.map(([w, h]) => ({ w, h })),
    ]) await verificarTamano(browser, t);
    // Borde del corte: 925 debe ser barra inferior; 926 barra superior entera
    for (const w of [CORTE - 1, CORTE]) await verificarTamano(browser, { w, h: 900 });
    await verificarProximamente(browser);
    await verificarCapas(browser);
    await verificarCarga(browser);
    await verificarMovilToasts(browser);
    await verificarSalidaDelPanel(browser);
    await capturasEstados(browser);
  } finally {
    await browser.close();
  }
  // Font Awesome (cdnjs) lo pide Admin.jsx: se aborta igual que cualquier host externo.
  console.log(`
  hosts externos abortados: ${[...externos].join(', ') || 'ninguno'}`);
  ok(![...externos].some(h => /vercel\.app|backend/i.test(h)), 'ninguna petición al backend salió del simulador');
  console.log(fallos.length ? `\n✗ ${fallos.length} fallo(s):\n - ${fallos.join('\n - ')}` : '\n✓ Todo en orden.');
  process.exit(fallos.length ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
