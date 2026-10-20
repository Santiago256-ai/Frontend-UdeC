/**
 * Evidencia visual del Menú de Navegación Principal (Egresado) — Rumbo B "Sello en Marcha".
 *
 * Uso:
 *   1. En una terminal:  npm run dev          (deja Vite en http://localhost:5173)
 *   2. En otra:          npm run capturar:menu
 *
 * Genera PNGs en  frontend/tests/evidencia/menu/  con los estados:
 *   default · hover · foco-teclado · activo-otro · aviso-nuevo · reduced-motion · tablet · movil
 *
 * El backend real (backend-ude-c.vercel.app) se intercepta con respuestas mínimas
 * para que las capturas sean deterministas y no dependan de la red.
 */
import { chromium, devices } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const BASE = process.env.MENU_URL || 'http://localhost:5173';
const RUTA = '/vacantes-dashboard';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, '../tests/evidencia/menu');

// --- Usuario de prueba sembrado en localStorage antes de cargar la app ---
const USUARIO = {
  id: 'egresado-demo',
  nombres: 'Deivid Santiago',
  apellidos: 'Olivar Rodriguez',
  programa: 'Ingeniería Ambiental',
  rol: 'EGRESADO',
  foto: null,
};

// Vacante base repetida para poblar el contador — 4 abiertas sin postular + 2 ya postuladas
// por el egresado demo → badge "Vacantes" = 4, badge "Solicitudes" = 2.
const vac = (id, extra = {}) => ({
  id, titulo: 'Analista ambiental junior', estado: 'ABIERTA',
  modalidad: 'PRESENCIAL', ubicacion: 'Soacha', salario: '2500000',
  tipoContrato: 'Término Fijo', jornada: 'Tiempo Completo', horario: 'Lunes a viernes',
  fechaCierre: '2026-11-24', limitePostulantes: 8,
  _count: { postulaciones: 2 },
  postulaciones: [],
  empresa: { id: 'e1', nombre: 'Dollarcity' },
  ...extra,
});
const VACANTES_DEMO = [
  vac('v1'), vac('v2'), vac('v3'), vac('v4'),
  vac('v5', { postulaciones: [{ id: 'p1', egresadoId: 'egresado-demo' }] }),
  vac('v6', { postulaciones: [{ id: 'p2', egresadoId: 'egresado-demo' }] }),
];

// 3 notificaciones sin leer → badge "Avisos" = 3
const NOTIS_DEMO = [
  { id: 'n1', vista: false }, { id: 'n2', vista: false }, { id: 'n3', vista: false },
  { id: 'n4', vista: true },
];
// 2 folios con último mensaje de la empresa sin leer → badge "Mensajes" = 2
const CHATS_DEMO = [
  { id: 'c1', nombreEmpresa: 'Dollarcity', tituloVacante: 'Analista ambiental', ultimoMsgSenderType: 'EMPRESA', leido: false },
  { id: 'c2', nombreEmpresa: 'Alkosto',    tituloVacante: 'Auxiliar HSE',        ultimoMsgSenderType: 'EMPRESA', leido: false },
  { id: 'c3', nombreEmpresa: 'Corona',     tituloVacante: 'Practicante',         ultimoMsgSenderType: 'EGRESADO', leido: true },
];

// Respuestas mínimas por patrón de URL del backend
function stub(url) {
  if (url.includes('/notificaciones/egresado')) return NOTIS_DEMO;
  if (url.includes('/vacantes')) return VACANTES_DEMO;
  if (url.includes('/mis-chats')) return CHATS_DEMO;
  if (url.includes('/historial')) return [];
  if (url.includes('/resumen')) return { count: 0, messages: [] };
  if (url.includes('/postulaciones')) return [];
  return {};
}

async function seed(context) {
  await context.addInitScript(
    ([u]) => {
      localStorage.setItem('usuario', JSON.stringify(u));
      localStorage.setItem('token', 'demo-token');
    },
    [USUARIO],
  );
  await context.route('**/backend-ude-c.vercel.app/**', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(stub(route.request().url())),
    });
  });
}

async function abrir(context) {
  const page = await context.newPage();
  await page.goto(BASE + RUTA, { waitUntil: 'domcontentloaded' });
  // La barra superior nueva; si aún no existe, cae al header/sidebar viejos.
  await page
    .locator('header, nav[aria-label], .main-header-container, .sidebar')
    .first()
    .waitFor({ state: 'visible', timeout: 15000 });
  await page.waitForTimeout(900); // que asienten las animaciones de entrada
  return page;
}

/** Recorta la zona de navegación (las dos filas superiores) o toda la ventana en móvil. */
async function shotNav(page, name, { full = false } = {}) {
  const target = page.locator('.main-header-container, header[data-egresado-nav], nav[aria-label*="principal" i]').first();
  const file = path.join(OUT, `${name}.png`);
  if (!full && (await target.count())) {
    await target.screenshot({ path: file });
  } else {
    await page.screenshot({ path: file, clip: { x: 0, y: 0, width: page.viewportSize().width, height: Math.min(240, page.viewportSize().height) } });
  }
  console.log('  ✓', path.relative(process.cwd(), file));
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();

  // ---------- ESCRITORIO ----------
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
    await seed(context);
    const page = await abrir(context);

    await shotNav(page, '01-default');

    const tabs = page.locator('nav[aria-label*="principal" i] button.ex-tab');

    // hover sobre un destino no activo y sin badge ("Empresas")
    const empresas = tabs.filter({ hasText: /empresas/i }).first();
    if (await empresas.count()) {
      await empresas.hover();
      await page.waitForTimeout(400);
      await shotNav(page, '02-hover');
    }

    // foco por teclado — enfocamos directamente una pestaña con badge ("Avisos")
    const avisos = tabs.filter({ hasText: /avisos/i }).first();
    if (await avisos.count()) {
      await avisos.focus();
      await page.waitForTimeout(200);
      await shotNav(page, '03-foco-teclado');
    }

    // activar otro destino (glider se desliza)
    if (await empresas.count()) {
      await empresas.click();
      await page.waitForTimeout(700);
      await shotNav(page, '04-activo-otro');
    }

    await context.close();
  }

  // ---------- BADGE DE 2 DÍGITOS (12 avisos sin leer) ----------
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
    await context.addInitScript(([u]) => {
      localStorage.setItem('usuario', JSON.stringify(u));
      localStorage.setItem('token', 'demo-token');
    }, [USUARIO]);
    await context.route('**/backend-ude-c.vercel.app/**', (route) => {
      const url = route.request().url();
      let body = stub(url);
      if (url.includes('/notificaciones/egresado')) {
        body = Array.from({ length: 12 }, (_, i) => ({ id: `n${i}`, vista: false }));
      }
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
    });
    const page = await abrir(context);
    await page.waitForTimeout(1200);
    await shotNav(page, '05-badge-alto');
    await context.close();
  }

  // ---------- REDUCED MOTION ----------
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
    await seed(context);
    const page = await abrir(context);
    await shotNav(page, '06-reduced-motion');
    await context.close();
  }

  // ---------- TABLET ----------
  {
    const context = await browser.newContext({ viewport: { width: 900, height: 1000 }, deviceScaleFactor: 2 });
    await seed(context);
    const page = await abrir(context);
    await shotNav(page, '07-tablet');
    await context.close();
  }

  // ---------- MÓVIL ----------
  {
    const context = await browser.newContext({ ...devices['Pixel 7'] });
    await seed(context);
    const page = await abrir(context);
    await page.screenshot({ path: path.join(OUT, '08-movil.png'), fullPage: false });
    console.log('  ✓', path.relative(process.cwd(), path.join(OUT, '08-movil.png')));
    await context.close();
  }

  await browser.close();
  console.log('\nEvidencia en', path.relative(process.cwd(), OUT));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
