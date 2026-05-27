/** Clinical unit helpers — store metric (Celsius, cm, kg) in FHIR. */

export function celsiusFromTemperatureInput(value: number, unit: 'Cel' | '[degF]'): number {
  if (unit === '[degF]') return ((value - 32) * 5) / 9;
  return value;
}

export function temperatureInputFromCelsius(celsius: number, unit: 'Cel' | '[degF]'): number {
  if (unit === '[degF]') return (celsius * 9) / 5 + 32;
  return celsius;
}

export function cmFromLengthInput(value: number, unit: 'cm' | 'in'): number {
  return unit === 'in' ? value * 2.54 : value;
}

export function lengthInputFromCm(cm: number, unit: 'cm' | 'in'): number {
  return unit === 'in' ? cm / 2.54 : cm;
}

export function roundClinical(n: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(n * factor) / factor;
}
