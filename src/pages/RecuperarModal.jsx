import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, MailCheck, RotateCw, ArrowLeft } from 'lucide-react';
import { normalizarCorreo, sugerirCorreo, validarCorreo } from './recuperarCorreo';
import './RecuperarModal.css';

// Modal "Recuperar contraseña" — dirección "Ventanilla": banda de identidad
// verde con filete dorado y una sola tarea por pantalla (formulario → revisa tu
// correo). Se abre desde "¿Olvidaste tu contraseña?" del Login (Landing).
// La pantalla de éxito es la misma exista o no la cuenta (DESIGN.md §8).

const ENDPOINT = 'https://backend-ude-c.vercel.app/api/auth/request-password-reset';
const ENFRIAMIENTO_S = 60;
const TIEMPO_LIMITE_MS = 15000;
// Duraciones de salida: deben coincidir con `.recuperar-saliendo` en el CSS.
const SALIDA_MS = 160;
const SALIDA_REDUCIDA_MS = 150;
// Reacomodo de la tarjeta al cambiar de fase (FLIP): misma curva que la entrada.
const FLIP_MS = 220;
const EASE = 'cubic-bezier(0.23, 1, 0.32, 1)';

// Hoy el servidor responde 200 con `success:true` si la cuenta existe y 200
// con `success:false` si no: cualquier 2xx se trata igual. Un 500 sólo puede
// darse con cuentas existentes (sólo ellas llegan al envío del correo), así
// que su mensaje tampoco menciona el correo.
const FALLOS = {
  red: 'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.',
  tiempo: 'El servidor tardó demasiado en responder. Inténtalo de nuevo.',
  limite: 'Hiciste varias solicitudes seguidas. Espera unos minutos e inténtalo de nuevo.',
  servidor: 'No pudimos procesar la solicitud en este momento. Inténtalo de nuevo en unos minutos.',
};

// El enfriamiento sobrevive a cerrar y reabrir el modal (si no, cerrar y abrir
// lo saltaría). sessionStorage puede fallar en modo privado: se envuelve.
const CLAVE = 'recuperar-enfriamiento';
const leerEnfriamiento = () => {
  try { return JSON.parse(sessionStorage.getItem(CLAVE)) || { hasta: 0, correo: '' }; } catch { return { hasta: 0, correo: '' }; }
};
const guardarEnfriamiento = (dato) => {
  try { sessionStorage.setItem(CLAVE, JSON.stringify(dato)); } catch { /* sin almacenamiento */ }
};
const segundosRestantes = () => Math.max(0, Math.ceil((leerEnfriamiento().hasta - Date.now()) / 1000));
// Ref estable: una función en línea se re-ejecutaría en cada tic del contador
// y le robaría el foco al botón de reenviar.
const enfocarAlMontar = (el) => el?.focus({ preventScroll: true });
const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

function RecuperarModal({ logoUrl, correoInicial = '', triggerRef, onClose }) {
  const navigate = useNavigate();
  const tarjetaRef = useRef(null);
  const overlayRef = useRef(null);
  const inputRef = useRef(null);
  const cerrandoRef = useRef(false);
  const enVueloRef = useRef(false);
  const abortRef = useRef(null);
  // Última interacción dentro de la tarjeta: con teclado no se anima el reacomodo.
  const interaccionRef = useRef('puntero');
  const flipRef = useRef(null);
  const flipAnimRef = useRef(null);
  const base = useId();
  const ids = { titulo: `${base}-titulo`, desc: `${base}-desc`, input: `${base}-correo`, error: `${base}-error`, sug: `${base}-sug` };

  const [correo, setCorreo] = useState(() => (validarCorreo(correoInicial) ? '' : normalizarCorreo(correoInicial)));
  const [error, setError] = useState('');
  const [tocado, setTocado] = useState(false);
  const [fase, setFase] = useState('formulario'); // 'formulario' | 'exito'
  const [enviando, setEnviando] = useState(false);
  const [fallo, setFallo] = useState('');
  const [restante, setRestante] = useState(segundosRestantes);
  const [cerrando, setCerrando] = useState(false);
  // Éxito sin pedido de red (mismo correo dentro del enfriamiento): sin fundido.
  const [instantaneo, setInstantaneo] = useState(false);

  // FLIP: la tarjeta está centrada y su alto cambia entre fases (440 → 526px en
  // 1280, 445 → 608px en 360); sin esto la banda saltaba 43–81px al recentrarse.
  // Se mide el `top` visual antes del cambio y, ya con el layout nuevo, se anima
  // sólo `transform` desde la diferencia hasta cero.
  const cambiarFase = (nueva, { animar }) => {
    const el = tarjetaRef.current;
    flipRef.current = el ? { top: el.getBoundingClientRect().top, animar, enfocarCampo: nueva === 'formulario' } : null;
    setFase(nueva);
  };
  useLayoutEffect(() => {
    const previo = flipRef.current;
    flipRef.current = null;
    const el = tarjetaRef.current;
    if (!previo || !el) return;
    // "Cambiar correo": el campo recibe el foco con el texto seleccionado, en el
    // mismo commit (un setTimeout dejaba una ventana sin foco).
    if (previo.enfocarCampo) { inputRef.current?.focus({ preventScroll: true }); inputRef.current?.select(); }
    flipAnimRef.current?.cancel();
    // Teclado o movimiento reducido: la tarjeta se recoloca sin desplazarse.
    if (!previo.animar || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const dy = previo.top - el.getBoundingClientRect().top;
    if (Math.abs(dy) < 1) return;
    flipAnimRef.current = el.animate(
      [{ transform: `translateY(${dy}px)` }, { transform: 'none' }],
      { duration: FLIP_MS, easing: EASE },
    );
  }, [fase]);

  // Cierre con salida animada; `despues` corre cuando el modal ya se desmontó
  // (scroll del fondo y foco restaurados), p. ej. para ir a un registro.
  const cerrar = useCallback((despues) => {
    if (cerrandoRef.current) return;
    cerrandoRef.current = true;
    const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setCerrando(true);
    window.setTimeout(() => {
      onClose();
      if (typeof despues === 'function') window.setTimeout(despues, 0);
    }, reducido ? SALIDA_REDUCIDA_MS : SALIDA_MS);
  }, [onClose]);

  // Foco al campo, bloqueo de scroll del fondo y devolución de foco al enlace.
  // El bloqueo va en línea con prioridad `important` sobre <html> y <body>,
  // igual que en AcercaDeModal: EmpresaDashboard.css declara
  // `html, body { overflow-y: auto !important }` sin ámbito.
  useEffect(() => {
    const disparador = triggerRef?.current;
    const raices = [document.documentElement, document.body];
    const previos = raices.map((el) => [el.style.getPropertyValue('overflow'), el.style.getPropertyPriority('overflow')]);
    raices.forEach((el) => el.style.setProperty('overflow', 'hidden', 'important'));
    inputRef.current?.focus({ preventScroll: true });
    return () => {
      abortRef.current?.abort();
      raices.forEach((el, i) => {
        const [valor, prioridad] = previos[i];
        if (valor) el.style.setProperty('overflow', valor, prioridad);
        else el.style.removeProperty('overflow');
      });
      if (disparador?.isConnected) disparador.focus();
    };
  }, [triggerRef]);

  // Teclado virtual: el fondo ocupa sólo el viewport visual y, si el foco está
  // en el formulario, el campo y el botón se mantienen a la vista.
  useEffect(() => {
    const vv = window.visualViewport;
    const el = overlayRef.current;
    if (!vv || !el) return undefined;
    const aplicar = () => {
      el.style.setProperty('--recuperar-vv-alto', `${vv.height}px`);
      el.style.setProperty('--recuperar-vv-top', `${vv.offsetTop}px`);
      const acciones = el.querySelector('.recuperar-acciones');
      if (acciones && acciones.contains(document.activeElement)) acciones.scrollIntoView({ block: 'nearest' });
    };
    aplicar();
    vv.addEventListener('resize', aplicar);
    vv.addEventListener('scroll', aplicar);
    return () => { vv.removeEventListener('resize', aplicar); vv.removeEventListener('scroll', aplicar); };
  }, []);

  // Esc cierra; Tab queda atrapado dentro de la tarjeta.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); cerrar(); return; }
      if (e.key !== 'Tab' || !tarjetaRef.current) return;
      const focoables = [...tarjetaRef.current.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )].filter((n) => n.offsetParent !== null);
      if (!focoables.length) return;
      const primero = focoables[0];
      const ultimo = focoables[focoables.length - 1];
      const activo = document.activeElement;
      const fuera = !tarjetaRef.current.contains(activo) || activo === tarjetaRef.current;
      if (e.shiftKey && (activo === primero || fuera)) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && (activo === ultimo || fuera)) { e.preventDefault(); primero.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [cerrar]);

  // Cuenta regresiva del reenvío.
  const contando = restante > 0;
  useEffect(() => {
    if (!contando) return undefined;
    const id = window.setInterval(() => setRestante(segundosRestantes()), 250);
    return () => window.clearInterval(id);
  }, [contando]);

  // Valida al salir del campo y al enviar, nunca mientras se escribe por
  // primera vez. Con un error a la vista, re-valida en cada tecla para
  // quitarlo apenas el correo quede bien.
  const onChange = (e) => {
    setCorreo(e.target.value);
    if (fallo) setFallo('');
    if (error) setError(validarCorreo(e.target.value));
  };
  const onBlur = () => {
    if (!correo.trim()) return; // vaciar y salir todavía no es un error
    setTocado(true);
    setError(validarCorreo(correo));
  };

  const enviar = async () => {
    if (enVueloRef.current) return false;
    const msg = validarCorreo(correo);
    setTocado(true);
    setError(msg);
    if (msg) return false;
    const limpio = normalizarCorreo(correo);
    setCorreo(limpio);
    setFallo('');

    // Mismo correo dentro del enfriamiento: ya se pidió, no se repite el pedido.
    const previo = leerEnfriamiento();
    if (previo.correo === limpio && previo.hasta > Date.now()) {
      setRestante(segundosRestantes());
      setInstantaneo(true);
      cambiarFase('exito', { animar: interaccionRef.current === 'puntero' });
      return true;
    }

    enVueloRef.current = true;
    setEnviando(true);
    const ctl = new AbortController();
    abortRef.current = ctl;
    const limite = window.setTimeout(() => ctl.abort('tiempo'), TIEMPO_LIMITE_MS);
    try {
      const r = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo: limpio }),
        signal: ctl.signal,
      });
      if (r.status === 429) { setFallo(FALLOS.limite); return false; }
      if (!r.ok) { setFallo(FALLOS.servidor); return false; }
      guardarEnfriamiento({ hasta: Date.now() + ENFRIAMIENTO_S * 1000, correo: limpio });
      setRestante(ENFRIAMIENTO_S);
      setInstantaneo(false);
      // Respuesta del servidor: se anima aunque el envío haya sido con Enter.
      cambiarFase('exito', { animar: true });
      return true;
    } catch {
      if (cerrandoRef.current) return false;
      setFallo(ctl.signal.reason === 'tiempo' ? FALLOS.tiempo : FALLOS.red);
      return false;
    } finally {
      window.clearTimeout(limite);
      enVueloRef.current = false;
      setEnviando(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const ok = await enviar();
    if (!ok && !cerrandoRef.current) inputRef.current?.focus();
  };

  const irARegistro = (ruta) => (e) => {
    e.preventDefault();
    cerrar(() => navigate(ruta));
  };

  // `detail === 0`: el clic vino de Enter o Espacio sobre el botón.
  const cambiarCorreo = (e) => {
    setFallo('');
    cambiarFase('formulario', { animar: e.detail > 0 });
  };

  const sugerencia = tocado && !error ? sugerirCorreo(correo) : '';
  const describe = [error && ids.error, sugerencia && ids.sug].filter(Boolean).join(' ') || undefined;

  const bloqueFallo = (
    <div className="recuperar-fallo-slot" aria-live="assertive">
      {fallo && (
        <div className="recuperar-fallo" role="alert">
          <p>{fallo}</p>
          <button type="button" className="recuperar-fallo-btn" onClick={enviar} disabled={enviando}>
            <RotateCw size={15} strokeWidth={2} aria-hidden="true" /> Reintentar
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div
      ref={overlayRef}
      className={`recuperar-overlay${cerrando ? ' recuperar-saliendo' : ''}`}
      lang="es"
      onMouseDown={(e) => { if (e.target === e.currentTarget) cerrar(); }}
    >
      <div
        ref={tarjetaRef}
        className="recuperar-tarjeta"
        role="dialog"
        aria-modal="true"
        aria-labelledby={ids.titulo}
        aria-describedby={ids.desc}
        tabIndex={-1}
        onPointerDownCapture={() => { interaccionRef.current = 'puntero'; }}
        onKeyDownCapture={() => { interaccionRef.current = 'teclado'; }}
      >
        <header className="recuperar-banda">
          <img src={logoUrl} alt="Empres360 PRO" className="recuperar-logo" />
          <button type="button" className="recuperar-cerrar" onClick={() => cerrar()} aria-label="Cerrar">
            <X size={20} strokeWidth={2} aria-hidden="true" />
          </button>
        </header>

        {fase === 'formulario' ? (
          <div className="recuperar-cuerpo">
            <h2 id={ids.titulo} className="recuperar-titulo">Recupera tu contraseña</h2>
            <p id={ids.desc} className="recuperar-lead">
              Escribe el correo con el que te registraste y te enviaremos un enlace para crear una nueva.
            </p>
            <form onSubmit={onSubmit} noValidate>
              <div className="recuperar-acciones">
                <label htmlFor={ids.input} className="recuperar-label">Correo electrónico</label>
                <input
                  ref={inputRef}
                  id={ids.input}
                  className="recuperar-input"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  maxLength={254}
                  placeholder="nombre@correo.com"
                  value={correo}
                  onChange={onChange}
                  onBlur={onBlur}
                  aria-invalid={error ? 'true' : 'false'}
                  aria-describedby={describe}
                  disabled={enviando}
                />
                <p id={ids.error} className="recuperar-error" aria-live="polite">{error}</p>
                {sugerencia && (
                  <p id={ids.sug} className="recuperar-sugerencia">
                    ¿Quisiste decir{' '}
                    <button type="button" className="recuperar-sugerencia-btn" onClick={() => { setCorreo(sugerencia); setError(''); }}>
                      {sugerencia}
                    </button>?
                  </p>
                )}
                {bloqueFallo}
                <button type="submit" className="recuperar-enviar" disabled={enviando}>
                  <span className="recuperar-enviar-texto" data-oculto={enviando || undefined}>Enviar enlace</span>
                  {enviando && (
                    <span className="recuperar-enviar-carga">
                      <span className="recuperar-spinner" aria-hidden="true" /> Enviando…
                    </span>
                  )}
                </button>
              </div>
            </form>
            <button type="button" className="recuperar-textual recuperar-volver" onClick={() => cerrar()}>
              <ArrowLeft size={16} strokeWidth={2} aria-hidden="true" /> Volver a iniciar sesión
            </button>
          </div>
        ) : (
          <div className="recuperar-cuerpo" data-fase="exito" data-instantaneo={instantaneo || undefined}>
            <div className="recuperar-sello" aria-hidden="true"><MailCheck size={26} strokeWidth={1.75} /></div>
            <h2 id={ids.titulo} className="recuperar-titulo" tabIndex={-1} ref={enfocarAlMontar}>
              Revisa tu correo
            </h2>
            <p id={ids.desc} className="recuperar-lead">
              Si <strong className="recuperar-correo">{correo}</strong> está registrado en Empres360 PRO, te enviamos un enlace para crear una nueva contraseña. El enlace vence en 1 hora.
            </p>
            <p className="recuperar-nota">
              ¿No lo ves en unos minutos? Revisa que el correo esté bien escrito y busca en la carpeta de spam o correo no deseado.
            </p>
            <div className="recuperar-fila">
              <button type="button" className="recuperar-reenviar" disabled={contando || enviando} onClick={enviar}>
                {enviando ? 'Reenviando…' : contando ? <>Puedes reenviar en <span className="recuperar-num">{mmss(restante)}</span></> : 'Reenviar enlace'}
              </button>
              <button type="button" className="recuperar-textual" onClick={cambiarCorreo}>Cambiar correo</button>
            </div>
            {bloqueFallo}
            <p className="recuperar-registro">
              ¿No tienes cuenta? Regístrate{' '}
              <a href="/registro-egresado" onClick={irARegistro('/registro-egresado')}>como graduado</a>
              {' '}o{' '}
              <a href="/register/company" onClick={irARegistro('/register/company')}>como empresa</a>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default RecuperarModal;
