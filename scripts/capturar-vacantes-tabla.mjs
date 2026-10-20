/**
 * Evidencia visual — Tabla de "Vacantes Disponibles" (Egresado).
 * Reemplaza la grilla de tarjetas "Sello" por una tabla densa con filtros,
 * orden por columna y estados. Ver frontend/DESIGN.md.
 *
 * Uso:
 *   1. En una terminal:  npm run dev                    (deja Vite en http://localhost:5173)
 *   2. En otra:          npm run capturar:vacantes-tabla
 *
 * Genera PNGs en  frontend/tests/evidencia/vacantes-tabla/  con los estados:
 *   desktop-default · desktop-hover · desktop-foco-teclado · desktop-ordenado ·
 *   desktop-filtrado · desktop-sin-resultados · desktop-cargando · desktop-reduced-motion ·
 *   tablet-900 · movil-390 · movil-360 · movil-filtros-sheet
 *
 * El backend real (backend-ude-c.vercel.app) se intercepta con respuestas mínimas
 * para que las capturas sean deterministas y no dependan de la red.
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const BASE = process.env.VACANTES_URL || 'http://localhost:5173';
const RUTA = '/vacantes-dashboard';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, '../tests/evidencia/vacantes-tabla');

const USUARIO = {
  id: 'egresado-demo',
  nombres: 'Deivid Santiago',
  apellidos: 'Olivar Rodriguez',
  programa: 'Ingeniería Ambiental',
  rol: 'EGRESADO',
  foto: null,
};

const vac = (id, extra = {}) => ({
  id,
  titulo: 'Analista ambiental junior',
  estado: 'ABIERTA',
  modalidad: 'Presencial',
  ubicacion: 'Soacha',
  salario: '2500000',
  tipoSalario: 'Básico',
  tipo: 'Término Fijo',
  jornada: 'Tiempo Completo',
  horario: 'Lunes a viernes',
  fechaCreacion: '2026-08-01',
  fechaCierre: '2026-11-24',
  limitePostulantes: 8,
  descripcion: '<p>Vacante de prueba para la evidencia visual.</p>',
  _count: { postulaciones: 2 },
  postulaciones: [],
  empresa: { id: 1, nombre: 'Dollarcity' },
  empresaId: 1,
  ...extra,
});

// Cubre: normal, urgente (cierra en 2 días), cupos críticos, salario "A convenir",
// título/empresa largos, y varias ubicaciones/modalidades para poblar los filtros.
const HOY = new Date();
const enDias = (n) => new Date(HOY.getTime() + n * 86400000).toISOString().slice(0, 10);

const VACANTES_DEMO = [
  vac('v1', {
    titulo: 'Analista de Datos Junior', modalidad: 'Presencial', ubicacion: 'Soacha',
    salario: '2500000', empresa: { id: 1, nombre: 'Dollarcity' }, empresaId: 1,
    fechaCierre: enDias(30), limitePostulantes: 8, _count: { postulaciones: 2 },
  }),
  vac('v2', {
    titulo: 'Desarrollador Frontend (Junior)', modalidad: 'Híbrido', ubicacion: 'Bogotá',
    salario: '5000000', empresa: { id: 2, nombre: 'Globant' }, empresaId: 2,
    fechaCierre: enDias(2), limitePostulantes: 6, _count: { postulaciones: 1 },
  }),
  vac('v3', {
    titulo: 'Auxiliar de Ingeniería Ambiental y Sanitaria con experiencia en plantas de tratamiento',
    modalidad: 'Remoto', ubicacion: 'Medellín',
    salario: '2100000',
    empresa: { id: 3, nombre: 'Corporación Autónoma Regional de Cundinamarca (CAR)' }, empresaId: 3,
    fechaCierre: enDias(20), limitePostulantes: 3, _count: { postulaciones: 2 },
  }),
  vac('v4', {
    titulo: 'Coordinador de Proyectos', modalidad: 'Remoto', ubicacion: 'Remoto',
    salario: null, tipoSalario: 'A convenir',
    empresa: { id: 4, nombre: 'Claro Colombia' }, empresaId: 4,
    fechaCierre: null, limitePostulantes: null, _count: { postulaciones: 0 },
  }),
  vac('v5', {
    titulo: 'Practicante de Mercadeo', modalidad: 'Presencial', ubicacion: 'Chía',
    salario: '1200000', empresa: { id: 5, nombre: 'Alkosto' }, empresaId: 5,
    fechaCierre: enDias(45), limitePostulantes: 10, _count: { postulaciones: 3 },
  }),
];

function stub(url) {
  if (url.includes('/notificaciones/egresado')) return [];
  if (url.includes('/vacantes')) return VACANTES_DEMO;
  if (url.includes('/mis-chats')) return [];
  if (url.includes('/historial')) return [];
  if (url.includes('/postulaciones')) return [];
  return {};
}

async function seed(context, { lento = false } = {}) {
  await context.addInitScript(
    ([u]) => {
      localStorage.setItem('usuario', JSON.stringify(u));
      localStorage.setItem('token', 'demo-token');
    },
    [USUARIO],
  );
  await context.route('**/backend-ude-c.vercel.app/**', async (route) => {
    if (lento) await new Promise((r) => setTimeout(r, 4000));
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
  await page.locator('.tv-tabla-wrap, .tv-row-skeleton, .sello-empty').first().waitFor({ state: 'visible', timeout: 15000 });
  await page.waitForTimeout(700);
  return page;
}

async function shot(page, name) {
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log('  ✓', path.relative(process.cwd(), file));
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();

  // ---------- ESCRITORIO (>=1280px) ----------
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2 });
    await seed(context);
    const page = await abrir(context);

    await shot(page, '01-desktop-default');

    const filaAlpina = page.locator('.tv-fila', { hasText: 'Globant' }).first();
    await filaAlpina.hover();
    await page.waitForTimeout(300);
    await shot(page, '02-desktop-hover');

    await page.keyboard.press('Tab'); // logo/skip
    const buscar = page.locator('.tv-buscar input');
    await buscar.focus();
    await page.waitForTimeout(150);
    await shot(page, '03-desktop-foco-buscar');

    // Ordenar por salario
    await page.locator('.tv-th-btn', { hasText: 'Salario' }).click();
    await page.waitForTimeout(300);
    await shot(page, '04-desktop-ordenado-salario');

    // Dropdown de Modalidad (checkboxes) — abrir, marcar "Remoto", capturar abierto y filtrado
    await page.locator('.tv-modalidad-btn').click();
    await page.waitForTimeout(200);
    await shot(page, '05a-desktop-modalidad-abierta');
    await page.locator('.tv-modalidad-opcion', { hasText: 'Remoto' }).click();
    await page.waitForTimeout(250);
    await shot(page, '05-desktop-filtrado-modalidad');
    await page.keyboard.press('Escape'); // cierra el panel

    // Sin resultados: agregar búsqueda que no matchea
    await buscar.fill('xyz-no-existe');
    await page.waitForTimeout(300);
    await shot(page, '06-desktop-sin-resultados');
    await buscar.fill('');
    await page.locator('.tv-modalidad-btn').click();
    await page.locator('.tv-modalidad-opcion', { hasText: 'Remoto' }).click(); // desmarcar
    await page.keyboard.press('Escape');

    await context.close();
  }

  // ---------- CIERRE — título "Verde interactivo" aplicado como definitivo,
  // + acciones-ícono/empresa-tag ya aprobados. Confirmación mínima:
  // default + hover en desktop/tablet/móvil. ----------
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2 });
    await seed(context);
    const page = await abrir(context);
    await shot(page, '16a-cierre-desktop-default');
    const filaDesktop = page.locator('.tv-fila', { hasText: 'Claro Colombia' }).first();
    await filaDesktop.hover();
    await page.waitForTimeout(200);
    await shot(page, '16b-cierre-desktop-hover');
    await filaDesktop.locator('.tv-accion-postular').hover();
    await page.waitForTimeout(200);
    await shot(page, '16c-cierre-desktop-tooltip-postular');
    await context.close();
  }
  {
    const context = await browser.newContext({ viewport: { width: 900, height: 1100 }, deviceScaleFactor: 2 });
    await seed(context);
    const page = await abrir(context);
    await shot(page, '16d-cierre-tablet-900-default');
    const filaTablet = page.locator('.tv-fila', { hasText: 'Globant' }).first();
    await filaTablet.hover();
    await page.waitForTimeout(200);
    await shot(page, '16e-cierre-tablet-900-hover');
    await context.close();
  }
  {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await seed(context);
    const page = await abrir(context);
    await shot(page, '16f-cierre-movil-390-default');
    await context.close();
  }

  // ---------- LAPTOP COMÚN (1280 y 1366) — reproduce el reporte del usuario:
  // botón "Postular" recortado + gap lateral en monitores anchos ----------
  for (const width of [1280, 1366]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 2 });
    await seed(context);
    const page = await abrir(context);
    await shot(page, `14-laptop-${width}`);

    // Verificación programática: el botón "Postular" debe existir Y ser visible
    // (bounding box con ancho/alto > 0, no recortado por overflow).
    const postularV3 = page
      .locator('.tv-fila', { hasText: 'Corporación Autónoma Regional' })
      .locator('.tv-accion-postular');
    const box = await postularV3.boundingBox();
    const visible = await postularV3.isVisible();
    const scrollInfo = await page.locator('.tv-tabla-scroll').first().evaluate((el) => ({
      scrollWidth: el.scrollWidth, clientWidth: el.clientWidth,
    }));
    // ¿El botón cae DENTRO del viewport visible, sin necesitar scroll horizontal?
    const dentroDelViewportSinScroll = box && box.x >= 0 && (box.x + box.width) <= width;
    console.log(`  · Postular @ ${width}px → visible=${visible} box=${box ? `${Math.round(box.width)}x${Math.round(box.height)} @x=${Math.round(box.x)}` : 'null'} | .tv-tabla-scroll scrollWidth=${scrollInfo.scrollWidth} clientWidth=${scrollInfo.clientWidth} | sinScrollNecesario=${dentroDelViewportSinScroll}`);
    if (!visible || !box || box.width === 0 || !dentroDelViewportSinScroll) {
      console.error(`  ✗ FALLO: "Postular" no es visible/alcanzable sin scroll horizontal a ${width}px`);
      process.exitCode = 1;
    } else {
      await postularV3.scrollIntoViewIfNeeded();
      await postularV3.hover();
    }

    await context.close();
  }

  // ---------- MONITOR ANCHO (1920px) — cadena completa de ancestros, sin caché
  // (browser/context nuevos en cada corrida de este script) ----------
  {
    const context = await browser.newContext({ viewport: { width: 1920, height: 1000 }, deviceScaleFactor: 1 });
    await seed(context);
    const page = await abrir(context);
    await shot(page, '15-monitor-ancho-1920');

    const cadena = await page.locator('.tv-tabla-wrap').first().evaluate((el) => {
      const filas = [];
      let node = el;
      while (node && node.nodeName !== 'HTML') {
        const cs = getComputedStyle(node);
        const rect = node.getBoundingClientRect();
        filas.push({
          tag: node.tagName.toLowerCase(),
          clase: node.className && typeof node.className === 'string' ? node.className : '(sin clase)',
          display: cs.display,
          position: cs.position,
          width: cs.width,
          maxWidth: cs.maxWidth,
          margin: `${cs.marginTop} ${cs.marginRight} ${cs.marginBottom} ${cs.marginLeft}`,
          padding: `${cs.paddingTop} ${cs.paddingRight} ${cs.paddingBottom} ${cs.paddingLeft}`,
          renderedWidth: Math.round(rect.width),
          x: Math.round(rect.x),
        });
        node = node.parentElement;
      }
      return filas;
    });
    console.log('  · Cadena de ancestros @ 1920px (.tv-tabla-wrap → body):');
    for (const f of cadena) {
      console.log(`    <${f.tag} class="${f.clase}"> display=${f.display} position=${f.position} width=${f.width} max-width=${f.maxWidth} margin=${f.margin} padding=${f.padding} → renderizado: x=${f.x}px width=${f.renderedWidth}px`);
    }

    const wrapperBox = await page.locator('.tv-tabla-wrap').first().boundingBox();
    const gapIzquierdo = wrapperBox.x;
    const gapDerecho = 1920 - (wrapperBox.x + wrapperBox.width);
    console.log(`  · Gap lateral @ 1920px (medido sobre .tv-tabla-wrap) → izquierdo=${Math.round(gapIzquierdo)}px derecho=${Math.round(gapDerecho)}px`);
    await context.close();
  }

  // ---------- CARGANDO (skeleton) ----------
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2 });
    await seed(context, { lento: true });
    const page = await context.newPage();
    await page.goto(BASE + RUTA, { waitUntil: 'domcontentloaded' });
    await page.locator('.tv-row-skeleton').first().waitFor({ state: 'visible', timeout: 10000 });
    await page.waitForTimeout(300);
    await shot(page, '07-desktop-cargando');
    await context.close();
  }

  // ---------- REDUCED MOTION ----------
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
    await seed(context);
    const page = await abrir(context);
    await shot(page, '08-desktop-reduced-motion');
    await context.close();
  }

  // ---------- TABLET (768-900px) ----------
  {
    const context = await browser.newContext({ viewport: { width: 900, height: 1100 }, deviceScaleFactor: 2 });
    await seed(context);
    const page = await abrir(context);
    await shot(page, '09-tablet-900');

    // ¿Cuánto scroll horizontal necesita realmente la tabla a 900px, y al
    // hacer ese scroll, "Postular" queda visible y sin recortes?
    const scrollInfo = await page.locator('.tv-tabla-scroll').first().evaluate((el) => ({
      scrollWidth: el.scrollWidth, clientWidth: el.clientWidth, necesitaScroll: el.scrollWidth > el.clientWidth,
    }));
    console.log(`  · .tv-tabla-scroll @ 900px → scrollWidth=${scrollInfo.scrollWidth} clientWidth=${scrollInfo.clientWidth} necesitaScroll=${scrollInfo.necesitaScroll}`);
    if (scrollInfo.necesitaScroll) {
      await page.locator('.tv-tabla-scroll').first().evaluate((el) => { el.scrollLeft = el.scrollWidth; });
      await page.waitForTimeout(200);
      await shot(page, '09b-tablet-900-scrolleada-al-final');
      const postularTablet = page.locator('.tv-fila', { hasText: 'Globant' }).first().locator('.tv-accion-postular');
      console.log(`  · Postular tras scroll @ 900px → visible=${await postularTablet.isVisible()}`);
    }
    await context.close();
  }
  {
    const context = await browser.newContext({ viewport: { width: 768, height: 1100 }, deviceScaleFactor: 2 });
    await seed(context);
    const page = await abrir(context);
    await shot(page, '10-tablet-768');
    await context.close();
  }

  // ---------- MÓVIL 390px (iPhone) ----------
  {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await seed(context);
    const page = await abrir(context);
    await shot(page, '11-movil-390');

    await page.locator('.tv-filtrar-movil').click();
    await page.waitForTimeout(400);
    await shot(page, '12-movil-390-filtros-sheet');
    await context.close();
  }

  // ---------- MÓVIL 360px (Android) ----------
  {
    const context = await browser.newContext({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await seed(context);
    const page = await abrir(context);
    await shot(page, '13-movil-360');
    await context.close();
  }

  await browser.close();
  console.log('\nEvidencia en', path.relative(process.cwd(), OUT));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
