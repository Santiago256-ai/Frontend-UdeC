/**
 * Evidencia visual del modal "Recuperar contraseña" (dirección "Ventanilla")
 * y del enlace "¿Olvidaste tu contraseña?" (tratamiento E1) del Login.
 *
 * Uso:
 *   1. En una terminal:  npm run dev          (deja Vite en http://localhost:5173)
 *   2. En otra:          npm run capturar:recuperar
 *
 * Nunca llama al backend de producción: todo lo que vaya a
 * backend-ude-c.vercel.app se intercepta con page.route; el endpoint de
 * recuperación responde con datos simulados y cualquier otro pedido se aborta
 * (y se cuenta). No se envía ningún correo.
 *
 * Genera JPG en frontend/tests/evidencia/recuperar/ (los 4 estados en 1280 y
 * 360, tablet, teclado virtual y el enlace E1) e imprime geometría real
 * (boundingBox / scrollHeight / getComputedStyle), no isVisible().
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const BASE = process.env.LOGIN_URL || 'http://localhost:5173';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, '../tests/evidencia/recuperar');
const CORREO = 'ana.rodriguez@gmail.com';
const NO_EXISTE = { success: false, message: 'Si el correo es válido, recibirás un enlace.' }; // lo que hoy responde el servidor
const EXISTE = { success: true, message: 'Correo enviado con éxito.' };
const CLIP_DESKTOP = { x: 280, y: 40, width: 720, height: 720 };

// Clases de primer nivel compartidas sin ámbito entre VacantesDashboard.css y
// EmpresaDashboard/*.css (DESIGN.md §8, "Colisión de clases": 36).
const COMPARTIDAS = ['Toastify__close-button', 'Toastify__toast', 'bar-green', 'bar-orange', 'btn-cancel', 'btn-confirm',
  'collapse-btn-footer', 'content-inner', 'dashboard-layout', 'glass-container', 'header-center', 'header-content',
  'header-logo-img', 'header-right', 'header-top-bar', 'icon-transition', 'logo-full-expanded', 'logo-icon-collapsed',
  'logo-section', 'logout-modal', 'main-header-container', 'menu-item', 'modal-overlay', 'no-selection-state',
  'ql-align-center', 'ql-align-justify', 'ql-align-right', 'search-wrapper', 'section-title-container', 'sidebar',
  'sidebar-footer', 'sidebar-top', 'user-avatar-initials', 'user-details', 'user-profile-info', 'vacantes-count-badge'];

let fallos = 0;
let abortadas = 0;
const check = (ok, etiqueta, detalle = '') => {
  if (!ok) fallos++;
  console.log(`  ${ok ? '✓' : '✗'} ${etiqueta}${detalle ? ` — ${detalle}` : ''}`);
};

/** `ctl.modo`: 'no-existe' | 'existe' | 'colgar' | 'red' | '500' | '429'. */
async function nuevoContexto(browser, { width, height, reducedMotion = 'no-preference', escala } = {}) {
  const movil = width < 640;
  const context = await browser.newContext({
    viewport: { width, height }, deviceScaleFactor: escala ?? (movil ? 2 : 1), isMobile: movil, hasTouch: movil, reducedMotion,
  });
  const ctl = { modo: 'no-existe', soltar: null, pedidos: [] };
  await context.route(/backend-ude-c\.vercel\.app/, async (route) => {
    if (!route.request().url().includes('/auth/request-password-reset')) { abortadas++; return route.abort(); }
    ctl.pedidos.push(JSON.parse(route.request().postData() || '{}'));
    const json = (status, body) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
    if (ctl.modo === 'red') return route.abort('internetdisconnected');
    if (ctl.modo === '500') return json(500, { success: false, message: 'Error al enviar el correo.' });
    if (ctl.modo === '429') return json(429, { message: 'Demasiadas solicitudes' });
    if (ctl.modo === 'colgar') { await new Promise((r) => { ctl.soltar = r; }); return json(200, NO_EXISTE); }
    return json(200, ctl.modo === 'existe' ? EXISTE : NO_EXISTE);
  });
  const page = await context.newPage();
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  return { context, page, ctl };
}

async function abrir(page, correoLogin = '') {
  if (correoLogin) await page.fill('.login-form-udec input[type="email"]', correoLogin);
  await page.locator('.forgot-password-link').click();
  await page.locator('.recuperar-tarjeta').waitFor({ state: 'attached' });
  await page.waitForTimeout(420); // entrada 240ms + margen
}

async function shot(page, nombre, clip) {
  const file = path.join(OUT, `${nombre}.jpg`);
  await page.screenshot({ path: file, type: 'jpeg', quality: 85, clip });
  console.log('  📸', path.relative(process.cwd(), file));
}

function medir(page) {
  return page.evaluate((COMPARTIDAS) => {
    const vw = innerWidth, vh = innerHeight;
    const ov = document.querySelector('.recuperar-overlay');
    const t = document.querySelector('.recuperar-tarjeta');
    if (!t) return null;
    const tc = t.getBoundingClientRect();
    const x = t.querySelector('.recuperar-cerrar').getBoundingClientRect();
    const nodos = [ov, ...ov.querySelectorAll('*')];
    const scrolls = nodos.filter((el) => /(auto|scroll)/.test(getComputedStyle(el).overflowY) && el.scrollHeight > el.clientHeight + 1);
    const hDesborde = nodos.filter((el) => el.tagName !== 'INPUT' && getComputedStyle(el).overflowX !== 'visible' && el.scrollWidth > el.clientWidth + 1).length
      + (document.documentElement.scrollWidth > vw ? 1 : 0);
    const clases = [...new Set(nodos.flatMap((el) => [...el.classList]))];
    return {
      tarjeta: `${Math.round(tc.width)}×${Math.round(tc.height)} @${Math.round(tc.x)},${Math.round(tc.y)}`,
      dentro: tc.left >= -0.5 && tc.top >= -0.5 && tc.right <= vw + 0.5 && tc.bottom <= vh + 0.5,
      cerrar: Math.round(x.width) === 44 && Math.round(x.height) === 44 && x.left >= 0 && x.top >= 0 && x.right <= vw && x.bottom <= vh,
      scrolls: scrolls.map((el) => `${el.className} ${el.clientHeight}/${el.scrollHeight}`),
      hDesborde,
      fuente: getComputedStyle(t.querySelector('.recuperar-titulo')).fontFamily.split(',')[0].replace(/"/g, ''),
      ajenas: clases.filter((c) => !c.startsWith('recuperar-') && !c.startsWith('lucide')),
      compartidas: clases.filter((c) => COMPARTIDAS.includes(c)),
    };
  }, COMPARTIDAS);
}

function chequeoGeometria(m, etiqueta) {
  check(m.dentro && m.cerrar && m.hDesborde === 0 && m.scrolls.length === 0,
    `${etiqueta}: dentro del viewport, X 44×44 visible, sin desborde, sin scroll`,
    `${m.tarjeta}${m.scrolls.length ? ` scroll ${m.scrolls}` : ''}${m.hDesborde ? ` desborde ${m.hDesborde}` : ''}`);
}

/* ---------- 4 estados en los 6 tamaños ---------- */
async function estados(browser) {
  console.log('\n▶ Cuatro estados por tamaño');
  const tamanos = [[1280, 800, 'desktop-1280'], [1280, 650, 'desktop-1280x650'], [820, 1180, 'tablet-820'], [768, 1024, 'tablet-768'], [390, 844, 'movil-390'], [360, 640, 'movil-360']];
  for (const [w, h, tag] of tamanos) {
    const capturar = tag === 'desktop-1280' || tag === 'movil-360';
    const clip = w > 640 && capturar ? CLIP_DESKTOP : undefined;
    const { context, page, ctl } = await nuevoContexto(browser, { width: w, height: h });
    await abrir(page);
    chequeoGeometria(await medir(page), `${tag} inicial`);
    if (capturar) await shot(page, `${tag}-1-inicial`, clip);
    if (tag === 'tablet-820') await shot(page, `${tag}-1-inicial`);

    await page.fill('.recuperar-input', 'ana.rodriguezgmail.com');
    const callado = await page.$eval('.recuperar-error', (el) => el.textContent === '');
    await page.click('.recuperar-lead'); // salir del campo con el puntero
    await page.waitForTimeout(200);
    const m2 = await medir(page);
    chequeoGeometria(m2, `${tag} error`);
    if (capturar) await shot(page, `${tag}-2-error`, clip);

    await page.fill('.recuperar-input', `  ${CORREO.toUpperCase()} `);
    const corregido = await page.$eval('.recuperar-error', (el) => el.textContent === '');
    ctl.modo = 'colgar';
    await page.click('.recuperar-enviar');
    await page.waitForTimeout(220);
    await page.click('.recuperar-enviar', { force: true, timeout: 1000 }).catch(() => {});
    await page.keyboard.press('Enter').catch(() => {});
    const carga = await page.evaluate(() => {
      const b = document.querySelector('.recuperar-enviar');
      return { disabled: b.disabled, texto: b.innerText.trim() };
    });
    chequeoGeometria(await medir(page), `${tag} enviando`);
    if (capturar) await shot(page, `${tag}-3-enviando`, clip);
    const enVuelo = ctl.pedidos.length;
    ctl.soltar?.();

    await page.locator('.recuperar-cuerpo[data-fase="exito"]').waitFor();
    await page.waitForTimeout(420);
    chequeoGeometria(await medir(page), `${tag} éxito`);
    if (capturar) await shot(page, `${tag}-4-exito`, clip);
    if (tag === 'desktop-1280') {
      const exito = await page.evaluate(() => {
        const t = document.querySelector('.recuperar-titulo');
        return { color: getComputedStyle(t).color, foco: document.activeElement === t, reenviar: document.querySelector('.recuperar-reenviar').innerText.trim() };
      });
      check(callado, 'No valida mientras se escribe por primera vez');
      check(m2 && corregido, 'El error aparece al salir del campo y se quita al corregir');
      check(carga.disabled && carga.texto.includes('Enviando'), 'Botón deshabilitado con indicador de carga');
      check(enVuelo === 1, 'Un solo pedido con doble clic + Enter durante la carga', `${enVuelo}`);
      check(ctl.pedidos[0]?.correo === CORREO, 'Correo recortado y en minúsculas antes de enviar', ctl.pedidos[0]?.correo);
      check(exito.color === 'rgb(0, 77, 44)' && exito.foco, 'Éxito en verde (con success:false del servidor) y foco en el título', exito.color);
      check(/(1:00|0:5\d)/.test(exito.reenviar), 'Enfriamiento visible', exito.reenviar);
    }
    await context.close();
  }
}

/* ---------- Teclado virtual simulado ---------- */
async function teclado(browser) {
  console.log('\n▶ Teclado virtual simulado (360×640 → 360×340, campo enfocado, error a la vista)');
  const { context, page } = await nuevoContexto(browser, { width: 360, height: 640 });
  await abrir(page);
  await page.fill('.recuperar-input', 'ana@');
  await page.click('.recuperar-lead');
  await page.focus('.recuperar-input');
  await page.setViewportSize({ width: 360, height: 340 });
  await page.waitForTimeout(350);
  const cajas = await page.evaluate(() => {
    const vv = window.visualViewport;
    const alto = vv ? vv.height : innerHeight, top = vv ? vv.offsetTop : 0;
    return Object.fromEntries(['.recuperar-input', '.recuperar-error', '.recuperar-enviar'].map((s) => {
      const r = document.querySelector(s).getBoundingClientRect();
      return [s, { top: Math.round(r.top), bottom: Math.round(r.bottom), ok: r.top >= top - 0.5 && r.bottom <= top + alto + 0.5 }];
    }));
  });
  const txt = await page.$eval('.recuperar-error', (el) => el.textContent);
  check(Object.values(cajas).every((c) => c.ok), 'Campo, mensaje de error y botón dentro de los 340px visibles',
    Object.entries(cajas).map(([s, c]) => `${s.replace('.recuperar-', '')} ${c.top}–${c.bottom}`).join(' · ') + ` · "${txt}"`);
  await shot(page, 'movil-360-teclado-error');
  await context.close();
}

/* ---------- Respuestas del servidor ---------- */
async function respuestas(browser) {
  console.log('\n▶ Respuestas del servidor (interceptadas)');
  const casos = [
    ['existe', 'exito', '200 success:true (cuenta registrada)'],
    ['no-existe', 'exito', '200 success:false (no registrada, lo que responde hoy)'],
    ['500', 'fallo', '500 (error interno)'],
    ['429', 'fallo', '429 (exceso de intentos, previsto)'],
    ['red', 'fallo', 'red caída'],
  ];
  const textos = {};
  for (const [modo, esperado, etiqueta] of casos) {
    const { context, page, ctl } = await nuevoContexto(browser, { width: 1280, height: 800 });
    await abrir(page);
    await page.fill('.recuperar-input', CORREO);
    ctl.modo = modo;
    await page.click('.recuperar-enviar');
    await page.waitForTimeout(500);
    const r = await page.evaluate(() => ({
      exito: !!document.querySelector('.recuperar-cuerpo[data-fase="exito"]'),
      fallo: document.querySelector('.recuperar-fallo p')?.textContent || '',
      reintentar: !!document.querySelector('.recuperar-fallo-btn'),
      html: document.querySelector('.recuperar-tarjeta').innerText,
    }));
    textos[modo] = r.html;
    check(esperado === 'exito' ? r.exito && !r.fallo : !r.exito && r.fallo && r.reintentar, `${etiqueta} → ${esperado === 'exito' ? 'éxito neutral' : `fallo con Reintentar: "${r.fallo}"`}`);
    if (modo === '500') {
      check(!/correo/i.test(r.fallo), 'El mensaje del 500 no menciona el correo (un 500 sólo ocurre con cuentas existentes)');
      ctl.modo = 'no-existe';
      await page.click('.recuperar-fallo-btn');
      await page.locator('.recuperar-cuerpo[data-fase="exito"]').waitFor({ timeout: 3000 }).catch(() => {});
      check(await page.locator('.recuperar-cuerpo[data-fase="exito"]').count() === 1, 'Reintentar tras el 500 llega al éxito');
    }
    if (modo === 'red') await shot(page, 'desktop-1280-5-fallo-red', CLIP_DESKTOP);
    await context.close();
  }
  check(textos.existe === textos['no-existe'], 'Pantalla idéntica para cuenta registrada y no registrada');
}

/* ---------- Comportamiento: diálogo, precarga, enfriamiento, registro ---------- */
async function comportamiento(browser) {
  console.log('\n▶ Diálogo accesible, precarga, sugerencia, enfriamiento y registro');
  {
    const { context, page, ctl } = await nuevoContexto(browser, { width: 1280, height: 800 });
    await abrir(page, 'Ana.Rodriguez@Gmail.com ');
    const a = await page.evaluate(() => {
      const t = document.querySelector('.recuperar-tarjeta');
      return {
        role: t.getAttribute('role'), modal: t.getAttribute('aria-modal'),
        titulo: document.getElementById(t.getAttribute('aria-labelledby'))?.textContent,
        desc: !!document.getElementById(t.getAttribute('aria-describedby')),
        valor: document.querySelector('.recuperar-input').value,
        foco: document.activeElement === document.querySelector('.recuperar-input'),
        overflow: [document.documentElement, document.body].map((el) => `${el.style.getPropertyValue('overflow')}!${el.style.getPropertyPriority('overflow')}`).join(' '),
        input: (() => { const i = document.querySelector('.recuperar-input'); return [i.type, i.inputMode, i.autocomplete, i.getAttribute('autocapitalize'), i.getAttribute('autocorrect'), i.spellcheck, getComputedStyle(i).fontSize].join(' '); })(),
      };
    });
    check(a.role === 'dialog' && a.modal === 'true' && a.titulo && a.desc, `role=dialog, aria-modal, aria-labelledby → "${a.titulo}", aria-describedby`);
    check(a.valor === CORREO, 'Precarga el correo del Login, normalizado', a.valor);
    check(a.foco && a.overflow === 'hidden!important hidden!important', 'Foco en el campo y scroll del fondo bloqueado', a.overflow);
    check(a.input === 'email email email none off false 16px', 'Atributos del campo y 16px (sin zoom en iOS)', a.input);
    // Wheel real: el fondo no se mueve.
    const y0 = await page.evaluate(() => scrollY);
    await page.mouse.move(100, 500); await page.mouse.wheel(0, 400); await page.waitForTimeout(150);
    check(await page.evaluate(() => scrollY) === y0, 'Rueda del mouse no desplaza el fondo');
    let dentro = true;
    for (let i = 0; i < 12; i++) { await page.keyboard.press('Tab'); dentro &&= await page.evaluate(() => document.querySelector('.recuperar-tarjeta').contains(document.activeElement)); }
    check(dentro, 'Trampa de foco (12 Tabs)');
    // Vacío al enviar.
    await page.fill('.recuperar-input', '');
    await page.click('.recuperar-enviar');
    const vacio = await page.$eval('.recuperar-error', (el) => el.textContent);
    check(vacio === 'Escribe tu correo electrónico.' && ctl.pedidos.length === 0, 'Enviar vacío: mensaje específico y ningún pedido', vacio);
    // Sugerencia de dominio.
    await page.fill('.recuperar-input', 'ana.rodriguez@gmial.com');
    await page.click('.recuperar-lead'); await page.waitForTimeout(150);
    const sug = await page.$eval('.recuperar-sugerencia', (el) => el.textContent).catch(() => '');
    check(sug.includes('ana.rodriguez@gmail.com'), 'Sugerencia ante "gmial.com"', sug);
    await shot(page, 'desktop-1280-6-sugerencia', CLIP_DESKTOP);
    await page.click('.recuperar-sugerencia-btn');
    check(await page.$eval('.recuperar-input', (el) => el.value) === CORREO, 'La sugerencia se aplica con un clic');
    // Esc cierra y devuelve el foco al enlace.
    await page.keyboard.press('Escape'); await page.waitForTimeout(260);
    const c = await page.evaluate(() => ({ cerrado: !document.querySelector('.recuperar-overlay'), foco: document.activeElement?.classList.contains('forgot-password-link'), ov: document.documentElement.style.getPropertyValue('overflow') + document.body.style.getPropertyValue('overflow') }));
    check(c.cerrado && c.foco && c.ov === '', 'Esc cierra, foco devuelto al enlace y overflow restaurado');
    // Clic fuera.
    await abrir(page);
    await page.mouse.click(10, 400); await page.waitForTimeout(260);
    check(!(await page.locator('.recuperar-overlay').count()), 'Clic fuera cierra');
    // X.
    await abrir(page);
    await page.click('.recuperar-cerrar'); await page.waitForTimeout(260);
    check(!(await page.locator('.recuperar-overlay').count()), 'La X cierra');

    // Enfriamiento: enviar, cerrar, reabrir, mismo correo → sin pedido nuevo.
    await abrir(page);
    await page.fill('.recuperar-input', CORREO);
    await page.click('.recuperar-enviar');
    await page.locator('.recuperar-cuerpo[data-fase="exito"]').waitFor();
    await page.keyboard.press('Escape'); await page.waitForTimeout(260);
    await page.waitForTimeout(1200);
    await abrir(page);
    await page.fill('.recuperar-input', CORREO);
    const antes = ctl.pedidos.length;
    await page.click('.recuperar-enviar');
    await page.locator('.recuperar-cuerpo[data-fase="exito"]').waitFor();
    const enf = await page.evaluate(() => ({ txt: document.querySelector('.recuperar-reenviar').innerText, dis: document.querySelector('.recuperar-reenviar').disabled }));
    check(ctl.pedidos.length === antes && enf.dis && /0:5\d/.test(enf.txt), 'El enfriamiento sobrevive a cerrar y reabrir (sin pedido nuevo)', enf.txt);
    // Cambiar correo: vuelve al formulario sin cerrar, con el correo seleccionado.
    await page.click('text=Cambiar correo');
    const cambio = await page.evaluate(() => ({ form: !!document.querySelector('.recuperar-input'), foco: document.activeElement === document.querySelector('.recuperar-input'), abierto: !!document.querySelector('.recuperar-overlay') }));
    check(cambio.form && cambio.foco && cambio.abierto, '"Cambiar correo" vuelve al campo sin cerrar el modal', JSON.stringify(cambio));
    await context.close();
  }

  // Enlaces de registro: cierran el modal y abren el mismo flujo que SOY GRADUADO / SOY EMPRESA.
  for (const [texto, ruta] of [['como graduado', '/registro-egresado'], ['como empresa', '/register/company']]) {
    const { context, page } = await nuevoContexto(browser, { width: 1280, height: 800 });
    const boton = texto === 'como graduado' ? 'SOY GRADUADO' : 'SOY EMPRESA';
    await page.click(`text=${boton}`); await page.waitForTimeout(300);
    const rutaBoton = new URL(page.url()).pathname;
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    await abrir(page);
    await page.fill('.recuperar-input', CORREO);
    await page.click('.recuperar-enviar');
    await page.locator('.recuperar-cuerpo[data-fase="exito"]').waitFor();
    await page.click(`.recuperar-registro >> text=${texto}`);
    await page.waitForURL(`**${ruta}`, { timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(400);
    const r = await page.evaluate(() => ({
      ruta: location.pathname,
      modal: !!document.querySelector('.recuperar-overlay'),
      ov: [document.documentElement, document.body].map((el) => el.style.getPropertyValue('overflow')).join('|'),
      foco: document.activeElement?.tagName,
      alto: document.documentElement.scrollHeight - innerHeight,
    }));
    const y0 = await page.evaluate(() => scrollY);
    await page.mouse.move(640, 400); await page.mouse.wheel(0, 300); await page.waitForTimeout(200);
    const y1 = await page.evaluate(() => scrollY);
    check(r.ruta === ruta && r.ruta === rutaBoton && !r.modal && r.ov === '|',
      `"${texto}" cierra el modal y abre ${ruta} (igual que ${boton}); overflow en línea limpio`, `foco en ${r.foco}`);
    check(r.alto <= 0 || y1 > y0, `En ${ruta} la página vuelve a desplazarse con la rueda`, r.alto <= 0 ? 'la página no tiene scroll' : `${y0} → ${y1}px`);
    await context.close();
  }

  // Movimiento reducido.
  {
    const { context, page } = await nuevoContexto(browser, { width: 1280, height: 800, reducedMotion: 'reduce' });
    await abrir(page);
    const anim = await page.evaluate(() => getComputedStyle(document.querySelector('.recuperar-tarjeta')).animationName);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(40);
    const salida = await page.evaluate(() => {
      const o = document.querySelector('.recuperar-overlay');
      return o ? `${getComputedStyle(o).animationName} ${getComputedStyle(o).animationDuration} / tarjeta ${getComputedStyle(o.firstElementChild).animationName}` : 'ya cerrado';
    });
    check(anim === 'recuperar-fundido', 'Movimiento reducido: entrada sólo con fundido', anim);
    check(salida === 'recuperar-fundido-out 0.15s / tarjeta none', 'Movimiento reducido: salida con fundido de 150ms', salida);
    await context.close();
  }
}

/* ---------- Transición entre fases (FLIP) ---------- */
// Muestrea el `top` visual de la tarjeta en cada fotograma (rAF) mientras cambia
// de fase. Falla si en el fotograma del cambio la tarjeta salta más de 2px
// (teletransporte), si retrocede (rebote) o si no llega a su sitio. El mayor
// paso entre fotogramas se informa: con 43–81px en 220ms y una curva ease-out,
// el primer fotograma ya recorre ~30% del trayecto, así que no puede ser ≤ 2px.
async function muestrear(page, accion) {
  await page.evaluate(() => {
    window.__muestras = [];
    window.__muestreando = true;
    const paso = () => {
      const t = document.querySelector('.recuperar-tarjeta');
      const c = document.querySelector('.recuperar-cuerpo');
      if (t) window.__muestras.push({ top: t.getBoundingClientRect().top, fase: c?.dataset.fase || 'formulario' });
      if (window.__muestreando) requestAnimationFrame(paso);
    };
    requestAnimationFrame(paso);
  });
  await page.waitForTimeout(80);
  await accion();
  await page.waitForTimeout(500);
  return page.evaluate(() => {
    window.__muestreando = false;
    const t = document.querySelector('.recuperar-tarjeta');
    const flip = t.getAnimations().filter((a) => a.constructor.name !== 'CSSAnimation').length;
    const s = window.__muestras;
    const i = s.findIndex((m, k) => k > 0 && m.fase !== s[0].fase);
    const pasos = s.slice(1).map((m, k) => m.top - s[k].top);
    const tras = pasos.slice(i); // pasos desde el fotograma del cambio
    const sentido = Math.sign(tras.find((d) => Math.abs(d) > 0.5) || 0);
    return {
      cambio: i,
      saltoCambio: i > 0 ? Math.abs(s[i].top - s[i - 1].top) : NaN,
      retroceso: Math.max(0, ...tras.slice(1).map((d) => (sentido ? -d * sentido : 0))),
      mayorPaso: Math.max(...pasos.map(Math.abs)),
      recorrido: i > 0 ? Math.round(s[s.length - 1].top - s[i - 1].top) : 0,
      final: Math.abs(s[s.length - 1].top - t.getBoundingClientRect().top),
      flipActivo: flip,
      fotogramas: s.length,
    };
  });
}

async function transicion(browser) {
  console.log('\n▶ Transición entre fases (top de la tarjeta, fotograma a fotograma)');
  for (const [w, h] of [[1280, 800], [360, 640]]) {
    const tag = `${w}×${h}`;
    const { context, page, ctl } = await nuevoContexto(browser, { width: w, height: h });
    await abrir(page);
    await page.fill('.recuperar-input', CORREO);
    const evaluar = (r, etiqueta) => {
      check(r.cambio > 0 && r.saltoCambio <= 2, `${tag} ${etiqueta}: sin salto en el fotograma del cambio`,
        `${r.saltoCambio.toFixed(2)}px · recorrido ${r.recorrido}px en ${r.fotogramas} fotogramas · mayor paso ${r.mayorPaso.toFixed(1)}px (informativo)`);
      check(r.retroceso <= 0.5 && r.final <= 1, `${tag} ${etiqueta}: avanza en un solo sentido y llega a su sitio`, `retroceso ${r.retroceso.toFixed(2)}px, distancia final ${r.final.toFixed(2)}px`);
    };
    // Formulario → éxito (respuesta del servidor, clic).
    ctl.modo = 'no-existe';
    evaluar(await muestrear(page, () => page.click('.recuperar-enviar')), 'formulario → éxito');
    // Éxito → formulario con el puntero ("Cambiar correo").
    evaluar(await muestrear(page, () => page.click('.recuperar-fila >> text=Cambiar correo')), 'éxito → formulario (puntero)');
    // Dentro del enfriamiento, con Enter: sin FLIP y sin fundido.
    await page.focus('.recuperar-input');
    const r = await muestrear(page, () => page.keyboard.press('Enter'));
    const sinFundido = await page.evaluate(() => [getComputedStyle(document.querySelector('.recuperar-cuerpo')).animationName, getComputedStyle(document.querySelector('.recuperar-sello')).animationName].join(' '));
    check(r.flipActivo === 0 && ctl.pedidos.length === 1 && sinFundido === 'none none',
      `${tag} enfriamiento con Enter: sin pedido, sin desplazamiento animado y sin fundido`, `pedidos ${ctl.pedidos.length}, cuerpo/sello: ${sinFundido}`);
    // Éxito → formulario con teclado (Enter sobre "Cambiar correo"): sin FLIP.
    await page.focus('.recuperar-fila >> text=Cambiar correo');
    await page.keyboard.press('Enter');
    const flipTeclado = await page.evaluate(() => document.querySelector('.recuperar-tarjeta').getAnimations().filter((a) => a.constructor.name !== 'CSSAnimation').length);
    check(flipTeclado === 0, `${tag} "Cambiar correo" con teclado: sin desplazamiento animado`);
    await context.close();
  }
  // Movimiento reducido: la tarjeta se recoloca sin desplazarse; sólo el contenido se funde.
  const { context, page } = await nuevoContexto(browser, { width: 360, height: 640, reducedMotion: 'reduce' });
  await abrir(page);
  await page.fill('.recuperar-input', CORREO);
  const r = await muestrear(page, () => page.click('.recuperar-enviar'));
  const fundido = await page.evaluate(() => getComputedStyle(document.querySelector('.recuperar-cuerpo')).animationName);
  check(r.flipActivo === 0 && fundido === 'recuperar-aparece', 'Movimiento reducido: sin desplazamiento animado; el contenido sólo se funde (150ms)',
    `la tarjeta se recoloca en un fotograma (${r.saltoCambio.toFixed(0)}px), fundido ${fundido}`);
  await context.close();
}

/* ---------- Colisión de clases ---------- */
async function colision(browser) {
  console.log('\n▶ Colisión de clases');
  const { context, page } = await nuevoContexto(browser, { width: 1280, height: 800 });
  await abrir(page);
  const m = await medir(page);
  check(m.fuente === 'Montserrat', 'Montserrat computada en el modal', m.fuente);
  check(m.compartidas.length === 0, 'Ninguna de las 36 clases compartidas dentro del modal');
  check(m.ajenas.length === 0, 'Sólo clases recuperar-* (y lucide) en el modal', m.ajenas.join(', '));
  const r = await page.evaluate((COMPARTIDAS) => {
    const ov = document.querySelector('.recuperar-overlay');
    const cadena = [];
    for (let el = ov.parentElement; el; el = el.parentElement) {
      cadena.push({ tag: el.tagName.toLowerCase() + (el.id ? `#${el.id}` : '') + [...el.classList].map((c) => `.${c}`).join(''), transform: getComputedStyle(el).transform, compartida: [...el.classList].some((c) => COMPARTIDAS.includes(c)) });
    }
    const nodos = [ov, ...ov.querySelectorAll('*')];
    const ajenas = new Set();
    const linkReglas = new Set();
    const link = document.querySelector('.forgot-password-link');
    for (const hoja of document.styleSheets) {
      let reglas; try { reglas = hoja.cssRules; } catch { continue; }
      const recorrer = (lista) => {
        for (const regla of lista) {
          if (regla.cssRules && !regla.selectorText) { recorrer(regla.cssRules); continue; }
          if (!regla.selectorText) continue;
          if (!regla.selectorText.includes('recuperar-') && nodos.some((n) => { try { return n.matches(regla.selectorText); } catch { return false; } })) ajenas.add(regla.selectorText);
          try { if (link.matches(regla.selectorText)) linkReglas.add(regla.selectorText); } catch { /* selector no soportado */ }
        }
      };
      recorrer(reglas);
    }
    return { cadena, ajenas: [...ajenas], linkReglas: [...linkReglas] };
  }, COMPARTIDAS);
  console.log('    cadena:', r.cadena.map((c) => c.tag).join(' → '));
  check(r.cadena.every((c) => !c.compartida && c.transform === 'none'), 'Cadena de ancestros sin clases compartidas ni transform (position: fixed intacto)');
  console.log('    reglas ajenas que alcanzan nodos del modal:', r.ajenas.join(' | ') || 'ninguna');
  check(!r.ajenas.some((s) => COMPARTIDAS.some((c) => s.includes(`.${c}`))), 'Ninguna regla ajena viene de las clases compartidas');
  console.log('    reglas que alcanzan el enlace:', r.linkReglas.join(' | '));
  check(!r.linkReglas.some((s) => /dropdown|login-actions/.test(s)), 'Al enlace no le llegan reglas de LoginDropdown.css (no está en el bundle)');
  await context.close();
}

/* ---------- Enlace E1 ---------- */
async function enlace(browser) {
  console.log('\n▶ Enlace "¿Olvidaste tu contraseña?" (E1)');
  for (const [w, h] of [[1280, 800], [360, 640]]) {
    const { context, page } = await nuevoContexto(browser, { width: w, height: h, escala: 2 });
    const z = await page.evaluate(() => {
      document.querySelector('.login-form-udec').scrollIntoView({ block: 'center' });
      const r = (s) => document.querySelector(s).getBoundingClientRect();
      const f = r('.login-form-udec'), a = r('.forgot-password-link'), b = r('.btn-login-submit'), ex = r('.login-form-extras');
      const cs = getComputedStyle(document.querySelector('.forgot-password-link'));
      return { f: { x: f.x, y: f.y, w: f.width, h: f.height }, a: { w: a.width, h: a.height, top: a.top, bottom: a.bottom, left: a.left, right: a.right }, b: { top: b.top, bottom: b.bottom, left: b.left }, ex: ex.height, deco: `${cs.textDecorationLine} ${cs.textDecorationColor}`, color: cs.color, cursor: cs.cursor };
    });
    const clip = { x: Math.max(0, z.f.x - 16), y: Math.max(0, z.f.y - 12), width: Math.min(w, z.f.w + 32), height: z.f.h + 24 };
    const tag = w > 640 ? 'desktop-1280' : 'movil-360';
    check(z.a.h >= 44, `${tag}: área táctil de ${Math.round(z.a.w)}×${Math.round(z.a.h)}px`);
    check(z.ex === (w > 640 ? 41 : 78) || Math.abs(z.ex - (w > 640 ? 41 : 78)) < 0.6, `${tag}: la fila mide lo mismo que antes del cambio`, `${Math.round(z.ex)}px`);
    check(z.deco.startsWith('underline') && !z.deco.endsWith('0)'), `${tag}: subrayado visible en reposo`, z.deco);
    if (w < 640) check(z.a.top >= z.b.bottom - 0.5, '360: el área del enlace no pisa INGRESAR', `enlace ${Math.round(z.a.top)} ≥ botón ${Math.round(z.b.bottom)}`);
    await shot(page, `enlace-${tag}-reposo`, clip);
    if (w > 640) {
      check(z.a.right <= z.b.left, '1280: el área del enlace no pisa INGRESAR');
      await page.hover('.forgot-password-link'); await page.waitForTimeout(220);
      const hv = await page.evaluate(() => {
        const el = document.querySelector('.forgot-password-link'), cs = getComputedStyle(el);
        return { ex: document.querySelector('.login-form-extras').getBoundingClientRect().height, w: el.getBoundingClientRect().width, color: cs.color, grosor: cs.textDecorationThickness };
      });
      check(Math.abs(hv.ex - z.ex) < 0.5 && Math.abs(hv.w - z.a.w) < 0.5, 'Hover sin salto de layout (fila y ancho del enlace iguales)', `${z.color} → ${hv.color}, subrayado ${hv.grosor}`);
      check(z.cursor === 'pointer', 'Cursor de mano');
      await shot(page, `enlace-${tag}-hover`, clip);
      await page.mouse.move(0, 0);
      await page.focus('.password-toggle-btn'); await page.keyboard.press('Tab'); await page.waitForTimeout(200);
      const foco = await page.evaluate(() => { const el = document.activeElement, cs = getComputedStyle(el); return { es: el.classList.contains('forgot-password-link'), o: `${cs.outlineStyle} ${cs.outlineWidth}` }; });
      check(foco.es && foco.o === 'solid 2px', 'Foco por teclado visible', foco.o);
      await shot(page, `enlace-${tag}-foco`, clip);
      await page.keyboard.press('Enter');
      await page.locator('.recuperar-tarjeta').waitFor({ state: 'attached' });
      check(true, 'Enter sobre el enlace abre el modal');
    }
    await context.close();
  }
}

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
await enlace(browser);
await estados(browser);
await teclado(browser);
await respuestas(browser);
await comportamiento(browser);
await transicion(browser);
await colision(browser);
await browser.close();
console.log(`\nPedidos a producción: 0 (todo interceptado; ${abortadas} pedido(s) ajeno(s) abortado(s) sin salir del navegador).`);
console.log(fallos ? `\n✗ ${fallos} chequeo(s) fallaron` : '\n✓ Todos los chequeos pasan');
process.exit(fallos ? 1 : 0);
