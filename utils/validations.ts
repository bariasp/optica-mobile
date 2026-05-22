export function validarEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function limpiarRut(rut: string) {
  return rut.replace(/\./g, '').replace(/-/g, '').trim().toUpperCase();
}

export function validarRut(rut: string) {
  const rutLimpio = limpiarRut(rut);

  if (rutLimpio.length < 8) return false;

  const cuerpo = rutLimpio.slice(0, -1);
  const dv = rutLimpio.slice(-1);

  if (!/^\d+$/.test(cuerpo)) return false;

  let suma = 0;
  let multiplo = 2;

  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * multiplo;
    multiplo = multiplo < 7 ? multiplo + 1 : 2;
  }

  const dvEsperadoNumero = 11 - (suma % 11);

  let dvEsperado = '';

  if (dvEsperadoNumero === 11) {
    dvEsperado = '0';
  } else if (dvEsperadoNumero === 10) {
    dvEsperado = 'K';
  } else {
    dvEsperado = String(dvEsperadoNumero);
  }

  return dv === dvEsperado;
}

export function formatearRut(rut: string) {
  const rutLimpio = limpiarRut(rut);

  if (rutLimpio.length < 2) return rut;

  const cuerpo = rutLimpio.slice(0, -1);
  const dv = rutLimpio.slice(-1);

  return `${cuerpo}-${dv}`;
}

export function validarFechaNacimiento(
  fecha: string,
  edadMinima: number,
  edadMaxima: number,
) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return false;
  }

  const nacimiento = new Date(`${fecha}T00:00:00`);

  if (Number.isNaN(nacimiento.getTime())) {
    return false;
  }

  const [year, month, day] = fecha.split('-').map(Number);

  if (
    nacimiento.getFullYear() !== year ||
    nacimiento.getMonth() + 1 !== month ||
    nacimiento.getDate() !== day
  ) {
    return false;
  }

  const hoy = new Date();

  if (nacimiento > hoy) {
    return false;
  }

  let edad = hoy.getFullYear() - nacimiento.getFullYear();

  const diferenciaMes = hoy.getMonth() - nacimiento.getMonth();

  if (
    diferenciaMes < 0 ||
    (diferenciaMes === 0 && hoy.getDate() < nacimiento.getDate())
  ) {
    edad--;
  }

  return edad >= edadMinima && edad <= edadMaxima;
}

export function validarPassword(password: string) {
  return password.length >= 6;
}