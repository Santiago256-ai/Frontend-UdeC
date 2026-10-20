import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Info, Target, Award, Eye, Users, X } from 'lucide-react';
import './AcercaDeModal.css';

// Modal "Acerca de Empres360 PRO" — dirección "Expediente": panel verde de
// identidad (logo, índice de secciones, créditos) + una sección a la vez.
// Se abre desde el botón ⓘ del navbar de Landing.

// Textos del modal original; sólo cambia el formato (sin numeración,
// sin justificar, créditos como etiqueta/valor) y la errata "próximos".
const SECCIONES = [
  {
    id: 'que-es',
    icono: Info,
    titulo: '¿Qué es Empres360 PRO?',
    cuerpo: (
      <p>
        Es una plataforma digital estratégica diseñada para fortalecer el vínculo entre nuestra comunidad académica y el sector productivo. Este ecosistema facilita el encuentro entre el talento de alta calidad y las organizaciones que buscan perfiles innovadores, éticos y con responsabilidad social.
      </p>
    ),
  },
  {
    id: 'objetivos',
    icono: Target,
    titulo: 'Objetivos',
    cuerpo: (
      <p>
        Dinamizar la empleabilidad de los <strong>Egresados UdeC</strong>, permitiéndoles gestionar sus perfiles profesionales de manera integral, acceder a ofertas exclusivas del sector y potenciar su trayectoria laboral mediante herramientas tecnológicas.
      </p>
    ),
  },
  {
    id: 'mision',
    icono: Award,
    titulo: 'Nuestra Misión',
    cuerpo: (
      <p>
        Brindar una solución tecnológica eficiente y centralizada que simplifique los procesos de reclutamiento para las empresas y optimice la búsqueda de oportunidades para nuestros graduados, bajo los principios de transparencia y excelencia académica.
      </p>
    ),
  },
  {
    id: 'vision',
    icono: Eye,
    titulo: 'Nuestra Visión',
    cuerpo: (
      <p>
        Consolidarnos para los próximos años como el principal ecosistema de vinculación laboral universitaria en la región, siendo reconocidos por la innovación en nuestros procesos de intermediación y por el alto impacto en el desarrollo profesional de nuestra comunidad de egresados.
      </p>
    ),
  },
  {
    id: 'equipo',
    icono: Users,
    titulo: 'Equipo de Desarrollo y Diseño',
    cuerpo: (
      <>
        <p>
          Esta plataforma ha sido desarrollada bajo estándares modernos de ingeniería de sistemas/<wbr />software, integrando tecnologías de última generación para garantizar seguridad, velocidad y una experiencia de usuario intuitiva.
        </p>
        <dl className="acerca-creditos">
          <div><dt>Dirección de Proyecto</dt><dd>Universidad de Cundinamarca.</dd></div>
          <div><dt>Arquitectura y Desarrollo Full-stack</dt><dd>Empres360 PRO.</dd></div>
          <div><dt>Diseño de Interfaz (UI/UX)</dt><dd>Empres360 PRO.</dd></div>
        </dl>
      </>
    ),
  },
];

// Duraciones de salida: deben coincidir con `.acerca-saliendo` en el CSS.
const SALIDA_MS = 160;
const SALIDA_REDUCIDA_MS = 150;

function Pie() {
  return (
    <footer className="acerca-pie">
      <p className="acerca-pie-copy">© 2026 Todos los derechos reservados. Empres360 PRO · Universidad de Cundinamarca.</p>
      <p className="acerca-pie-nota">Institución de Educación Superior sujeta a inspección y vigilancia por el Ministerio de Educación Nacional.</p>
    </footer>
  );
}

function AcercaDeModal({ logoUrl, onClose, triggerRef }) {
  const tarjetaRef = useRef(null);
  const tabsRef = useRef([]);
  const cerrandoRef = useRef(false);
  const [cerrando, setCerrando] = useState(false);
  const [activa, setActiva] = useState(0);
  // De dónde vino el último cambio de pestaña: con teclado no hay fundido
  // (acción repetida, animarla la hace sentir lenta); con puntero, sí.
  // 'inicial' al abrir: la entrada de la tarjeta ya cubre la aparición del
  // contenido, un fundido de pestaña encima sería un doble fundido.
  const [origen, setOrigen] = useState('inicial');
  const base = useId();
  const tituloId = `${base}-titulo`;

  // Guardia contra doble cierre (doble clic, o Esc + clic durante la salida).
  const cerrar = useCallback(() => {
    if (cerrandoRef.current) return;
    cerrandoRef.current = true;
    const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setCerrando(true);
    window.setTimeout(onClose, reducido ? SALIDA_REDUCIDA_MS : SALIDA_MS);
  }, [onClose]);

  // Foco al abrir, bloqueo de scroll del fondo y devolución de foco al ⓘ al cerrar.
  // El bloqueo va en línea con prioridad `important` sobre <html> y <body>:
  // EmpresaDashboard.css declara `html, body { overflow-y: auto !important }`
  // sin ámbito y viaja en el bundle global, así que un estilo en línea normal
  // pierde. <html> es el que gobierna el scroll del viewport.
  useEffect(() => {
    const disparador = triggerRef?.current;
    const raices = [document.documentElement, document.body];
    const previos = raices.map((el) => [
      el.style.getPropertyValue('overflow'),
      el.style.getPropertyPriority('overflow'),
    ]);
    raices.forEach((el) => el.style.setProperty('overflow', 'hidden', 'important'));
    tarjetaRef.current?.focus();
    return () => {
      raices.forEach((el, i) => {
        const [valor, prioridad] = previos[i];
        if (valor) el.style.setProperty('overflow', valor, prioridad);
        else el.style.removeProperty('overflow');
      });
      disparador?.focus();
    };
  }, [triggerRef]);

  // Esc cierra; Tab queda atrapado dentro de la tarjeta.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); cerrar(); return; }
      if (e.key !== 'Tab') return;
      const focoables = [...tarjetaRef.current.querySelectorAll(
        'button:not([disabled]):not([tabindex="-1"]), [href], [tabindex]:not([tabindex="-1"])'
      )].filter((el) => el.offsetParent !== null);
      if (!focoables.length) return;
      const primero = focoables[0];
      const ultimo = focoables[focoables.length - 1];
      if (e.shiftKey && (document.activeElement === primero || document.activeElement === tarjetaRef.current)) {
        e.preventDefault(); ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault(); primero.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [cerrar]);

  // Pestañas: flechas (ambas orientaciones, el índice es vertical en escritorio
  // y en filas en móvil), Inicio y Fin. Activación automática al mover el foco.
  const onTabKey = (e) => {
    const paso = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
    let siguiente = null;
    if (paso) siguiente = (activa + paso + SECCIONES.length) % SECCIONES.length;
    if (e.key === 'Home') siguiente = 0;
    if (e.key === 'End') siguiente = SECCIONES.length - 1;
    if (siguiente === null) return;
    e.preventDefault();
    setOrigen('teclado');
    setActiva(siguiente);
    tabsRef.current[siguiente]?.focus();
  };

  const seccion = SECCIONES[activa];
  const Icono = seccion.icono;

  return (
    <div className={`acerca-overlay${cerrando ? ' acerca-saliendo' : ''}`} lang="es" onClick={cerrar}>
      <div
        ref={tarjetaRef}
        className="acerca-tarjeta"
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <aside className="acerca-identidad">
          <div className="acerca-cabeza">
            <h2 id={tituloId} className="acerca-marca">
              <span className="acerca-sr">Acerca de </span>
              <img src={logoUrl} alt="Empres360 PRO" />
            </h2>
            <button type="button" className="acerca-cerrar" onClick={cerrar} aria-label="Cerrar">
              <X size={20} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>

          <div className="acerca-indice" role="tablist" aria-label="Secciones" onKeyDown={onTabKey}>
            {SECCIONES.map((sec, i) => {
              const Ic = sec.icono;
              return (
                <button
                  key={sec.id}
                  ref={(el) => { tabsRef.current[i] = el; }}
                  type="button"
                  role="tab"
                  id={`${base}-tab-${sec.id}`}
                  aria-selected={i === activa}
                  aria-controls={`${base}-panel`}
                  tabIndex={i === activa ? 0 : -1}
                  className="acerca-tab"
                  onClick={(e) => {
                    // detail === 0: "clic" sintetizado por Enter/Espacio → cuenta como teclado
                    setOrigen(e.detail === 0 ? 'teclado' : 'puntero');
                    setActiva(i);
                  }}
                >
                  <Ic size={17} strokeWidth={1.75} aria-hidden="true" />
                  <span>{sec.titulo}</span>
                </button>
              );
            })}
          </div>

          <div className="acerca-pie-panel"><Pie /></div>
        </aside>

        <div className="acerca-lectura">
          <section
            key={seccion.id}
            id={`${base}-panel`}
            role="tabpanel"
            aria-labelledby={`${base}-tab-${seccion.id}`}
            className={`acerca-panel acerca-panel-${seccion.id}`}
            data-origen={origen}
          >
            <span className="acerca-icono" aria-hidden="true"><Icono size={24} strokeWidth={1.6} /></span>
            <h3 className="acerca-titulo">{seccion.titulo}</h3>
            <div className="acerca-prosa">{seccion.cuerpo}</div>
          </section>
          <div className="acerca-pie-lectura"><Pie /></div>
        </div>
      </div>
    </div>
  );
}

export default AcercaDeModal;
