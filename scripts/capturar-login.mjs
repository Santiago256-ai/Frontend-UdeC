/**
 * Evidencia visual del Login (Landing) — Rediseño "Doble Vitrina".
 *
 * Uso:
 *   1. En una terminal:  npm run dev          (deja Vite en http://localhost:5173)
 *   2. En otra:          npm run capturar:login
 *
 * Genera PNGs en  frontend/tests/evidencia/login/  con los estados:
 *   desktop 1280 · borde 899/900 (apilado → vitrina) · tablet 820 · móvil 390/360 ·
 *   hover/foco del botón ⓘ · modal "Acerca de" abierto (desktop y 360px) · reduced-motion
 *
 * Además de las capturas, imprime geometría real (boundingBox) del botón ⓘ contra
 * el escudo UdeC — no basta con que el botón "exista", tiene que tener separación
 * real y un área táctil de al menos 44x44px.
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const BASE = process.env.LOGIN_URL || 'http://localhost:5173';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, '../tests/evidencia/login');

async function abrir(context) {
  const page = await context.newPage();
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await page.locator('.navbar-udec').waitFor({ state: 'visible', timeout: 15000 });
  await page.waitForTimeout(500); // animaciones de entrada
  return page;
}

async function shot(page, name) {
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log('  ✓', path.relative(process.cwd(), file));
}

/** Verifica que el botón ⓘ no compita/solape con el escudo UdeC y que su área táctil sea >= 44x44. */
async function verificarBotonInfo(page, etiqueta) {
  const escudo = page.locator('.navbar-secondary-logo img');
  const boton = page.locator('.info-trigger-btn');

  const [bEscudo, bBoton] = await Promise.all([
    escudo.boundingBox(),
    boton.boundingBox(),
  ]);

  if (!bEscudo || !bBoton) {
    console.log(`  ✗ [${etiqueta}] no se pudo medir escudo o botón ⓘ`);
    return;
  }

  const gap = bBoton.x - (bEscudo.x + bEscudo.width);
  const overlap = bBoton.x < bEscudo.x + bEscudo.width && bBoton.x + bBoton.width > bEscudo.x
    && bBoton.y < bEscudo.y + bEscudo.height && bBoton.y + bBoton.height > bEscudo.y;

  console.log(`  · [${etiqueta}] escudo=${Math.round(bEscudo.width)}x${Math.round(bEscudo.height)} @x${Math.round(bEscudo.x)}` +
    ` | botón=${Math.round(bBoton.width)}x${Math.round(bBoton.height)} @x${Math.round(bBoton.x)}` +
    ` | separación=${Math.round(gap)}px | solapa=${overlap}`);

  if (overlap) console.log(`  ✗ [${etiqueta}] el botón ⓘ SOLAPA con el escudo UdeC`);
  if (bBoton.width < 44 || bBoton.height < 44) console.log(`  ✗ [${etiqueta}] área táctil del botón ⓘ menor a 44x44 (${bBoton.width}x${bBoton.height})`);
  if (gap < 6) console.log(`  ✗ [${etiqueta}] separación visual menor a 6px entre ⓘ y escudo`);
}

/** Confirma que el layout de dos paneles no produce scroll vertical en la página. */
async function verificarSinScroll(page, etiqueta) {
  const { scrollHeight, clientHeight } = await page.evaluate(() => ({
    scrollHeight: document.documentElement.scrollHeight,
    clientHeight: document.documentElement.clientHeight,
  }));
  const desbordeVertical = scrollHeight - clientHeight;
  console.log(`  · [${etiqueta}] scrollHeight=${scrollHeight} clientHeight=${clientHeight} desborde=${desbordeVertical}px`);
  if (desbordeVertical > 2) console.log(`  ✗ [${etiqueta}] la página necesita scroll (${desbordeVertical}px de desborde)`);
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();

  // ---------- DESKTOP 1280+ — Doble Vitrina ----------
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });
    const page = await abrir(context);
    await shot(page, '01-desktop-1280-vitrina');
    await verificarSinScroll(page, 'desktop-1280');
    await verificarBotonInfo(page, 'desktop-1280');

    // hover del botón ⓘ
    await page.locator('.info-trigger-btn').hover();
    await page.waitForTimeout(250);
    await shot(page, '02-desktop-hover-info');

    // foco por teclado (Tab hasta el botón ⓘ)
    await page.keyboard.press('Tab'); // navbar-logo (sin control enfocable) → primer <a>/<button> real
    await page.locator('.info-trigger-btn').focus();
    await page.waitForTimeout(150);
    await shot(page, '03-desktop-foco-teclado-info');

    // abrir modal "Acerca de"
    await page.locator('.info-trigger-btn').click();
    await page.waitForTimeout(400);
    await shot(page, '04-desktop-modal-acerca-de');
    const copyrightVisible = await page.locator('.e360-copyright').isVisible();
    console.log(`  · [desktop-1280] línea de copyright visible en el modal: ${copyrightVisible}`);

    await context.close();
  }

  // ---------- BORDE DEL BREAKPOINT: 899 (apilado) vs 900 (vitrina) ----------
  {
    const context = await browser.newContext({ viewport: { width: 899, height: 900 }, deviceScaleFactor: 2 });
    const page = await abrir(context);
    await shot(page, '05-borde-899-apilado');
    const heroWidth899 = await page.locator('.hero-udec').evaluate((el) => getComputedStyle(el).width);
    console.log(`  · [899px] ancho computado de .hero-udec = ${heroWidth899} (debe ser ~100% del ancho, apilado)`);
    await context.close();
  }
  {
    const context = await browser.newContext({ viewport: { width: 900, height: 900 }, deviceScaleFactor: 2 });
    const page = await abrir(context);
    await shot(page, '06-borde-900-vitrina');
    const heroWidth900 = await page.locator('.hero-udec').evaluate((el) => getComputedStyle(el).width);
    console.log(`  · [900px] ancho computado de .hero-udec = ${heroWidth900} (debe ser ~38% del ancho, vitrina)`);
    await verificarSinScroll(page, 'borde-900');
    await context.close();
  }

  // ---------- TABLET 820 — apilado actual ----------
  {
    const context = await browser.newContext({ viewport: { width: 820, height: 1180 }, deviceScaleFactor: 2 });
    const page = await abrir(context);
    await shot(page, '07-tablet-820-apilado');
    await verificarBotonInfo(page, 'tablet-820');
    await context.close();
  }

  // ---------- MÓVIL 390 ----------
  {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const page = await abrir(context);
    await shot(page, '08-movil-390-apilado');
    await verificarBotonInfo(page, 'movil-390');
    await page.locator('.info-trigger-btn').tap();
    await page.waitForTimeout(400);
    await shot(page, '09-movil-390-modal-acerca-de');
    const bModalBody390 = await page.locator('.e360-modal-body').boundingBox();
    console.log(`  · [movil-390] .e360-modal-body boundingBox = ${JSON.stringify(bModalBody390)}`);
    await context.close();
  }

  // ---------- MÓVIL 360 (el más angosto que soportamos) ----------
  {
    const context = await browser.newContext({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const page = await abrir(context);
    await shot(page, '10-movil-360-apilado');
    await verificarBotonInfo(page, 'movil-360');

    await page.locator('.info-trigger-btn').tap();
    await page.waitForTimeout(400);
    await shot(page, '11-movil-360-modal-acerca-de');

    // Legibilidad: el copyright y el cierre del modal deben quedar dentro del viewport, sin recorte horizontal
    const card = await page.locator('.e360-about-card').boundingBox();
    const vp = page.viewportSize();
    console.log(`  · [movil-360] tarjeta modal = ${JSON.stringify(card)} vs viewport ${JSON.stringify(vp)}`);
    if (card && (card.x < 0 || card.x + card.width > vp.width)) {
      console.log('  ✗ [movil-360] la tarjeta del modal se corta horizontalmente');
    }
    const copyrightBox = await page.locator('.e360-copyright').boundingBox();
    console.log(`  · [movil-360] .e360-copyright boundingBox = ${JSON.stringify(copyrightBox)}`);

    await context.close();
  }

  // ---------- REDUCED MOTION ----------
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
    const page = await abrir(context);
    await page.locator('.info-trigger-btn').click();
    await page.waitForTimeout(200);
    await shot(page, '12-desktop-reduced-motion-modal');
    await context.close();
  }

  await browser.close();
  console.log('\nEvidencia en', path.relative(process.cwd(), OUT));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
