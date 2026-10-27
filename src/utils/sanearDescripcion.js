import DOMPurify from 'dompurify';

// Descripción de la vacante: HTML del editor Quill 2 de la empresa. Antes de
// pintarlo se deja sólo lo que produce ese editor: bloques, negrita/cursiva/
// subrayado/tachado, listas (Quill 2 marca las viñetas con data-list),
// encabezados, alineación por clase, color y resaltado por estilo, y enlaces
// http/https/mailto. Lo usan VacantesDashboard.jsx y SolicitudesEgresado.jsx.
const purificador = DOMPurify(window); // instancia propia: sus hooks no afectan a nadie más
const CLASE_PERMITIDA = /^ql-align-(center|right|justify)$/;
const ESTILOS_PERMITIDOS = new Set(['color', 'background-color']);
const VALOR_DE_ESTILO = /^[#\w\s(),.%-]+$/;

purificador.addHook('uponSanitizeAttribute', (_nodo, datos) => {
    if (datos.attrName === 'class') {
        datos.attrValue = datos.attrValue.split(/\s+/).filter((c) => CLASE_PERMITIDA.test(c)).join(' ');
    } else if (datos.attrName === 'style') {
        datos.attrValue = datos.attrValue.split(';').map((d) => d.split(':'))
            .filter(([prop, valor, ...resto]) => !resto.length && valor && ESTILOS_PERMITIDOS.has(prop.trim().toLowerCase())
                && VALOR_DE_ESTILO.test(valor.trim()) && !/url|expression/i.test(valor))
            .map(([prop, valor]) => `${prop.trim().toLowerCase()}: ${valor.trim()}`).join('; ');
    } else if (datos.attrName === 'data-list' && !['bullet', 'ordered'].includes(datos.attrValue)) {
        datos.attrValue = '';
    }
    if (!datos.attrValue) datos.keepAttr = false;
});

purificador.addHook('afterSanitizeAttributes', (nodo) => {
    if (nodo.tagName === 'A' && nodo.hasAttribute('href')) nodo.setAttribute('rel', 'noopener noreferrer');
    else nodo.removeAttribute('rel');
});

export const sanearDescripcion = (html) => purificador.sanitize(html || '', {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 's', 'ol', 'ul', 'li', 'a', 'h1', 'h2', 'h3', 'span'],
    ALLOWED_ATTR: ['href', 'rel', 'class', 'style', 'data-list'],
    ALLOW_DATA_ATTR: false,
    ALLOWED_URI_REGEXP: /^(?:https?:|mailto:)/i, // sólo para href
    ADD_URI_SAFE_ATTR: ['data-list', 'rel'], // sin esto, su valor se validaría como URL y se borraría
});
