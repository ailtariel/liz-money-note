export function nowIso() {
  return new Date().toISOString();
}

export function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export function toDateInputValue(value: string) {
  return value.slice(0, 10);
}
