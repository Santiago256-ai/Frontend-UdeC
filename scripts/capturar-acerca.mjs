/**
 * Evidencia visual del modal "Acerca de Empres360 PRO" — dirección "Expediente".
 *
 * Uso:
 *   1. En una terminal:  npm run dev          (deja Vite en http://localhost:5173)
 *   2. En otra:          npm run capturar:acerca
 *
 * Genera PNGs en  frontend/tests/evidencia/acerca/ :
 *   default por breakpoint (1280×800, 820×1180, 390×844, 360×640) ·
 *   Objetivos y Equipo a 820 y 768 ·
 *   otra pestaña activa (Equipo, la más larga) · foco por teclado en el índice
 *
 * Además imprime geometría real (boundingBox / scrollHeight / getComputedStyle),
 * no isVisible(): X de 44×44 dentro del viewport, 5/5 pestañas visibles, cero
 * scroll o scroll sólo en el área de lectura, alto de tarjeta constante entre
 * pestañas, pie alcanzable, sin desborde horizontal, accesibilidad del diálogo,
 * reduced-motion y chequeo de colisión de clases (cadena de ancestros + reglas
 * ajenas que alcanzan nodos del modal).
 *
 * Barrido de ríos del justificado (600–1040px) en tres motores: Chromium y Firefox
 * cuentan como chequeo; WebKit es INFORMATIVO (el WebKit de Playwright en Windows no
 * tiene diccionario de partición para español, ver DESIGN.md §9).
 *
 * Otro motor para la batería completa:  MOTOR=firefox npm run capturar:acerca
 * (sus capturas van a tests/evidencia/acerca/<motor>/).
 */
import { chromium, firefox, webkit } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const BASE = process.env.LOGIN_URL || 'http://localhost:5173';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MOTORES = { chromium, firefox, webkit };
const MOTOR = process.env.MOTOR || 'chromium';
if (!MOTORES[MOTOR]) throw new Error(`MOTOR desconocido: ${MOTOR} (chromium | firefox | webkit)`);
const OUT = path.resolve(__dirname, '../tests/evidencia/acerca', MOTOR === 'chromium' ? '' : MOTOR);

// Clases de primer nivel compartidas sin ámbito entre VacantesDashboard.css y
// EmpresaDashboard/*.css (DESIGN.md §3 contó 31; esta extracción da 36 porque
// incluye Toastify__* y ql-*). Ninguna debe aparecer dentro del modal.
const COMPARTIDAS = ['Toastify__close-button', 'Toastify__toast', 'bar-green', 'bar-orange', 'btn-cancel', 'btn-confirm',
  'collapse-btn-footer', 'content-inner', 'dashboard-layout', 'glass-container', 'header-center', 'header-content',
  'header-logo-img', 'header-right', 'header-top-bar', 'icon-transition', 'logo-full-expanded', 'logo-icon-collapsed',
  'logo-section', 'logout-modal', 'main-header-container', 'menu-item', 'modal-overlay', 'no-selection-state',
  'ql-align-center', 'ql-align-justify', 'ql-align-right', 'search-wrapper', 'section-title-container', 'sidebar',
  'sidebar-footer', 'sidebar-top', 'user-avatar-initials', 'user-details', 'user-profile-info', 'vacantes-count-badge'];

let fallos = 0;
const check = (ok, etiqueta, detalle = '') => {
  if (!ok) fallos++;
  console.log(`  ${ok ? '✓' : '✗'} ${etiqueta}${detalle ? ` — ${detalle}` : ''}`);
};

async function abrirModal(browser, { width, height, reducedMotion = 'no-preference' }) {
  // Firefox no admite isMobile en Playwright: ahí el móvil se emula sólo por viewport + touch.
  const movil = width < 640;
  const esFirefox = browser.browserType().name() === 'firefox';
  const context = await browser.newContext({
    viewport: { width, height }, deviceScaleFactor: 2, isMobile: movil && !esFirefox, hasTouch: movil, reducedMotion,
  });
  const page = await context.newPage();
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.locator('.info-trigger-btn').click();
  await page.locator('.acerca-tarjeta').waitFor({ state: 'attached' });
  await page.waitForTimeout(450); // entrada 240ms + margen
  return { context, page };
}

async function shot(page, nombre) {
  const file = path.join(OUT, `${nombre}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log('  📸', path.relative(process.cwd(), file));
}

/** Geometría del estado actual del modal. */
function medir(page) {
  return page.evaluate(() => {
    const vw = innerWidth, vh = innerHeight;
    const caja = (el) => el.getBoundingClientRect();
    const dentro = (b) => b.left >= 0 && b.top >= 0 && b.right <= vw && b.bottom <= vh;
    const tarjeta = document.querySelector('.acerca-tarjeta');
    const cerrar = caja(document.querySelector('.acerca-cerrar'));
    const lectura = document.querySelector('.acerca-lectura');
    const scrollers = [tarjeta, ...tarjeta.querySelectorAll('*')].filter((el) => {
      const o = getComputedStyle(el).overflowY;
      return (o === 'auto' || o === 'scroll') && el.scrollHeight > el.clientHeight + 1;
    });
    const desbordeX = [tarjeta, ...tarjeta.querySelectorAll('*')].some((el) => {
      const cs = getComputedStyle(el);
      return el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 1 && cs.overflowX !== 'hidden' && cs.overflowX !== 'clip';
    });
    return {
      tarjetaH: Math.round(caja(tarjeta).height),
      tarjetaDentro: dentro(caja(tarjeta)),
      cerrar: { w: Math.round(cerrar.width), h: Math.round(cerrar.height), dentro: dentro(cerrar) },
      tabsVisibles: [...document.querySelectorAll('.acerca-tab')].filter((t) => dentro(caja(t))).length,
      scrollers: scrollers.map((el) => el.className.split(' ')[0]),
      lectura: { client: lectura.clientHeight, scroll: lectura.scrollHeight },
      docDesbordeX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      desbordeX,
      fuente: getComputedStyle(document.querySelector('.acerca-prosa p')).fontFamily.split(',')[0].replace(/"/g, ''),
      alineacion: getComputedStyle(document.querySelector('.acerca-prosa p')).textAlign,
      rios: medirRios(),
    };

    // Ríos (geometría): hueco máximo entre palabras de una misma línea, sin
    // contar la última línea de cada párrafo, dividido por el ancho de un
    // espacio normal de la fuente. Texto bien compuesto ≈ 1–1.8; > 2.5 = hueco visible.
    function medirRios() {
      let peor = 0;
      for (const p of document.querySelectorAll('.acerca-prosa p')) {
        const cs = getComputedStyle(p);
        const ctx = document.createElement('canvas').getContext('2d');
        ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
        const espacio = ctx.measureText(' ').width;
        const rects = [];
        const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
        for (let n = walker.nextNode(); n; n = walker.nextNode()) {
          for (const m of n.textContent.matchAll(/\S+/g)) {
            const r = document.createRange();
            r.setStart(n, m.index);
            r.setEnd(n, m.index + m[0].length);
            for (const b of r.getClientRects()) if (b.width > 0) rects.push(b);
          }
        }
        const lineas = new Map();
        for (const b of rects) {
          const k = Math.round(b.top);
          if (!lineas.has(k)) lineas.set(k, []);
          lineas.get(k).push(b);
        }
        const claves = [...lineas.keys()].sort((a, b) => a - b).slice(0, -1);
        for (const k of claves) {
          const fila = lineas.get(k).sort((a, b) => a.left - b.left);
          for (let i = 1; i < fila.length; i++) peor = Math.max(peor, (fila[i].left - fila[i - 1].right) / espacio);
        }
      }
      return Math.round(peor * 100) / 100;
    }
  });
}

/** Lleva el área de lectura al final y comprueba que el pie visible queda entero en pantalla. */
function pieAlcanzable(page) {
  return page.evaluate(() => {
    document.querySelector('.acerca-lectura').scrollTop = 1e6;
    const pie = [...document.querySelectorAll('.acerca-pie')].find((el) => el.offsetParent !== null);
    if (!pie) return false;
    const b = pie.getBoundingClientRect();
    const ok = b.top >= 0 && b.bottom <= innerHeight + 1;
    document.querySelector('.acerca-lectura').scrollTop = 0;
    return ok;
  });
}

/**
 * Barrido de ríos del justificado: cada ancho de 600 a 1040px (paso 8px), las 5 pestañas,
 * debe quedar justificado sin ríos (hueco ≤ 2.5 espacios) o alineado a la izquierda, y sin
 * desborde horizontal. Con `informativo` reporta pero no cuenta como fallo del script.
 */
async function barridoJustificado(navegador, nombre, { informativo = false } = {}) {
  console.log(`\n▸ barrido de justificado — ${nombre} ${navegador.version()} (600–1040px, paso 8px)${informativo ? ' [informativo]' : ''}`);
  const { context, page } = await abrirModal(navegador, { width: 1040, height: 1000 });
  const fallas = [];
  let justificados = 0, izquierda = 0;
  for (let w = 600; w <= 1040; w += 8) {
    await page.setViewportSize({ width: w, height: 1000 });
    await page.waitForTimeout(80);
    let peor = 0, alin = '';
    for (let i = 0; i < 5; i++) {
      await page.locator('.acerca-tab').nth(i).click();
      await page.waitForTimeout(40);
      const m = await medir(page);
      peor = Math.max(peor, m.rios); alin = m.alineacion;
      if (m.docDesbordeX || m.desbordeX) fallas.push(`${w}px desborde horizontal`);
    }
    if (alin === 'justify') justificados++; else izquierda++;
    if (peor > 2.5) fallas.push(`${w}px ${alin} ${peor}×`);
  }
  const resumen = fallas.length ? fallas.join(' · ') : `${justificados} anchos justificados, ${izquierda} a la izquierda`;
  if (informativo) {
    console.log(`  ${fallas.length ? 'ℹ' : '✓'} [informativo, no cuenta] ${nombre}: ${fallas.length ? `${fallas.length} anchos con ríos/desborde` : 'sin ríos ni desborde'} — ${resumen}`);
  } else {
    check(fallas.length === 0, `${nombre}: ningún ancho de 600 a 1040px con ríos (> 2.5) ni desborde`, resumen);
  }
  await context.close();
}

/** Captura sólo el área de lectura con la pestaña i activa (puntero fuera para no dejar hover). */
async function capturarLectura(page, i, nombre) {
  await page.locator('.acerca-tab').nth(i).click();
  await page.mouse.move(2, 2);
  await page.waitForTimeout(250);
  const file = path.join(OUT, `${nombre}.png`);
  await page.locator('.acerca-lectura').screenshot({ path: file });
  console.log('  📸', path.relative(process.cwd(), file));
}

async function verificarBreakpoint(browser, { width, height, nombre, scrollPermitido, justificado = false }) {
  console.log(`\n▸ ${nombre} (${width}×${height})`);
  const { context, page } = await abrirModal(browser, { width, height });
  const alturas = new Set();
  const porTab = [];
  const nTabs = await page.locator('.acerca-tab').count();
  for (let i = 0; i < nTabs; i++) {
    await page.locator('.acerca-tab').nth(i).click();
    await page.waitForTimeout(220);
    const m = await medir(page);
    alturas.add(m.tarjetaH);
    porTab.push(m);
  }
  await page.locator('.acerca-tab').first().click();
  await page.waitForTimeout(220);
  const m = porTab[0];

  check(m.cerrar.w >= 44 && m.cerrar.h >= 44 && m.cerrar.dentro, 'X de 44×44 dentro del viewport', `${m.cerrar.w}×${m.cerrar.h}`);
  check(m.tarjetaDentro, 'tarjeta completa dentro del viewport');
  check(porTab.every((t) => t.tabsVisibles === 5), '5/5 pestañas visibles', porTab.map((t) => t.tabsVisibles).join(','));
  check(alturas.size === 1, 'alto de tarjeta constante en las 5 pestañas', [...alturas].join('/') + 'px');
  const conScroll = porTab.filter((t) => t.scrollers.length);
  if (scrollPermitido) {
    check(porTab.every((t) => t.scrollers.every((s) => s === 'acerca-lectura') && t.scrollers.length <= 1),
      'scroll sólo en el área de lectura', porTab.map((t) => `${t.lectura.client}/${t.lectura.scroll}`).join(' · '));
  } else {
    check(conScroll.length === 0, 'cero scroll en las 5 pestañas', porTab.map((t) => `${t.lectura.client}/${t.lectura.scroll}`).join(' · '));
  }
  check(porTab.every((t) => t.docDesbordeX === 0 && !t.desbordeX), 'sin desborde horizontal');
  check(m.fuente === 'Montserrat', 'texto en Montserrat', m.fuente);
  // La alineación la decide el ancho de la columna (container query): justificado sólo con columna ≥ 478px.
  const alineacionEsperada = justificado ? 'justify' : 'left';
  check(porTab.every((t) => t.alineacion === alineacionEsperada), `párrafos con text-align: ${alineacionEsperada}`, porTab[0].alineacion);
  const peorRio = Math.max(...porTab.map((t) => t.rios));
  check(peorRio <= 2.5, 'sin ríos: hueco máximo entre palabras ≤ 2.5 espacios', `peor ${peorRio}× (por pestaña: ${porTab.map((t) => t.rios).join(' · ')})`);

  let pieOk = true;
  for (let i = 0; i < nTabs; i++) {
    await page.locator('.acerca-tab').nth(i).click();
    await page.waitForTimeout(220);
    pieOk = pieOk && (await pieAlcanzable(page));
  }
  check(pieOk, 'pie (© y Ministerio) alcanzable completo en las 5 pestañas');
  await page.locator('.acerca-tab').first().click();
  await page.waitForTimeout(220);
  return { context, page };
}

async function main() {
  await mkdir(OUT, { recursive: true });
  console.log(`Motor de la batería: ${MOTOR}`);
  const browser = await MOTORES[MOTOR].launch();

  // ---------- 1280×800: default + otra pestaña + foco por teclado + a11y ----------
  {
    const { context, page } = await verificarBreakpoint(browser, { width: 1280, height: 800, nombre: 'desktop-1280x800', justificado: true });
    await shot(page, '01-desktop-1280-default');

    await page.locator('.acerca-tab').nth(4).click();
    await page.waitForTimeout(250);
    await shot(page, '02-desktop-1280-pestana-equipo');

    // Accesibilidad del diálogo
    const a11y = await page.evaluate(() => {
      const t = document.querySelector('.acerca-tarjeta');
      const lbl = document.getElementById(t.getAttribute('aria-labelledby'));
      return {
        role: t.getAttribute('role'), modal: t.getAttribute('aria-modal'),
        nombre: lbl ? (lbl.textContent + (lbl.querySelector('img')?.alt || '')).trim() : null,
        cerrarLabel: document.querySelector('.acerca-cerrar').getAttribute('aria-label'),
        tablist: !!document.querySelector('[role="tablist"]'),
        selected: [...document.querySelectorAll('[role="tab"]')].map((x) => x.getAttribute('aria-selected')).join(','),
        rootOverflow: [getComputedStyle(document.documentElement).overflowY, getComputedStyle(document.body).overflowY].join('/'),
      };
    });
    check(a11y.role === 'dialog' && a11y.modal === 'true', 'role="dialog" + aria-modal="true"');
    check(!!a11y.nombre, 'aria-labelledby resuelve a un nombre', a11y.nombre);
    check(a11y.cerrarLabel === 'Cerrar', 'X con aria-label');
    check(a11y.rootOverflow === 'hidden/hidden', 'scroll del fondo bloqueado (html/body overflow-y)', a11y.rootOverflow);

    // Teclado: foco al índice, flechas / Inicio / Fin (puntero fuera, para que no quede un hover en la captura)
    await page.mouse.move(1270, 790);
    await page.locator('.acerca-tab').nth(4).focus();
    await page.keyboard.press('Home');
    const trasHome = await page.evaluate(() => document.activeElement.textContent);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    const trasFlechas = await page.evaluate(() => [document.activeElement.textContent, document.activeElement.getAttribute('aria-selected')]);
    check(trasHome.includes('¿Qué es') && trasFlechas[0] === 'Nuestra Misión' && trasFlechas[1] === 'true', 'teclado: Inicio + ↓↓ activa "Nuestra Misión"');
    await page.waitForTimeout(250);
    await shot(page, '03-desktop-1280-foco-teclado-indice');
    await page.keyboard.press('End');
    check((await page.evaluate(() => document.activeElement.textContent)).startsWith('Equipo'), 'teclado: Fin va a "Equipo"');

    // Trampa de foco: 20 Tabs no salen de la tarjeta
    let escapa = false;
    for (let i = 0; i < 20 && !escapa; i++) {
      await page.keyboard.press('Tab');
      escapa = await page.evaluate(() => !document.activeElement.closest('.acerca-tarjeta'));
    }
    check(!escapa, 'foco atrapado dentro del modal (20 Tabs)');

    // Fundido de pestaña: ninguno con teclado, desde .5 con puntero
    const animTeclado = await page.evaluate(() => getComputedStyle(document.querySelector('.acerca-panel')).animationName);
    check(animTeclado === 'none', 'pestaña cambiada con teclado: sin fundido', animTeclado);
    await page.mouse.move(1270, 790);
    await page.locator('.acerca-tab').nth(1).click();
    const animPuntero = await page.evaluate(() => {
      const el = document.querySelector('.acerca-panel');
      return [getComputedStyle(el).animationName, el.getAnimations()[0]?.effect.getKeyframes()[0]?.opacity];
    });
    check(animPuntero[0] === 'acerca-fundido-tab' && String(animPuntero[1]) === '0.5', 'pestaña cambiada con clic: fundido desde opacidad .5', animPuntero.join(' desde '));
    await page.waitForTimeout(250);
    await page.locator('.acerca-tab').nth(4).focus();

    // Esc cierra y devuelve el foco al ⓘ
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    check((await page.locator('.acerca-overlay').count()) === 0, 'Esc cierra');
    check(await page.evaluate(() => document.activeElement.classList.contains('info-trigger-btn')), 'foco devuelto al ⓘ');
    const restaurado = await page.evaluate(() => [document.documentElement.style.overflow, document.body.style.overflow].join('/'));
    check(restaurado === '/', 'overflow en línea de html/body restaurado al cerrar', restaurado || 'vacío');

    // Clic fuera cierra
    await page.locator('.info-trigger-btn').click();
    await page.waitForTimeout(400);
    await page.mouse.click(20, 400);
    await page.waitForTimeout(300);
    check((await page.locator('.acerca-overlay').count()) === 0, 'clic fuera cierra');

    // Guardia de doble cierre: X y Esc casi a la vez → un solo onClose, overlay sin clics durante la salida
    await page.locator('.info-trigger-btn').click();
    await page.waitForTimeout(400);
    await page.evaluate(() => {
      const btn = document.querySelector('.acerca-cerrar');
      btn.click();
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      btn.click();
    });
    await page.waitForTimeout(40);
    const durante = await page.evaluate(() => {
      const o = document.querySelector('.acerca-overlay');
      return o ? [getComputedStyle(o).pointerEvents, getComputedStyle(o).animationName, getComputedStyle(o.querySelector('.acerca-tarjeta')).animationTimingFunction] : null;
    });
    check(durante && durante[0] === 'none', 'overlay con pointer-events: none durante la salida', durante?.[0]);
    check(durante && durante[2] === 'cubic-bezier(0.23, 1, 0.32, 1)', 'salida de la tarjeta con var(--acerca-ease)', durante?.[2]);
    await page.waitForTimeout(300);
    const trasCierre = await page.evaluate(() => ({ abierto: !!document.querySelector('.acerca-overlay'), foco: document.activeElement.className }));
    check(!trasCierre.abierto && trasCierre.foco.includes('info-trigger-btn'), 'triple disparo de cierre: cierra una vez y devuelve el foco', JSON.stringify(trasCierre));

    // :active de la X
    const activa = await page.evaluate(() => {
      for (const hoja of document.styleSheets) {
        let reglas; try { reglas = hoja.cssRules; } catch { continue; }
        for (const r of reglas) if (r.selectorText === '.acerca-cerrar:active') return r.style.transform;
      }
      return null;
    });
    check(activa === 'scale(0.97)', ':active de la X a scale(0.97)', activa);

    // Colisión de clases
    await page.locator('.info-trigger-btn').click();
    await page.waitForTimeout(400);
    const colision = await page.evaluate((compartidas) => {
      const tarjeta = document.querySelector('.acerca-tarjeta');
      const nodos = [tarjeta, ...tarjeta.querySelectorAll('*')];
      const clasesModal = new Set(nodos.flatMap((n) => [...n.classList]));
      const ajenasPrefijo = [...clasesModal].filter((c) => !c.startsWith('acerca-') && !c.startsWith('lucide'));
      const choque = [...clasesModal].filter((c) => compartidas.includes(c));
      // Cadena de ancestros hasta <body>: ninguna clase compartida ni transform/margin heredado
      const cadena = [];
      for (let el = tarjeta.parentElement; el && el !== document.body; el = el.parentElement) {
        const cs = getComputedStyle(el);
        cadena.push({ el: el.tagName + (el.className ? '.' + [...el.classList].join('.') : ''), transform: cs.transform, margin: cs.margin, position: cs.position });
      }
      const cadenaChoque = cadena.filter((c) => compartidas.some((k) => c.el.split('.').includes(k)));
      // Reglas de otras hojas que alcanzan nodos del modal (salvo `*`, html, body, :root)
      const ajenas = new Set();
      for (const hoja of document.styleSheets) {
        const origen = hoja.ownerNode?.getAttribute?.('data-vite-dev-id') || hoja.href || 'inline';
        if (/AcercaDeModal\.css/.test(origen)) continue;
        let reglas; try { reglas = hoja.cssRules; } catch { continue; }
        const recorrer = (lista) => {
          for (const r of lista) {
            if (r.cssRules && !r.selectorText) { recorrer(r.cssRules); continue; }
            if (!r.selectorText) continue;
            for (const sel of r.selectorText.split(',').map((s) => s.trim())) {
              if (/^(\*|html|body|:root|::?[\w-]+|\*::?[\w-]+)$/.test(sel)) continue;
              try { if (nodos.some((n) => n.matches(sel))) ajenas.add(`${sel}  ← ${origen.split('/').slice(-1)[0]}`); } catch { /* selector no evaluable */ }
            }
          }
        };
        recorrer(reglas);
      }
      return { ajenasPrefijo, choque, cadena, cadenaChoque, reglasAjenas: [...ajenas] };
    }, COMPARTIDAS);
    check(colision.choque.length === 0, 'ninguna de las 36 clases compartidas dentro del modal');
    check(colision.ajenasPrefijo.length === 0, 'todas las clases del modal llevan prefijo acerca-', colision.ajenasPrefijo.join(', '));
    check(colision.cadenaChoque.length === 0, 'cadena de ancestros sin clases compartidas', colision.cadena.map((c) => `${c.el} [${c.position}, transform ${c.transform}]`).join(' → '));
    console.log(`  · reglas de otras hojas que alcanzan nodos del modal: ${colision.reglasAjenas.length ? '\n      ' + colision.reglasAjenas.join('\n      ') : 'ninguna'}`);

    await context.close();
  }

  // ---------- 1280×650 (portátil bajo) ----------
  {
    const { context } = await verificarBreakpoint(browser, { width: 1280, height: 650, nombre: 'desktop-1280x650', justificado: true });
    await context.close();
  }

  // ---------- Tablet 820×1180 ----------
  {
    const { context, page } = await verificarBreakpoint(browser, { width: 820, height: 1180, nombre: 'tablet-820' });
    await shot(page, '04-tablet-820-default');
    await capturarLectura(page, 1, '07-tablet-820-objetivos');
    await capturarLectura(page, 4, '08-tablet-820-equipo');
    await context.close();
  }

  // ---------- Tablet 768×1024 (borde inferior del rango, columna de lectura más estrecha) ----------
  {
    const { context, page } = await verificarBreakpoint(browser, { width: 768, height: 1024, nombre: 'tablet-768' });
    await capturarLectura(page, 1, '09-tablet-768-objetivos');
    await capturarLectura(page, 4, '10-tablet-768-equipo');
    await context.close();
  }

  // ---------- Móvil 390 y 360 ----------
  {
    const { context, page } = await verificarBreakpoint(browser, { width: 390, height: 844, nombre: 'movil-390', scrollPermitido: true });
    await shot(page, '05-movil-390-default');
    // En el apilado <900px la página de fondo sí tiene scroll: con el modal abierto no debe moverse
    // (gesto real de rueda sobre el borde del overlay; scrollTo() programático ignora overflow:hidden)
    const puede = await page.evaluate(() => document.documentElement.scrollHeight > innerHeight);
    await page.mouse.move(4, 420);
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(300);
    const scrollY = await page.evaluate(() => window.scrollY);
    check(puede && scrollY === 0, 'fondo inmóvil con el modal abierto (rueda 600px sobre el overlay → scrollY)', String(scrollY));
    await context.close();
  }
  {
    const { context, page } = await verificarBreakpoint(browser, { width: 360, height: 640, nombre: 'movil-360x640', scrollPermitido: true });
    await shot(page, '06-movil-360-default');
    await context.close();
  }

  // ---------- Barrido de robustez del justificado: 600–1040px, paso 8px, tres motores ----------
  // El justificado es sensible a fracciones de píxel; medir sólo 768/820/1280 escondería
  // anchos intermedios con ríos. Chromium y Firefox cuentan; WebKit sólo informa.
  for (const nombre of ['chromium', 'firefox', 'webkit']) {
    const navegador = nombre === MOTOR ? browser : await MOTORES[nombre].launch();
    await barridoJustificado(navegador, nombre, { informativo: nombre === 'webkit' });
    if (navegador !== browser) await navegador.close();
  }

  // ---------- Reduced motion: sólo fundido ----------
  {
    console.log('\n▸ reduced-motion (1280×800)');
    const { context, page } = await abrirModal(browser, { width: 1280, height: 800, reducedMotion: 'reduce' });
    const anim = await page.evaluate(() => ({
      overlay: getComputedStyle(document.querySelector('.acerca-overlay')).animationName,
      tarjeta: getComputedStyle(document.querySelector('.acerca-tarjeta')).animationName,
      panel: getComputedStyle(document.querySelector('.acerca-panel')).animationName,
    }));
    check(anim.overlay === 'acerca-fundido' && anim.tarjeta === 'none' && anim.panel === 'none',
      'sólo fundido del overlay; sin escala/desplazamiento ni fundido de pestaña', JSON.stringify(anim));
    await page.keyboard.press('Escape');
    await page.waitForTimeout(40);
    const salidaReducida = await page.evaluate(() => {
      const o = document.querySelector('.acerca-overlay');
      return o ? [getComputedStyle(o).animationName, getComputedStyle(o).animationDuration, getComputedStyle(o.querySelector('.acerca-tarjeta')).animationName] : null;
    });
    check(salidaReducida && salidaReducida[0] === 'acerca-fundido-out' && salidaReducida[1] === '0.15s' && salidaReducida[2] === 'none',
      'salida con movimiento reducido: fundido de 150ms sólo de opacidad', JSON.stringify(salidaReducida));
    await page.waitForTimeout(250);
    check((await page.locator('.acerca-overlay').count()) === 0, 'salida reducida: el modal se desmonta');
    await context.close();
  }

  await browser.close();
  console.log(`\n${fallos ? `✗ ${fallos} chequeo(s) fallaron` : '✓ todos los chequeos pasaron'} — evidencia en ${path.relative(process.cwd(), OUT)}`);
  if (fallos) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
