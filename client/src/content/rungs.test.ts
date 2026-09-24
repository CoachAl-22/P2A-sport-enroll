import { describe, expect, it } from "vitest";
import { RUNG_PAGES, RUNGS } from "./rungs";

describe("Term 4 finder offerings", () => {
  it("offers only the four school enrolments listed in the Term 4 table", () => {
    expect(RUNG_PAGES.foundation.classes.map(({ slug, time }) => [slug, time])).toEqual([
      ["pg-foundation-mon", "3:30pm to 4:45pm"],
      ["toorak-foundation-thu", "3:30pm to 4:45pm"],
    ]);
    expect(RUNG_PAGES["emerging-athletes"].classes.map(({ slug, time }) => [slug, time])).toEqual([
      ["pg-emerging-mon", "3:30pm to 4:45pm"],
      ["toorak-emerging-thu", "3:30pm to 4:45pm"],
    ]);
  });

  it("keeps the three Term 4 speed sessions and by-application times", () => {
    expect(RUNG_PAGES["team-sport-speed"].classes.map(({ day, time }) => `${day} ${time}`)).toEqual([
      "Wednesday 5:30pm",
      "Friday 4:30pm",
      "Friday 5:30pm",
    ]);
    const junior = RUNGS["junior-academy"];
    const senior = RUNGS["senior-squad"];
    expect("sessions" in junior && junior.sessions?.map(({ day, time }) => `${day} ${time}`)).toEqual([
      "Tuesday 4:30pm",
      "Monday 5:30pm to 7:00pm",
      "Tuesday 5:30pm to 7:00pm",
      "Thursday 5:30pm to 7:00pm",
    ]);
    expect("sessions" in senior && senior.sessions?.map(({ day, time }) => `${day} ${time}`)).toEqual([
      "Monday 5:30pm to 7:00pm",
      "Tuesday 5:30pm to 7:00pm",
      "Thursday 5:30pm to 7:00pm",
      "Wednesday 5:30pm",
    ]);
  });
});