/**
 * Pruebas y evidencia del aviso de error del login de la landing, concepto A "Renglón"
 * (DESIGN.md §8).
 *
 * Uso:
 *   1. En una terminal:  npm run dev          (deja Vite en http://localhost:5173)
 *   2. En otra:          npm run probar:login-error
 *
 * Nunca llama al backend real: /api/auth/login se responde con page.route.
 *
 * Cubre: mensajes (credenciales uniformes, cuenta inactiva, 5xx, respuesta sin JSON,
 * sin respuesta con y sin conexión, validación local), anuncio en la región viva,
 * aria-invalid/aria-describedby, limpieza al escribir, contraseña vacía con foco tras
 * el rechazo, el aviso de sesión vencida se oculta al primer intento, movimiento
 * (servidor con despliegue, local sin animación, reduced-motion sólo opacidad),
 * colisión de clases y geometría en los 7 tamaños más 1920×830: el enlace
 * "¿Olvidaste tu contraseña?" en una línea, sin scroll en escritorio y "SOY EMPRESA"
 * entero a la vista. Capturas en tests/evidencia/login-error/final/.
 */
import { chromium } from 'playwright';
import { mkdir, readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const BASE = process.env.LOGIN_URL || 'http://localhost:5173';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(__dirname, '../src');
const OUT = path.resolve(__dirname, '../tests/evidencia/login-error/final');
const TAMANOS = [[390, 844], [360, 780], [360, 640], [768, 1024], [820, 1180], [1280, 800], [1280, 650], [1920, 830]];

const CREDENCIALES = 'Correo o contraseña incorrectos.';
const INACTIVA = 'Tu cuenta de empresa ha sido desactivada por el administrador. Contacta con la Universidad.';
const SERVIDOR = 'No pudimos iniciar sesión. Intenta de nuevo.';
const SIN_CONEXION = 'Sin conexión a internet. Revisa tu red y vuelve a intentarlo.';
const SIN_RESPUESTA = 'No se pudo conectar con el servidor. Espera un momento y vuelve a intentarlo.';

let fallos = 0;
const check = (ok, etiqueta, detalle = '') => {
  if (!ok) fallos++;
  console.log(`  ${ok ? '✓' : '✗'} ${etiqueta}${detalle ? ` — ${detalle}` : ''}`);
};

const json = (status, cuerpo) => ({ status, contentType: 'application/json', body: JSON.stringify(cuerpo) });

async function nuevaPagina(browser, { respuesta = () => json(200, { success: false, message: 'Credenciales no encontradas' }), viewport, extra = {}, url = '/' } = {}) {
  const context = await browser.newContext({ viewport: viewport || { width: 1280, height: 800 }, ...extra });
  await context.route(/\/api\/auth\/login$/, (r) => {
    const res = respuesta(r.request());
    return res === 'red' ? r.abort('internetdisconnected') : r.fulfill(res);
  });
  const page = await context.newPage();
  await page.goto(BASE + url);
  await page.locator('.login-form-udec').waitFor({ timeout: 15000 });
  return { context, page };
}

const aviso = (page) => page.locator('.landing-error');
// Sin el aviso en la página, innerText esperaría sin límite: se lee sólo si existe.
const textoAviso = async (page) => ((await aviso(page).count()) ? (await aviso(page).first().innerText()).trim() : '');
const enviar = async (page, correo = 'laura.gomez@ucundinamarca.edu.co', clave = 'clave-de-prueba') => {
  await page.fill('input[type="email"]', correo);
  await page.fill('input.password-field', clave);
  await page.click('.btn-login-submit');
};
// ESPERA_AVISO_MS acorta la espera al correr el control contra origin/main, donde el aviso nunca aparece.
const ESPERA_AVISO = Number(process.env.ESPERA_AVISO_MS) || 10000;
const esperarAviso = (page) => aviso(page).waitFor({ timeout: ESPERA_AVISO }).then(() => true, () => false);

const estadoA11y = (page) => page.evaluate(() => {
  const vivo = document.querySelector('.landing-error-vivo');
  const p = document.querySelector('.landing-error');
  const campo = (s) => {
    const el = document.querySelector(s);
    return { invalido: el.getAttribute('aria-invalid'), describe: el.getAttribute('aria-describedby'), valor: el.value };
  };
  return {
    vivo: vivo?.getAttribute('aria-live'),
    atomico: vivo?.getAttribute('aria-atomic'),
    dentro: !!(vivo && p && vivo.contains(p)),
    idAviso: p?.id || null,
    correo: campo('input[type="email"]'),
    password: campo('input.password-field'),
    foco: document.activeElement?.classList.contains('password-field') ? 'password' : document.activeElement?.type === 'email' ? 'correo' : document.activeElement?.tagName,
    animacion: p ? getComputedStyle(p).animationName : null,
    transicion: vivo ? getComputedStyle(vivo).transitionProperty + ' ' + getComputedStyle(vivo).transitionDuration : null,
  };
});

const browser = await chromium.launch();
await mkdir(OUT, { recursive: true });

// ---------------------------------------------------------------- mensajes del servidor
console.log('\nMensajes del servidor');
for (const [caso, respuesta, esperado] of [
  ['correo no registrado (200)', () => json(200, { success: false, message: 'Credenciales no encontradas' }), CREDENCIALES],
  ['contraseña incorrecta (200)', () => json(200, { success: false, message: 'Contraseña incorrecta' }), CREDENCIALES],
  ['cuenta de Google (200)', () => json(200, { success: false, message: 'Inicia sesión con Google.' }), CREDENCIALES],
  ['credenciales (401)', () => json(401, { message: 'Credenciales no encontradas' }), CREDENCIALES],
  ['cuenta inactiva', () => json(200, { success: false, message: INACTIVA }), INACTIVA],
  ['500 con JSON', () => json(500, { error: 'detalle interno' }), SERVIDOR],
  ['502 sin JSON', () => ({ status: 502, contentType: 'text/html', body: '<html>Bad gateway</html>' }), SERVIDOR],
  ['sin respuesta, con conexión', () => 'red', SIN_RESPUESTA],
]) {
  const { context, page } = await nuevaPagina(browser, { respuesta });
  await enviar(page);
  await esperarAviso(page);
  check((await textoAviso(page)) === esperado, `${caso}: "${esperado}"`, await textoAviso(page) || 'sin aviso');
  await context.close();
}
{
  const { context, page } = await nuevaPagina(browser, { respuesta: () => 'red' });
  await page.fill('input[type="email"]', 'laura.gomez@ucundinamarca.edu.co');
  await page.fill('input.password-field', 'clave-de-prueba');
  await context.setOffline(true);
  await page.click('.btn-login-submit');
  await esperarAviso(page);
  check((await textoAviso(page)) === SIN_CONEXION, `sin respuesta, sin conexión: "${SIN_CONEXION}"`, await textoAviso(page) || 'sin aviso');
  await context.close();
}

// ---------------------------------------------------------------- accesibilidad
console.log('\nAnuncio, aria-invalid, limpieza y foco');
{
  const { context, page } = await nuevaPagina(browser);
  await enviar(page);
  await esperarAviso(page);
  const a = await estadoA11y(page);
  check(a.vivo === 'assertive' && a.atomico === 'true' && a.dentro, 'el aviso está dentro de una región viva assertive y atómica');
  check(a.idAviso && a.correo.invalido === 'true' && a.password.invalido === 'true'
    && a.correo.describe === a.idAviso && a.password.describe === a.idAviso, 'rechazo: los dos campos con aria-invalid y aria-describedby al aviso');
  check(a.password.valor === '' && a.foco === 'password', 'rechazo: contraseña vacía y con el foco', `valor "${a.password.valor}", foco ${a.foco}`);
  check(a.correo.valor === 'laura.gomez@ucundinamarca.edu.co', 'rechazo: el correo se conserva');
  await page.keyboard.type('n');
  const b = await estadoA11y(page);
  check((await aviso(page).count()) === 0 && b.correo.invalido === null && b.password.invalido === null && b.correo.describe === null,
    'escribir de nuevo limpia el aviso y aria-invalid');
  // El mismo error otra vez vuelve a montarse (un lector lo anuncia de nuevo).
  await page.click('.btn-login-submit');
  await esperarAviso(page);
  check((await textoAviso(page)) === CREDENCIALES, 'un segundo rechazo vuelve a mostrar el aviso');
  await context.close();
}
{
  const { context, page } = await nuevaPagina(browser, { respuesta: () => json(500, {}) });
  await enviar(page);
  await esperarAviso(page);
  const a = await estadoA11y(page);
  check(a.correo.invalido === null && a.password.invalido === null && a.password.valor === 'clave-de-prueba',
    'fallo del servidor: no marca los campos ni vacía la contraseña');
  await context.close();
}

// ---------------------------------------------------------------- validación local
console.log('\nValidación local (noValidate)');
{
  const pedidos = [];
  const { context, page } = await nuevaPagina(browser, { respuesta: (req) => { pedidos.push(req.url()); return json(200, { success: false }); } });
  check((await page.locator('form.login-form-udec').getAttribute('novalidate')) !== null, 'el formulario lleva noValidate');
  for (const [caso, correo, clave, esperado, campos, foco] of [
    ['los dos vacíos', '', '', 'Escribe tu correo y tu contraseña.', ['true', 'true'], 'correo'],
    ['correo sin @', 'laura.gomez', 'clave', 'Falta la @. Ejemplo: nombre@correo.com', ['true', null], 'correo'],
    ['dominio sin terminación', 'laura@ucundinamarca', 'clave', 'Al dominio le falta la terminación, como .com o .edu.co.', ['true', null], 'correo'],
    ['contraseña vacía', 'laura@ucundinamarca.edu.co', '', 'Escribe tu contraseña.', [null, 'true'], 'password'],
  ]) {
    await page.fill('input[type="email"]', correo);
    await page.fill('input.password-field', clave);
    await page.click('.btn-login-submit');
    await esperarAviso(page);
    const a = await estadoA11y(page);
    check((await textoAviso(page)) === esperado && a.correo.invalido === campos[0] && a.password.invalido === campos[1] && a.foco === foco,
      `${caso}: "${esperado}", campos marcados y foco en ${foco}`, `${await textoAviso(page)} | ${a.correo.invalido}/${a.password.invalido} | foco ${a.foco}`);
    check(a.animacion === 'none', `${caso}: aparece sin animación`, a.animacion);
  }
  // Enter también valida (acción de teclado: sin animación).
  await page.fill('input[type="email"]', '');
  await page.press('input.password-field', 'Enter');
  await esperarAviso(page);
  check((await estadoA11y(page)).animacion === 'none', 'validación con Enter: sin animación');
  check(pedidos.length === 0, 'la validación local no llama al servidor', `${pedidos.length} pedido(s)`);
  await context.close();
}

// ---------------------------------------------------------------- aviso de sesión vencida
console.log('\nAviso de sesión vencida');
{
  const { context, page } = await nuevaPagina(browser, { url: '/?motivo=expirada' });
  check((await page.locator('.landing-aviso-sesion').count()) === 1, 'se muestra al llegar con ?motivo=expirada');
  await enviar(page);
  await esperarAviso(page);
  check((await page.locator('.landing-aviso-sesion').count()) === 0 && (await aviso(page).count()) === 1,
    'al primer intento se oculta y queda sólo el aviso de error');
  await context.close();
}

// ---------------------------------------------------------------- movimiento
console.log('\nMovimiento');
for (const [movimiento, animacion, conTransicion] of [['no-preference', 'landing-error-aparece', true], ['reduce', 'landing-error-solo-opacidad', false]]) {
  const { context, page } = await nuevaPagina(browser, { extra: { reducedMotion: movimiento } });
  await enviar(page);
  await esperarAviso(page);
  const a = await estadoA11y(page);
  check(a.animacion === animacion, `${movimiento}: el error del servidor usa ${animacion}`, a.animacion);
  check(conTransicion ? /grid-template-rows 0\.2s/.test(a.transicion) : !/grid-template-rows/.test(a.transicion),
    `${movimiento}: ${conTransicion ? 'la fila se despliega en 200 ms' : 'sin despliegue de altura'}`, a.transicion);
  await context.close();
}
{
  const css = await readFile(path.join(SRC, 'pages/Landing.css'), 'utf8');
  const bloque = (nombre) => css.match(new RegExp(`@keyframes ${nombre}\\s*{([\\s\\S]*?)\\n}`))?.[1] || '';
  check(!/transform/.test(bloque('landing-error-solo-opacidad')) && /opacity/.test(bloque('landing-error-solo-opacidad')),
    'la variante reducida sólo anima la opacidad');
}

// ---------------------------------------------------------------- colisión de clases
console.log('\nColisión de clases');
{
  const archivos = [];
  const recorrer = async (dir) => {
    for (const e of await readdir(dir, { withFileTypes: true })) {
      const ruta = path.join(dir, e.name);
      if (e.isDirectory()) await recorrer(ruta);
      else if (/\.(css|jsx?)$/.test(e.name)) archivos.push(ruta);
    }
  };
  await recorrer(SRC);
  const nuevas = ['landing-error', 'landing-error-vivo', 'landing-error-marco', 'landing-error-aparece', 'landing-error-solo-opacidad', '--landing-error', '--landing-ease'];
  for (const clase of nuevas) {
    const usos = [];
    for (const f of archivos) {
      const txt = await readFile(f, 'utf8');
      if (new RegExp(`(^|[^\\w-])${clase.replace(/-/g, '\\-')}(?![\\w-])`).test(txt)) usos.push(path.relative(SRC, f).replace(/\\/g, '/'));
    }
    check(usos.every((u) => u === 'pages/Landing.jsx' || u === 'pages/Landing.css'), `"${clase}" sólo existe en Landing.jsx/.css`, usos.join(', '));
  }
  // .error-message-sutil es global y EmpresaDashboard.jsx la usa: la regla debe seguir en Landing.css.
  const landingCss = await readFile(path.join(SRC, 'pages/Landing.css'), 'utf8');
  const landingJsx = await readFile(path.join(SRC, 'pages/Landing.jsx'), 'utf8');
  check(/\.error-message-sutil\s*{/.test(landingCss) && !/error-message-sutil/.test(landingJsx),
    '.error-message-sutil se conserva para EmpresaDashboard y Landing ya no la usa');
}

// ---------------------------------------------------------------- geometría
console.log('\nGeometría (7 tamaños + 1920×830)');
const medir = (page) => page.evaluate(() => {
  const enlace = document.querySelector('.forgot-password-link');
  const rango = document.createRange();
  rango.selectNodeContents(enlace);
  const lineas = new Set([...rango.getClientRects()].map((r) => Math.round(r.top))).size;
  const empresa = [...document.querySelectorAll('button, a')].find((b) => /SOY EMPRESA/i.test(b.textContent));
  const re = empresa?.getBoundingClientRect();
  const panel = document.querySelector('.actions-section-white');
  const err = document.querySelector('.landing-error')?.getBoundingClientRect();
  const form = document.querySelector('.login-form-udec').getBoundingClientRect();
  return {
    lineas,
    empresa: re ? { top: Math.round(re.top), bottom: Math.round(re.bottom) } : null,
    scrollPagina: document.documentElement.scrollHeight - innerHeight,
    scrollPanel: panel ? panel.scrollHeight - panel.clientHeight : 0,
    desborde: document.documentElement.scrollWidth - innerWidth,
    errorDentro: !err || (err.left >= form.left - 0.5 && err.right <= form.right + 0.5),
    alto: innerHeight,
  };
});
for (const [w, h] of TAMANOS) {
  for (const [variante, opciones] of [
    ['error', {}],
    ['expirada', { url: '/?motivo=expirada' }],
    ['largo', { respuesta: () => json(200, { success: false, message: INACTIVA }) }],
  ]) {
    const { context, page } = await nuevaPagina(browser, { viewport: { width: w, height: h }, extra: { reducedMotion: 'reduce' }, ...opciones });
    await page.waitForTimeout(450); // entrada del hero
    const antes = await medir(page);
    await enviar(page);
    await esperarAviso(page);
    await page.evaluate(() => document.activeElement?.blur());
    await page.waitForTimeout(300);
    if (w < 900) await page.evaluate(() => document.querySelector('.login-col').scrollIntoView({ block: 'center' }));
    const m = await medir(page);
    const nombre = `${w}×${h} ${variante}`;
    // Entre 769 y 899 px la columna es tan angosta que el enlace ya se parte en reposo
    // (pendiente en DESIGN.md §9): ahí se exige que el error no lo cambie.
    if (w > 768 && w < 900) {
      check(m.lineas === antes.lineas, `${nombre}: el error no cambia "¿Olvidaste tu contraseña?" (ya en ${antes.lineas} líneas en reposo)`, `${antes.lineas} → ${m.lineas}`);
    } else {
      check(antes.lineas === 1 && m.lineas === 1, `${nombre}: "¿Olvidaste tu contraseña?" en una línea`, `${antes.lineas} → ${m.lineas}`);
    }
    check(m.desborde <= 0 && m.errorDentro, `${nombre}: sin desborde y el aviso dentro del formulario`);
    if (w >= 900) {
      check(m.scrollPagina <= 0 && m.scrollPanel <= 0, `${nombre}: sin scroll (página ni panel)`, `página ${m.scrollPagina}, panel ${m.scrollPanel}`);
      check(m.empresa && m.empresa.top >= 0 && m.empresa.bottom <= m.alto, `${nombre}: "SOY EMPRESA" entero a la vista`,
        m.empresa ? `${m.empresa.top}–${m.empresa.bottom} de ${m.alto}` : 'no aparece');
    }
    await page.screenshot({ path: path.join(OUT, `${w}x${h}-${variante}.png`) });
    await context.close();
  }
}

await browser.close();
console.log(fallos ? `\n${fallos} chequeo(s) fallaron` : '\nTodos los chequeos pasan');
process.exit(fallos ? 1 : 0);
