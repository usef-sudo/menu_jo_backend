/** 1 = Monday … 7 = Sunday (Dart DateTime.weekday). */
export const OPENING_TIME_RE = /^([01]?\d|2[0-3]):([0-5]\d)$/;

export function parseHmToMinutes(t: string): number | null {
  const m = t.trim().match(OPENING_TIME_RE);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  return h * 60 + min;
}

/** For same-day hours, treat close "00:00" as end of calendar day (exclusive 1440). */
export function effectiveCloseMinutes(closeTime: string, closesNextDay: boolean): number {
  if (!closesNextDay && closeTime.trim() === "00:00") return 24 * 60;
  const p = parseHmToMinutes(closeTime);
  return p ?? 0;
}

export function validateOpeningSlot(input: {
  dayOfWeek: number;
  slotIndex: number;
  openTime: string;
  closeTime: string;
  closesNextDay: boolean;
}): void {
  const { dayOfWeek, slotIndex, openTime, closeTime, closesNextDay } = input;
  if (!Number.isInteger(dayOfWeek) || dayOfWeek < 1 || dayOfWeek > 7) {
    throw new Error("INVALID_DAY_OF_WEEK");
  }
  if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex > 10) {
    throw new Error("INVALID_SLOT_INDEX");
  }
  const open = openTime.trim();
  const close = closeTime.trim();
  if (!OPENING_TIME_RE.test(open) || !OPENING_TIME_RE.test(close)) {
    throw new Error("INVALID_TIME_FORMAT");
  }
  const o = parseHmToMinutes(open);
  const cRaw = parseHmToMinutes(close);
  if (o === null || cRaw === null) throw new Error("INVALID_TIME_FORMAT");

  if (closesNextDay) {
    if (o <= cRaw) {
      throw new Error("OVERNIGHT_REQUIRES_OPEN_AFTER_CLOSE_ON_CLOCK");
    }
    return;
  }

  const cEff = effectiveCloseMinutes(close, false);
  if (o >= cEff) {
    throw new Error("SAME_DAY_REQUIRES_OPEN_BEFORE_CLOSE");
  }
}

export interface OpeningHourInput {
  dayOfWeek: number;
  slotIndex?: number;
  openTime: string;
  closeTime: string;
  closesNextDay?: boolean;
}

export function normalizeOpeningHourInputs(slots: OpeningHourInput[]): OpeningHourInput[] {
  return slots.map((s) => ({
    dayOfWeek: s.dayOfWeek,
    slotIndex: s.slotIndex ?? 0,
    openTime: String(s.openTime).trim(),
    closeTime: String(s.closeTime).trim(),
    closesNextDay: Boolean(s.closesNextDay),
  }));
}
