import { UcumLhcUtils } from '@lhncbc/ucum-lhc';

let utils: ReturnType<typeof UcumLhcUtils.getInstance> | null = null;

function getUtils() {
  if (!utils) utils = UcumLhcUtils.getInstance();
  return utils;
}

/** Convert a numeric value between UCUM units; returns null when conversion fails. */
export function convertUcum(value: number, fromUnit: string, toUnit: string): number | null {
  if (!fromUnit || !toUnit || fromUnit === toUnit) return value;
  try {
    const result = getUtils().convertUnitTo(fromUnit, value, toUnit);
    if (result?.status !== 'succeeded' || result.toVal === undefined) return null;
    return result.toVal;
  } catch {
    return null;
  }
}
