import assert from "node:assert/strict";
import { CLASS_PRESETS } from "../shared/class-presets";

const VALID_SPORT_TYPES = new Set([
  "foundation_prep_year2", "emerging_year3_6", "team_sport_speed",
  "junior_development", "senior_squad", "empowered_athlete_program",
]);

assert.equal(CLASS_PRESETS.length, 6);

for (const p of CLASS_PRESETS) {
  assert.ok(p.key && typeof p.key === "string", `preset missing key: ${JSON.stringify(p)}`);
  assert.ok(p.label && p.label.length > 0, `preset ${p.key} missing label`);
  assert.ok(p.name && p.name.length > 0, `preset ${p.key} missing name`);
  assert.ok(p.description && p.description.length > 20, `preset ${p.key} description too short`);
  assert.ok(VALID_SPORT_TYPES.has(p.sportType), `preset ${p.key} bad sportType: ${p.sportType}`);
  assert.ok(Number.isInteger(p.minAge) && Number.isInteger(p.maxAge), `preset ${p.key} ages must be ints`);
  assert.ok(p.minAge <= p.maxAge, `preset ${p.key} minAge > maxAge`);
  assert.equal(p.pricePerSession, "30.00", `preset ${p.key} pricePerSession must be "30.00"`);
  assert.equal(typeof p.perWeekEnabled, "boolean", `preset ${p.key} perWeekEnabled must be boolean`);
}

const perWeekOn = CLASS_PRESETS.filter((p) => p.perWeekEnabled).map((p) => p.sportType).sort();
assert.deepEqual(perWeekOn, ["emerging_year3_6", "foundation_prep_year2"]);

assert.equal(new Set(CLASS_PRESETS.map((p) => p.key)).size, CLASS_PRESETS.length);

console.log("class-presets tests passed");
