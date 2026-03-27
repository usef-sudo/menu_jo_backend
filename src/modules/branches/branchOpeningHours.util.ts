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

const WEEKDAY_TO_NUM: Record<string, number> = {
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
  Sun: 7,
};

/**
 * Get local weekday (1..7) and minutes since midnight for a given IANA timezone.
 * Falls back to runtime timezone if the provided timezone is invalid.
 */
export function getZonedWeekdayAndMinutes(
  at: Date,
  timeZone: string,
): { weekday: number; minutes: number } {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = fmt.formatToParts(at);
  const wdText = parts.find((p) => p.type === "weekday")?.value ?? "Mon";
  const hText = parts.find((p) => p.type === "hour")?.value ?? "00";
  const mText = parts.find((p) => p.type === "minute")?.value ?? "00";
  const weekday = WEEKDAY_TO_NUM[wdText] ?? 1;
  const hour = Number(hText);
  const minute = Number(mText);
  return { weekday, minutes: hour * 60 + minute };
}

export interface OpeningHourSlot {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  closesNextDay: boolean;
}

function containsLocalMoment(
  slot: OpeningHourSlot,
  localWeekday: number,
  localMinutes: number,
): boolean {
  const o = parseHmToMinutes(slot.openTime);
  if (o === null) return false;

  if (slot.closesNextDay) {
    const cRaw = parseHmToMinutes(slot.closeTime) ?? 0;
    if (localWeekday === slot.dayOfWeek) {
      return localMinutes >= o;
    }
    const previousWeekday = localWeekday === 1 ? 7 : localWeekday - 1;
    return previousWeekday === slot.dayOfWeek && localMinutes < cRaw;
  }

  if (localWeekday !== slot.dayOfWeek) return false;
  const cEff = effectiveCloseMinutes(slot.closeTime, false);
  return localMinutes >= o && localMinutes < cEff;
}

/**
 * Compute "open now" consistently on the backend (single source of truth).
 * - Respects admin `isOpen` flag (0 = forced closed)
 * - Uses weekly openingHours when present; else falls back to legacy openTime/closeTime.
 */
export function computeOpenNow(args: {
  isOpen?: number | boolean | null;
  openingHours?: OpeningHourSlot[];
  openTime?: string | null;
  closeTime?: string | null;
  at?: Date;
  timeZone?: string;
}): boolean {
  const {
    isOpen,
    openingHours = [],
    openTime,
    closeTime,
    at = new Date(),
    timeZone = process.env.APP_TIMEZONE || "Asia/Amman",
  } = args;

  const adminOpen =
    isOpen === undefined || isOpen === null
      ? true
      : typeof isOpen === "boolean"
        ? isOpen
        : Number(isOpen) !== 0;
  if (!adminOpen) return false;

  // Prefer weekly schedule if present
  if (openingHours.length > 0) {
    let local: { weekday: number; minutes: number };
    try {
      local = getZonedWeekdayAndMinutes(at, timeZone);
    } catch {
      local = getZonedWeekdayAndMinutes(at, Intl.DateTimeFormat().resolvedOptions().timeZone);
    }
    return openingHours.some((s) => containsLocalMoment(s, local.weekday, local.minutes));
  }

  // Legacy daily hours (same every day)
  const o = openTime ? parseHmToMinutes(openTime) : null;
  const c = closeTime ? parseHmToMinutes(closeTime) : null;
  if (o === null || c === null) return true;
  if (o === 0 && c === 0) return false;

  let localMinutes: number;
  try {
    localMinutes = getZonedWeekdayAndMinutes(at, timeZone).minutes;
  } catch {
    localMinutes = at.getHours() * 60 + at.getMinutes();
  }

  let cEff = c;
  if (c === 0 && o > 0) cEff = 24 * 60;
  if (cEff > o) return localMinutes >= o && localMinutes < cEff;
  return localMinutes >= o || localMinutes < c;
}
