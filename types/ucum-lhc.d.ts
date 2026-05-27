declare module '@lhncbc/ucum-lhc' {
  export class UcumLhcUtils {
    static getInstance(): {
      convertUnitTo(
        fromUnitCode: string,
        fromVal: number,
        toUnitCode: string,
        options?: unknown,
      ): { status: string; toVal?: number };
    };
  }
}
