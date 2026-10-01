import provincesData from "../../public/data/wilayah/provinces.json";
import regenciesData from "../../public/data/wilayah/regencies.json";

export interface WilayahProvince {
  c: string;
  n: string;
}

export interface WilayahRegency {
  c: string;
  n: string;
  p: string;
  full: string;
}

export const PROVINCES = provincesData as WilayahProvince[];
export const REGENCIES = regenciesData as WilayahRegency[];

export const DEFAULT_PROVINCE_CODE = "35";

export function getRegenciesByProvince(provCode: string): WilayahRegency[] {
  return REGENCIES.filter((r) => r.p === provCode).sort((a, b) =>
    a.n.localeCompare(b.n, "id")
  );
}
