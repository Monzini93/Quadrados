/** Minutos desde meia-noite (0–1439). */
export function parseHHmm(s: string): number {
  const [h, m] = s.split(":").map((x) => parseInt(x, 10));
  if (Number.isNaN(h) || Number.isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
    throw new Error("Horário inválido");
  }
  return h * 60 + m;
}

export function formatHHmm(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** yyyy-MM-dd → Date só data (UTC meia-noite). */
export function parseDateOnly(iso: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) throw new Error("Data inválida");
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
}

export function formatDateBR(d: Date): string {
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const year = d.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

export function weekdayUTC(d: Date): number {
  return d.getUTCDay();
}

/** Valor para input type="time" (HH:mm). */
export function minutesToTimeValue(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function parseTimeValueToMinutes(s: string): number {
  const [h, m] = s.split(":").map((x) => parseInt(x, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) throw new Error("Hora inválida");
  return h * 60 + m;
}
