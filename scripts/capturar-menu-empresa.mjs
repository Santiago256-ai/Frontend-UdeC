/**
 * Menú de navegación de Empresa (EmpresaNav, Rumbo B "Sello en Marcha"):
 * verificación con geometría real + evidencia visual.
 *
 * Uso:
 *   1. En una terminal:  npm run dev                 (Vite en http://localhost:5173)
 *   2. En otra:          npm run capturar:menu-empresa
 *
 * Comprueba en 390×844, 360×640, 768×1024, 820×1180, 1280×800, 1280×650 y
 * 1276×551 a escala 1,5 (la pantalla real del usuario):
 *   - los 7 destinos visibles enteros (boundingBox dentro del viewport, etiqueta
 *     sin recortar), sin scroll horizontal de la página;
 *   - barra superior desde 860px, barra inferior de solo íconos por debajo;
 *   - nada tapa el contenido (arriba: el contenido empieza bajo el menú; abajo:
 *     el final del contenido queda sobre la barra inferior);
 *   - navegación por clic y por teclado (Tab + Enter, foco visible) en los 7;
 *   - sticky: el menú sigue arriba tras el scroll y queda encima de la cabecera
 *     de filtros (zIndex 50); los modales quedan encima del menú;
 *   - móvil: ChatWidget y los toasts no tapan la barra inferior.
 * En monitores (1920×1080, 2560×1440): fila centrada, identidad en sus bordes,
 * logos a su escala y contenido con márgenes simétricos.
 * Salida del panel: tras cerrar sesión (navegación SPA, sin recarga) la landing,
 * /admin/acceso y /vacantes-dashboard conservan el overflow y el scroll de una
 * carga limpia, y los sondeos del panel (notificaciones 30s, chats 20s) se
 * detienen al desmontar (reloj simulado).
 * Mensajes: la pestaña carga la lista de chats (GET mis-chats/empresa) y abre
 * una conversación (GET historial) sin enviar nada.
 * Además captura el menú de Egresado en 1276×551, 1920×1080 y 2560×1440 para
 * comparar.html.
 *
 * El backend se intercepta con datos mínimos. Sale con código 1 si algo falla.
 * Evidencia en frontend/tests/evidencia/menu-empresa/.
 */
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const BASE = process.env.MENU_URL || 'http://localhost:5173';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, '../tests/evidencia/menu-empresa');
const CORTE = 860; // desde aquí, barra superior; por debajo, barra inferior
const MONITORES = [[1920, 1080], [2560, 1440]];

const EMPRESA = { id: 7, nombres: 'Dollarcity S.A.S.', nombre: 'Dollarcity S.A.S.', rol: 'empresa', correo: 'rrhh@dollarcity.co' };
const EGRESADO = { id: 'egresado-demo', nombres: 'Deivid Santiago', apellidos: 'Olivar Rodriguez', programa: 'Ingeniería Ambiental', rol: 'EGRESADO' };

const vac = (id, extra = {}) => ({
  id, titulo: `Analista ambiental junior ${id}`, descripcion: '<p>Apoyo al sistema de gestión ambiental.</p>',
  estado: 'ABIERTA', modalidad: 'PRESENCIAL', ubicacion: 'Soacha', salario: '2500000', tipoSalario: 'FIJO',
  tipo: 'Término Fijo', jornada: 'Tiempo Completo', horario: 'Lunes a viernes', fechaCierre: '2026-12-24',
  fechaCreacion: '2026-10-01', limitePostulantes: 8, _count: { postulaciones: 2 }, ...extra,
});
const VACANTES = [1, 2, 3, 4, 5, 6].map(i => vac(i));          // badge Gestión = 6
const ELIMINADAS = [vac(21, { estado: 'ELIMINADA' }), vac(22, { estado: 'ELIMINADA' })];
const NOTIS = [1, 2, 3].map(i => ({ id: i, vista: false, tipo: 'POSTULACION', mensaje: `Nueva postulación ${i}`, fecha: '2026-10-29T15:00:00Z' }))
  .concat([{ id: 4, vista: true, tipo: 'MENSAJE', mensaje: 'Mensaje leído', fecha: '2026-10-28T15:00:00Z' }]); // badge Avisos = 3
const CHATS = [ // badge Mensajes = 2 (conversaciones con pendientes > 0)
  { id: 'c1', usuarioId: 11, vacanteId: 1, usuario: { id: 11, nombre: 'Laura Gómez' }, vacante: { titulo: 'Analista ambiental' }, pendientes: 3 },
  { id: 'c2', usuarioId: 12, vacanteId: 2, usuario: { id: 12, nombre: 'Andrés Pinzón' }, vacante: { titulo: 'Auxiliar HSE' }, pendientes: 1 },
  { id: 'c3', usuarioId: 13, vacanteId: 3, usuario: { id: 13, nombre: 'Camila Ruiz' }, vacante: { titulo: 'Practicante' }, pendientes: 0 },
];
const HISTORIAL = { chatActivo: true, mensajes: [
  { id: 'm1', senderType: 'EGRESADO', contenido: 'Buenas tardes, quedo atenta a la entrevista.', fechaEnvio: '2026-10-29T15:10:00Z' },
  { id: 'm2', senderType: 'EMPRESA', contenido: 'Gracias, Laura. Le escribimos mañana.', fechaEnvio: '2026-10-29T15:20:00Z' },
] };
const POSTULACIONES = [11, 12].map(i => ({
  id: i, estado: 'PENDIENTE', fecha: '2026-10-29T14:00:00Z', anclado: false, vacanteId: 1, egresadoId: i,
  egresado: { id: i, nombres: i === 11 ? 'Laura' : 'Andrés', apellidos: i === 11 ? 'Gómez' : 'Pinzón', programa: 'Ingeniería Ambiental' },
  vacante: { id: 1, titulo: 'Analista ambiental junior 1' },
}));

function stub(url) {
  if (url.includes('/metricas-pro')) return { vacantes: VACANTES, postulacionesRecientes: [], notificacionesRecientes: [] };
  if (url.includes('estado=ELIMINADA')) return ELIMINADAS;
  if (url.includes('/vacantes')) return VACANTES;
  if (url.includes('/notificaciones/')) return NOTIS;
  if (url.includes('/mis-chats/')) return CHATS;
  if (url.includes('/historial')) return HISTORIAL;
  if (url.includes('/postulaciones')) return POSTULACIONES;
  return {};
}

const fallos = [];
const ok = (cond, msg) => { if (!cond) fallos.push(msg); console.log(`  ${cond ? '✓' : '✗'} ${msg}`); };

async function contexto(browser, { w, h, dsf = 1, usuario = EMPRESA, reducedMotion = 'no-preference', pedidos = null }) {
  const c = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dsf, reducedMotion });
  await c.addInitScript(([u]) => { localStorage.setItem('usuario', JSON.stringify(u)); localStorage.setItem('token', 'demo-token'); }, [usuario]);
  await c.route('**/backend-ude-c.vercel.app/**', r => {
    if (pedidos) pedidos.push(`${r.request().method()} ${new URL(r.request().url()).pathname}`);
    r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(stub(r.request().url())) });
  });
  return c;
}

async function abrir(c, ruta = '/empresa-dashboard', sel = '.emp-nav-tab') {
  const p = await c.newPage();
  p.on('pageerror', e => fallos.push(`pageerror ${ruta}: ${e.message}`));
  await p.goto(BASE + ruta, { waitUntil: 'domcontentloaded' });
  await p.waitForSelector(sel, { timeout: 15000 });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(900); // entrada escalonada + glider
  return p;
}

const shot = async (p, nombre, opts = {}) => { await p.screenshot({ path: path.join(OUT, `${nombre}.png`), ...opts }); console.log(`  · ${nombre}.png`); };

/** Geometría del menú en el estado actual. */
const geometria = (p) => p.evaluate(() => {
  const r = (el) => { const b = el.getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height, r: b.right, b: b.bottom }; };
  const nav = document.querySelector('.emp-nav'), row = document.querySelector('.emp-nav-row');
  const tabs = [...document.querySelectorAll('.emp-nav-tab')];
  return {
    vw: innerWidth, vh: innerHeight,
    pageScrollW: document.documentElement.scrollWidth,
    nav: r(nav), row: r(row), rowPos: getComputedStyle(row).position,
    rowScroll: row.scrollWidth - row.clientWidth,
    tabs: tabs.map(t => {
      const lab = t.querySelector('.emp-nav-tab-label');
      const ls = getComputedStyle(lab);
      return { name: t.getAttribute('aria-label'), ...r(t), labelVisible: ls.display !== 'none', labelCortada: lab.scrollWidth > lab.clientWidth + 0.5, current: t.getAttribute('aria-current') };
    }),
    avatar: r(document.querySelector('.emp-nav-user-avatar')),
    font: getComputedStyle(tabs[0]).fontFamily,
    content: r(document.querySelector('main.content-inner')),
    contentPadB: parseFloat(getComputedStyle(document.querySelector('main.content-inner')).paddingBottom),
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
  ok(abajo ? g.rowPos === 'fixed' : g.rowPos !== 'fixed', `${etiqueta}: ${abajo ? 'barra inferior fija' : 'barra horizontal arriba'} (position ${g.rowPos})`);
  ok(g.tabs.every(b => b.x >= -0.5 && b.r <= g.vw + 0.5 && b.w > 0 && b.h >= (abajo ? 44 : 30)), `${etiqueta}: los 7 enteros dentro del viewport (x ${g.tabs.map(b => `${Math.round(b.x)}–${Math.round(b.r)}`).join(', ')})`);
  ok(g.rowScroll <= 0.5, `${etiqueta}: la fila no necesita scroll (sobra ${Math.round(g.rowScroll)}px)`);
  if (!abajo) ok(g.tabs.every(b => b.labelVisible && !b.labelCortada), `${etiqueta}: etiquetas visibles y sin recortar`);
  else ok(g.tabs.every(b => !b.labelVisible && b.name), `${etiqueta}: solo íconos, nombre accesible presente`);
  ok(g.pageScrollW <= g.vw, `${etiqueta}: sin scroll horizontal de página (${g.pageScrollW} ≤ ${g.vw})`);
  ok(g.avatar.x >= 0 && g.avatar.r <= g.vw && g.avatar.b <= g.vh, `${etiqueta}: avatar (perfil / cerrar sesión) a la vista`);
  ok(/Montserrat/.test(g.font) && !/^Inter/.test(g.font), `${etiqueta}: Montserrat en el menú`);
  if (!abajo) ok(g.content.y >= g.nav.b - 0.5, `${etiqueta}: el contenido empieza bajo el menú (${Math.round(g.content.y)} ≥ ${Math.round(g.nav.b)})`);
  if (!abajo) {
    const m = await p.evaluate(() => {
      const r = (s) => document.querySelector(s).getBoundingClientRect();
      const ul = r('.emp-nav-tablist'), logo = r('.emp-nav-brand-logo'), udec = r('.emp-nav-brand-udec'), av = r('.emp-nav-user-avatar');
      const pad = parseFloat(getComputedStyle(document.querySelector('.emp-nav-identity')).paddingLeft);
      const hub = r('.vacantes-header-container-premium'), grid = r('.vacantes-main-grid');
      const cards = [...document.querySelectorAll('.pro-vacante-card')].map(c => c.getBoundingClientRect());
      const porFila = cards.filter(c => Math.abs(c.top - cards[0].top) < 2).length;
      return { centroUl: ul.left + ul.width / 2, pad, logoX: logo.left, logoH: logo.height, udecH: udec.height, avR: av.right,
        hubL: hub.left, hubR: innerWidth - hub.right, hubW: hub.width, gridL: grid.left, gridR: innerWidth - grid.right, cardW: cards[0]?.width, porFila };
    });
    ok(Math.abs(m.centroUl - g.vw / 2) <= 1, `${etiqueta}: fila de pestañas centrada (centro ${m.centroUl.toFixed(1)} vs ${g.vw / 2})`);
    ok(Math.abs(m.logoX - m.pad) <= 1 && Math.abs((g.vw - m.avR) - m.pad) <= 1, `${etiqueta}: identidad en sus bordes (logo en x=${Math.round(m.logoX)}, avatar a ${Math.round(g.vw - m.avR)}px del borde; relleno ${Math.round(m.pad)})`);
    ok(Math.round(m.logoH) === 34 && Math.round(m.udecH) === 40, `${etiqueta}: logos a su escala (Empres360 ${Math.round(m.logoH)}px, UdeC ${Math.round(m.udecH)}px)`);
    ok(Math.abs(m.hubL - m.hubR) <= 2 && Math.abs(m.gridL - m.gridR) <= 2, `${etiqueta}: contenido con márgenes simétricos (cabecera ${Math.round(m.hubL)}/${Math.round(m.hubR)}, grilla ${Math.round(m.gridL)}/${Math.round(m.gridR)})`);
    console.log(`    contenido: cabecera ${Math.round(m.hubW)}px de ancho · ${m.porFila} tarjetas por fila de ${Math.round(m.cardW)}px`);
  }
  console.log(`    alto del menú ${Math.round(g.nav.h)}px · fila ${Math.round(g.row.h)}px`);
  await shot(p, `${etiqueta}-default`);

  // --- Final del contenido sobre la barra inferior ---
  if (abajo) {
    await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await p.waitForTimeout(200);
    const fin = await p.evaluate(() => {
      const main = document.querySelector('main.content-inner'), row = document.querySelector('.emp-nav-row');
      const items = [...main.querySelectorAll('*')].filter(e => e.offsetParent !== null && e.getClientRects().length);
      const ultimo = Math.max(...items.map(e => e.getBoundingClientRect().bottom));
      return { ultimo, barTop: row.getBoundingClientRect().top };
    });
    ok(fin.ultimo <= fin.barTop + 0.5, `${etiqueta}: al final del scroll el contenido termina sobre la barra (${Math.round(fin.ultimo)} ≤ ${Math.round(fin.barTop)})`);
    await shot(p, `${etiqueta}-fin-scroll`);
    await p.evaluate(() => window.scrollTo(0, 0));
  }

  // --- Clic en los 7 ---
  const firmas = new Set();
  for (let i = 0; i < 7; i++) {
    await p.locator('.emp-nav-tab').nth(i).click();
    await p.waitForTimeout(350);
    const s = await p.evaluate((i) => {
      const t = document.querySelectorAll('.emp-nav-tab')[i];
      const main = document.querySelector('main.content-inner');
      return { current: t.getAttribute('aria-current'), activos: document.querySelectorAll('.emp-nav-tab[aria-current="page"]').length, firma: (main.firstElementChild?.className || '') + '|' + main.innerText.slice(0, 30) };
    }, i);
    firmas.add(s.firma);
    ok(s.current === 'page' && s.activos === 1, `${etiqueta}: clic en destino ${i + 1} → aria-current="page"`);
  }
  ok(firmas.size === 7, `${etiqueta}: los 7 clics muestran 7 vistas distintas`);

  // --- Teclado: Tab hasta las pestañas, foco visible, Enter navega ---
  // Recarga: tras un clic, Chromium usa el botón pulsado como punto de partida
  // del siguiente Tab aunque se haga blur(); hay que empezar desde el documento.
  await p.reload({ waitUntil: 'domcontentloaded' });
  await p.waitForSelector('.emp-nav-tab');
  await p.waitForTimeout(900);
  await p.mouse.move(0, 0);
  let llegadas = 0;
  for (let n = 0; n < 12 && llegadas === 0; n++) {
    await p.keyboard.press('Tab');
    if (await p.evaluate(() => document.activeElement?.classList.contains('emp-nav-tab'))) llegadas = 1;
  }
  ok(llegadas === 1, `${etiqueta}: Tab llega a la primera pestaña`);
  for (let i = 0; i < 7; i++) {
    if (i > 0) await p.keyboard.press('Tab');
    const f = await p.evaluate((i) => {
      const a = document.activeElement, t = document.querySelectorAll('.emp-nav-tab')[i];
      const s = getComputedStyle(a);
      return { esEsta: a === t, outline: `${s.outlineStyle} ${s.outlineWidth}`, focusVisible: a.matches(':focus-visible') };
    }, i);
    ok(f.esEsta && f.focusVisible && f.outline === 'solid 2px', `${etiqueta}: foco visible en destino ${i + 1} (${f.outline})`);
    if (i === 2) await shot(p, `${etiqueta}-foco-teclado`);
    await p.keyboard.press('Enter');
    await p.waitForTimeout(300);
    const cur = await p.evaluate((i) => document.querySelectorAll('.emp-nav-tab')[i].getAttribute('aria-current'), i);
    ok(cur === 'page', `${etiqueta}: Enter en destino ${i + 1} navega`);
  }
  await c.close();
}

async function verificarCapas(browser) {
  console.log('\n▶ Sticky y capas (1276×551 @1.5x y 1280×650)');
  for (const t of [{ w: 1276, h: 551, dsf: 1.5 }, { w: 1280, h: 650 }]) {
    const et = `${t.w}x${t.h}`;
    const c = await contexto(browser, t);
    const p = await abrir(c);
    const antes = await p.evaluate(() => {
      const nav = document.querySelector('.emp-nav').getBoundingClientRect();
      const filtros = document.querySelector('.vacantes-header-container-premium').getBoundingClientRect();
      return { navB: nav.bottom, filtrosT: filtros.top };
    });
    ok(antes.filtrosT >= antes.navB, `${et}: la cabecera de filtros arranca bajo el menú (${Math.round(antes.filtrosT)} ≥ ${Math.round(antes.navB)})`);
    for (const y of [120, 400]) {
      await p.mouse.move(t.w / 2, 300);
      await p.mouse.wheel(0, y);
      await p.waitForTimeout(350);
      const s = await p.evaluate(() => {
        const nav = document.querySelector('.emp-nav'), r = nav.getBoundingClientRect();
        const puntos = [0.1, 0.5, 0.9].map(f => document.elementFromPoint(innerWidth * f, r.top + r.height * 0.75));
        return { top: r.top, scrollY, encima: puntos.every(e => nav.contains(e)) };
      });
      ok(s.scrollY > 0 && Math.abs(s.top) < 0.5, `${et}: tras ${Math.round(s.scrollY)}px de scroll el menú sigue arriba (top ${s.top})`);
      ok(s.encima, `${et}: el menú queda encima del contenido (cabecera de filtros zIndex 50 incluida)`);
    }
    if (t.dsf) await shot(p, `${et}@1.5-sticky-scroll`);
    // Modales encima del menú: cierre de sesión y "Mover a la papelera"
    await p.evaluate(() => window.scrollTo(0, 0));
    await p.locator('.emp-nav-user-avatar').click();
    if (t.dsf) await shot(p, `${et}@1.5-menu-perfil`);
    await p.getByRole('menuitem', { name: 'Cerrar sesión' }).click();
    await p.waitForTimeout(300);
    const m1 = await p.evaluate(() => { const r = document.querySelector('.emp-nav').getBoundingClientRect(); const e = document.elementFromPoint(innerWidth / 2, r.top + 30); return !document.querySelector('.emp-nav').contains(e) && !!e.closest('.modal-overlay'); });
    ok(m1, `${et}: el modal de cerrar sesión queda encima del menú`);
    if (t.dsf) await shot(p, `${et}@1.5-modal-encima`);
    await p.getByRole('button', { name: 'Cancelar' }).click();
    await p.locator('.pro-btn-footer.delete').first().click();
    await p.waitForTimeout(300);
    const m2 = await p.evaluate(() => { const r = document.querySelector('.emp-nav').getBoundingClientRect(); const e = document.elementFromPoint(innerWidth / 2, r.top + 30); return !document.querySelector('.emp-nav').contains(e) && !!e.closest('.modal-overlay'); });
    ok(m2, `${et}: el modal "Mover a la papelera" queda encima del menú`);
    await c.close();
  }
}

async function verificarMovilFlotantes(browser) {
  console.log('\n▶ Móvil: ChatWidget y toasts frente a la barra inferior');
  for (const t of [{ w: 390, h: 844, dsf: 2 }, { w: 360, h: 640, dsf: 2 }, { w: 820, h: 1180 }]) {
    const et = `${t.w}x${t.h}`;
    const c = await contexto(browser, t);
    const p = await abrir(c);
    const solapa = (sel) => p.evaluate((sel) => {
      const bar = document.querySelector('.emp-nav-row').getBoundingClientRect();
      const els = [...document.querySelectorAll(sel)].filter(e => e.getClientRects().length);
      if (!els.length) return null;
      const b = els.map(e => e.getBoundingClientRect()).reduce((a, r) => ({ left: Math.min(a.left, r.left), right: Math.max(a.right, r.right), top: Math.min(a.top, r.top), bottom: Math.max(a.bottom, r.bottom) }));
      const sobre = Math.max(0, Math.min(b.bottom, bar.bottom) - Math.max(b.top, bar.top)) * Math.max(0, Math.min(b.right, bar.right) - Math.max(b.left, bar.left));
      return { area: Math.round(sobre), bottom: Math.round(b.bottom), barTop: Math.round(bar.top) };
    }, sel);
    // Toast real: escribir en el buscador y "Limpiar filtros" → toast.info("Filtros restablecidos")
    await p.locator('input[placeholder^="Buscar vacante"]').fill('analista');
    await p.locator('button[title="Limpiar filtros"]').click();
    await p.waitForSelector('.Toastify__toast', { timeout: 5000 });
    await p.waitForTimeout(700);
    const tt = await solapa('.Toastify__toast');
    ok(tt && tt.area === 0, `${et}: el toast no tapa la barra inferior (toast termina en ${tt?.bottom}, barra en ${tt?.barTop})`);
    await shot(p, `${et}-toast`);
    await p.locator('.Toastify__close-button').first().click().catch(() => {});
    // ChatWidget real: tarjeta → postulaciones → "Iniciar conversación" → cerrar el modal
    await p.locator('.pro-vacante-card').first().click();
    await p.locator('button[title="Iniciar conversación"]').first().click();
    await p.waitForSelector('.chat-widget-container');
    await p.keyboard.press('Escape');
    await p.evaluate(() => document.querySelector('.modal-overlay')?.click());
    await p.waitForTimeout(400);
    const cw = await solapa('.chat-widget-container');
    ok(cw && cw.area === 0, `${et}: ChatWidget no tapa la barra inferior (widget termina en ${cw?.bottom}, barra en ${cw?.barTop})`);
    await shot(p, `${et}-chatwidget`);
    await c.close();
  }
}

async function verificarMensajes(browser) {
  console.log('\n▶ Mensajes: lista de chats y apertura de una conversación (solo lectura)');
  const pedidos = [];
  const c = await contexto(browser, { w: 1280, h: 800, pedidos });
  const p = await abrir(c);
  await p.locator('.emp-nav-tab').nth(4).click();
  await p.waitForSelector('.chat-item', { timeout: 8000 });
  const lista = await p.locator('.chat-item').count();
  ok(lista === CHATS.length, `la lista muestra ${lista} de ${CHATS.length} conversaciones`);
  ok(pedidos.some(x => x.startsWith('GET ') && x.endsWith(`/mensajeria/mis-chats/empresa/${EMPRESA.id}`)), 'la lista sale de GET /mensajeria/mis-chats/empresa/:id');
  await p.locator('.chat-item').first().click();
  await p.waitForSelector('.chat-view-header', { timeout: 8000 });
  await p.waitForTimeout(600);
  const abierta = await p.evaluate(() => ({ titulo: document.querySelector('.chat-view-header h4')?.textContent.trim(), texto: document.querySelector('.chat-view')?.innerText || '' }));
  ok(abierta.titulo === CHATS[0].usuario.nombre, `abre la conversación de ${abierta.titulo}`);
  ok(HISTORIAL.mensajes.every(m => abierta.texto.includes(m.contenido)), 'muestra los mensajes del historial');
  ok(pedidos.some(x => x.startsWith('GET ') && x.endsWith(`/mensajeria/historial/11/${EMPRESA.id}/1`)), 'el historial sale de GET /mensajeria/historial/:postulante/:empresa/:vacante');
  ok(!pedidos.some(x => x.includes('/mensajeria/enviar')), 'no se envió ningún mensaje');
  console.log(`    pedidos de mensajería: ${[...new Set(pedidos.filter(x => x.includes('/mensajeria/')))].join(' · ')}`);
  await shot(p, '1280x800-mensajes-conversacion');
  await c.close();
}

/** Lo que define el scroll de una ruta: overflow calculado de html/body y adónde va la rueda. */
async function medirScroll(p) {
  const estilo = await p.evaluate(() => {
    const h = getComputedStyle(document.documentElement), b = getComputedStyle(document.body);
    return { html: `${h.overflowX}/${h.overflowY}`, body: `${b.overflowX}/${b.overflowY}`, panelMontado: !!document.querySelector('.dashboard-empresa-container') };
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
  console.log('\n▶ Salida del panel: overflow de <body> y sondeos tras cerrar sesión');
  const w = 1276, h = 551;
  const rutas = [['/', 'landing', null], ['/admin/acceso', 'acceso admin', null], ['/vacantes-dashboard', 'egresado', EGRESADO]];

  // Línea base: cada ruta en una carga limpia, sin haber pasado por el panel.
  const base = {};
  for (const [ruta, nombre, usuario] of rutas) {
    const c = await browser.newContext({ viewport: { width: w, height: h } });
    if (usuario) await c.addInitScript(([u]) => { localStorage.setItem('usuario', JSON.stringify(u)); localStorage.setItem('token', 'demo-token'); }, [usuario]);
    await c.route('**/backend-ude-c.vercel.app/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(stub(r.request().url())) }));
    const p = await c.newPage();
    await p.goto(BASE + ruta, { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(1500);
    base[nombre] = await medirScroll(p);
    await c.close();
  }

  // Sondeos (reloj simulado): el del panel para chats es cada 20s y el de avisos cada 30s.
  // App.jsx (NotificadorGlobal, previo a esta rama) también consulta mis-chats/empresa
  // cada 8s en /empresa-dashboard; se cuenta todo y se exige 0 tras salir.
  {
    const pedidos = [];
    const c = await contexto(browser, { w, h, pedidos });
    const p = await c.newPage();
    await p.clock.install();
    p.on('pageerror', e => fallos.push(`pageerror salida: ${e.message}`));
    await p.goto(BASE + '/empresa-dashboard', { waitUntil: 'domcontentloaded' });
    await p.waitForSelector('.emp-nav-tab');
    await p.clock.runFor(1500);
    const cuenta = (frag) => pedidos.filter(x => x.includes(frag)).length;
    const chats0 = cuenta('/mis-chats/empresa'), notis0 = cuenta('/notificaciones/empresa');
    await p.clock.runFor(60000);
    const dChats = cuenta('/mis-chats/empresa') - chats0, dNotis = cuenta('/notificaciones/empresa') - notis0;
    // 60s: 3 del sondeo de 20s + 7 del NotificadorGlobal de 8s (previo); avisos: 2 de 30s
    ok(dChats === 3 + 7 && dNotis === 2, `con el panel montado, en 60s: chats ${dChats} (3 del menú a 20s + 7 de App.jsx a 8s), avisos ${dNotis} (cada 30s)`);
    await p.locator('.emp-nav-user-avatar').click();
    await p.getByRole('menuitem', { name: 'Cerrar sesión' }).click();
    await p.locator('.modal-overlay .btn-confirm').click();
    await p.waitForURL(BASE + '/');
    await p.clock.runFor(1500);
    const chats1 = cuenta('/mis-chats/empresa'), notis1 = cuenta('/notificaciones/empresa'), vac1 = cuenta('/vacantes/empresa');
    await p.clock.runFor(95000);
    ok(cuenta('/mis-chats/empresa') === chats1 && cuenta('/notificaciones/empresa') === notis1 && cuenta('/vacantes/empresa') === vac1,
      `tras cerrar sesión no hay más sondeos del panel en 95s (chats +${cuenta('/mis-chats/empresa') - chats1}, avisos +${cuenta('/notificaciones/empresa') - notis1}, vacantes +${cuenta('/vacantes/empresa') - vac1})`);
    await c.close();
  }

  // Overflow y scroll (reloj real): panel → cerrar sesión (SPA, sin recarga) → landing → /admin/acceso → /vacantes-dashboard.
  const c = await contexto(browser, { w, h });
  const p = await abrir(c);
  const enPanel = await p.evaluate(() => getComputedStyle(document.body).overflowX);
  ok(enPanel === 'clip', `con el panel montado, <body> usa overflow-x: ${enPanel}`);
  await p.locator('.emp-nav-user-avatar').click();
  await p.getByRole('menuitem', { name: 'Cerrar sesión' }).click();
  await p.locator('.modal-overlay .btn-confirm').click();
  await p.waitForURL(BASE + '/');
  for (const [ruta, nombre, usuario] of rutas) {
    if (usuario) await p.evaluate(([u]) => { localStorage.setItem('usuario', JSON.stringify(u)); localStorage.setItem('token', 'demo-token'); }, [usuario]);
    if (ruta !== '/') await p.evaluate((r) => { history.pushState({}, '', r); dispatchEvent(new PopStateEvent('popstate')); }, ruta);
    await p.waitForTimeout(1500);
    const tras = await medirScroll(p);
    const b = base[nombre];
    ok(!tras.panelMontado, `${nombre}: el panel de empresa ya no está montado`);
    ok(tras.html === b.html && tras.body === b.body, `${nombre}: overflow igual que en carga limpia (html ${tras.html} / body ${tras.body}; limpia ${b.html} / ${b.body})`);
    ok(tras.ventana === b.ventana && tras.interno === b.interno, `${nombre}: la rueda desplaza igual (ventana ${tras.ventana} vs ${b.ventana}; interno ${tras.interno} vs ${b.interno})`);
  }
  await c.close();
}

async function capturasEstados(browser) {
  console.log('\n▶ Estados (1276×551 @1.5x) y Egresado para comparar');
  const t = { w: 1276, h: 551, dsf: 1.5 };
  let c = await contexto(browser, t);
  let p = await abrir(c);
  await p.locator('.emp-nav-tab').nth(2).hover();
  await p.waitForTimeout(250);
  await shot(p, 'estado-hover', { clip: { x: 0, y: 0, width: t.w, height: 140 } });
  await p.locator('.emp-nav-tab').nth(4).click();
  await p.waitForTimeout(400);
  await shot(p, 'estado-activo-mensajes', { clip: { x: 0, y: 0, width: t.w, height: 140 } });
  await p.locator('.emp-nav-tab').nth(0).click();
  await p.waitForTimeout(400);
  await shot(p, 'comparar-empresa-1276x551');
  await c.close();
  for (const [w, h] of MONITORES) {
    c = await contexto(browser, { w, h });
    p = await abrir(c);
    await shot(p, `comparar-empresa-${w}x${h}`);
    await c.close();
  }

  c = await contexto(browser, { ...t, reducedMotion: 'reduce' });
  p = await abrir(c);
  const rm = await p.evaluate(() => ({
    glider: getComputedStyle(document.querySelector('.emp-nav-glider')).transitionProperty,
    entrada: getComputedStyle(document.querySelector('.emp-nav-tablist li')).animationName,
  }));
  ok(rm.glider === 'opacity' && rm.entrada === 'none', `reduced-motion: glider solo cruza opacidad (${rm.glider}), sin entrada escalonada (${rm.entrada})`);
  await shot(p, 'estado-reduced-motion', { clip: { x: 0, y: 0, width: t.w, height: 140 } });
  await c.close();

  c = await contexto(browser, { ...t, usuario: EGRESADO });
  p = await abrir(c, '/vacantes-dashboard', '.ex-tab');
  await shot(p, 'comparar-egresado-1276x551');
  const alturas = await p.evaluate(() => Math.round(document.querySelector('.ex-nav').getBoundingClientRect().height));
  console.log(`    alto del menú de Egresado: ${alturas}px`);
  await c.close();
  for (const [w, h] of MONITORES) {
    c = await contexto(browser, { w, h, usuario: EGRESADO });
    p = await abrir(c, '/vacantes-dashboard', '.ex-tab');
    await shot(p, `comparar-egresado-${w}x${h}`);
    await c.close();
  }
  const pares = [['1276x551', '1276×551 a escala 1,5 (pantalla real del usuario)'], ...MONITORES.map(([w, h]) => [`${w}x${h}`, `${w}×${h}`])];

  await writeFile(path.join(OUT, 'comparar.html'), `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Menú Egresado vs Empresa</title>
<style>
  :root { --verde: #00482B; --papel: #fff; --fondo: #f0f2f5; --gris: #4D4D4D; }
  body { margin: 0; padding: 24px 16px; background: var(--fondo); color: var(--gris); font-family: Montserrat, 'Segoe UI', sans-serif; }
  h1 { margin: 0 0 4px; font-size: 1.1rem; color: var(--verde); }
  h2 { margin: 28px 0 10px; font-size: .9rem; color: var(--verde); }
  p { margin: 0 0 20px; font-size: .85rem; }
  .par { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 560px), 1fr)); gap: 20px; }
  figure { margin: 0; background: var(--papel); border-radius: 10px; padding: 12px; box-shadow: 0 6px 20px -14px rgba(0,72,43,.4); }
  figcaption { font-weight: 700; color: var(--verde); font-size: .8rem; margin-bottom: 8px; text-transform: uppercase; letter-spacing: .04em; }
  img { width: 100%; height: auto; display: block; border: 1px solid rgba(77,77,77,.14); }
</style></head><body>
<h1>Menú "Sello en Marcha": Egresado y Empresa lado a lado</h1>
<p>Capturas generadas por <code>npm run capturar:menu-empresa</code> con datos de prueba.</p>
${pares.map(([id, txt]) => `<h2>${txt}</h2>
<div class="par">
  <figure><figcaption>Egresado · /vacantes-dashboard</figcaption><img src="comparar-egresado-${id}.png" alt="Menú de egresado en ${txt}"></figure>
  <figure><figcaption>Empresa · /empresa-dashboard</figcaption><img src="comparar-empresa-${id}.png" alt="Menú de empresa en ${txt}"></figure>
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
    // Borde del corte: 859 debe ser barra inferior; 860 barra superior entera
    for (const w of [CORTE - 1, CORTE]) await verificarTamano(browser, { w, h: 900 });
    await verificarCapas(browser);
    await verificarMovilFlotantes(browser);
    await verificarMensajes(browser);
    await verificarSalidaDelPanel(browser);
    await capturasEstados(browser);
  } finally {
    await browser.close();
  }
  console.log(fallos.length ? `\n✗ ${fallos.length} fallo(s):\n - ${fallos.join('\n - ')}` : '\n✓ Todo en orden.');
  process.exit(fallos.length ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
