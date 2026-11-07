/** ISO 3166-1 alpha-2 for race countries — local SVGs in /public/flags. */
const COUNTRY_ISO: Record<string, string> = {
  Australia: "au",
  China: "cn",
  Japan: "jp",
  USA: "us",
  Canada: "ca",
  Monaco: "mc",
  Spain: "es",
  Austria: "at",
  UK: "gb",
  Belgium: "be",
  Hungary: "hu",
  Netherlands: "nl",
  Italy: "it",
  Azerbaijan: "az",
  Malaysia: "my",
  Singapore: "sg",
  Mexico: "mx",
  Brazil: "br",
  Qatar: "qa",
  UAE: "ae",
};

export function countryIso(country: string): string | null {
  return COUNTRY_ISO[country] ?? null;
}

export function flagSrc(country: string): string | null {
  const iso = countryIso(country);
  return iso ? `/flags/${iso}.svg` : null;
}
