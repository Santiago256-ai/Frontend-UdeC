// Validación del correo del modal "Recuperar contraseña" (DESIGN.md §8).
// Funciones puras: sin React, para poder probarlas aparte.

const DOMINIOS_COMUNES = [
  'gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'icloud.com',
  'live.com', 'ucundinamarca.edu.co',
];

export const normalizarCorreo = (v) => v.trim().toLowerCase();

/** Mensaje en español del primer problema encontrado, o '' si el correo es válido. */
export function validarCorreo(bruto) {
  const v = normalizarCorreo(bruto);
  if (!v) return 'Escribe tu correo electrónico.';
  if (/\s/.test(v)) return 'El correo no puede tener espacios.';
  if (!v.includes('@')) return 'Falta la @. Ejemplo: nombre@correo.com';
  if (v.split('@').length > 2) return 'El correo sólo puede tener una @.';
  const [local, dominio] = v.split('@');
  if (!local) return 'Falta la parte antes de la @.';
  if (!dominio) return 'Falta el dominio después de la @, por ejemplo gmail.com.';
  if (!dominio.includes('.') || dominio.endsWith('.')) return 'Al dominio le falta la terminación, como .com o .edu.co.';
  if (v.length > 254 || local.length > 64) return 'El correo es demasiado largo.';
  const formato = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*\.[a-z]{2,}$/;
  if (!formato.test(v) || v.includes('..') || local.startsWith('.') || local.endsWith('.')) {
    return 'Revisa el correo: tiene caracteres o un formato que no son válidos.';
  }
  return '';
}

// Distancia de edición con transposición (gmial → gmail cuenta como 1).
function distancia(a, b) {
  if (Math.abs(a.length - b.length) > 2) return 3;
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[a.length][b.length];
}

/** "¿Quisiste decir…?" para dominios comunes mal escritos. Nunca bloquea el envío. */
export function sugerirCorreo(bruto) {
  const [local, dominio] = normalizarCorreo(bruto).split('@');
  if (!local || !dominio || DOMINIOS_COMUNES.includes(dominio)) return '';
  const cerca = DOMINIOS_COMUNES.find((d) => distancia(dominio, d) <= 2);
  return cerca ? `${local}@${cerca}` : '';
}
