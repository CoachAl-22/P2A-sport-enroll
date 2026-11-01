import { describe, expect, it } from "vitest";
import { RUNG_PAGES, RUNGS } from "./rungs";

describe("Approved finder offerings", () => {
  it("offers only the existing school booking routes with master timetable start times", () => {
    expect(RUNG_PAGES.foundation.classes.map(({ slug, time }) => [slug, time])).toEqual([
      ["pg-foundation-mon", "3:30pm"],
      ["toorak-foundation-thu", "3:30pm"],
    ]);
    expect(RUNG_PAGES["emerging-athletes"].classes.map(({ slug, time }) => [slug, time])).toEqual([
      ["pg-emerging-mon", "3:30pm"],
      ["toorak-emerging-thu", "3:30pm"],
    ]);
  });

  it("keeps speed and squad sessions aligned with the approved master schedule", () => {
    expect(RUNG_PAGES["team-sport-speed"].classes.map(({ day, time }) => `${day} ${time}`)).toEqual([
      "Wednesday 5:30pm",
      "Friday 4:30pm",
      "Friday 5:30pm",
    ]);
    const junior = RUNGS["junior-academy"];
    const senior = RUNGS["senior-squad"];
    expect("sessions" in junior && junior.sessions?.map(({ day, time }) => `${day} ${time}`)).toEqual([
      "Monday 5:30pm to 7:00pm",
      "Tuesday 5:30pm to 7:00pm",
      "Wednesday 5:30pm",
      "Thursday 5:30pm to 7:00pm",
      "Friday 4:30pm",
      "Friday 5:30pm",
    ]);
    expect("sessions" in senior && senior.sessions?.map(({ day, time }) => `${day} ${time}`)).toEqual([
      "Monday 5:30pm to 7:00pm",
      "Tuesday 5:30pm to 7:00pm",
      "Wednesday 5:30pm",
      "Thursday 5:30pm to 7:00pm",
      "Friday 4:30pm",
      "Friday 5:30pm",
    ]);
  });
  it("uses the confirmed younger-group inclusions", () => {
    expect(RUNG_PAGES.foundation.included).toEqual(["My Athletic Journey app access for the whole term"]);
    expect(RUNG_PAGES["emerging-athletes"].included).toEqual(["My Athletic Journey app access for the whole term"]);
  });
});