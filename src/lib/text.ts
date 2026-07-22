const MOJIBAKE_PATTERN = /(?:\u00C3.|\u00C2.|\u00E2.|\uFFFD)/;

const repairMojibake = (value: string): string => {
  if (!value || !MOJIBAKE_PATTERN.test(value)) {
    return value;
  }

  try {
    const bytes = Uint8Array.from(value, (char) => char.charCodeAt(0));
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return value;
  }
};

export const normalizeText = <T>(value: T): T => {
  if (typeof value === 'string') {
    return repairMojibake(value) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeText(item)) as T;
  }

  if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entryValue]) => [key, normalizeText(entryValue)])
    ) as T;
  }

  return value;
};

export const normalizeOptionalText = (value: string | null | undefined): string => {
  if (!value) {
    return '';
  }

  return normalizeText(value);
};

export const slugify = (value: string): string =>
  normalizeOptionalText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
