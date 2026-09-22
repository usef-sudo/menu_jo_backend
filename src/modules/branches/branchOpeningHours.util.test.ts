import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computeOpenNow } from "./branchOpeningHours.util";
import { haversineKm } from "./geo.util";

describe("computeOpenNow", () => {
  it("returns false when admin isOpen is 0", () => {
    const at = new Date("2026-03-24T12:00:00+03:00");
    assert.equal(
      computeOpenNow({
        isOpen: 0,
        openingHours: [
          {
            dayOfWeek: 2,
            openTime: "09:00",
            closeTime: "22:00",
            closesNextDay: false,
          },
        ],
        at,
        timeZone: "Asia/Amman",
      }),
      false,
    );
  });

  it("returns false when weekly hours say closed even if admin isOpen is 1", () => {
    // Tuesday 23:00 Amman; hours 10:00–22:00 Tuesday
    const at = new Date("2026-03-24T23:00:00+03:00");
    assert.equal(
      computeOpenNow({
        isOpen: 1,
        openingHours: [
          {
            dayOfWeek: 2,
            openTime: "10:00",
            closeTime: "22:00",
            closesNextDay: false,
          },
        ],
        at,
        timeZone: "Asia/Amman",
      }),
      false,
    );
  });

  it("returns true during an overnight slot after midnight", () => {
    // Wednesday 00:30 Amman; Tuesday 22:00–02:00 overnight
    const at = new Date("2026-03-25T00:30:00+03:00");
    assert.equal(
      computeOpenNow({
        isOpen: 1,
        openingHours: [
          {
            dayOfWeek: 2,
            openTime: "22:00",
            closeTime: "02:00",
            closesNextDay: true,
          },
        ],
        at,
        timeZone: "Asia/Amman",
      }),
      true,
    );
  });
});

describe("haversineKm", () => {
  it("is ~0 for the same point", () => {
    assert.ok(haversineKm(31.95, 35.91, 31.95, 35.91) < 0.001);
  });

  it("is about 111 km per degree of latitude", () => {
    const d = haversineKm(0, 0, 1, 0);
    assert.ok(d > 110 && d < 112);
  });
});
