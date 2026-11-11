export function toNumberOrUndefined(value: unknown): unknown {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  return Number(value);
}

export function toTrimmedStringOrUndefined(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

