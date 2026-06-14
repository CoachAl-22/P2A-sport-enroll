import assert from "node:assert/strict";
import { schoolCodeForVenue, majUsernameBase, resolveUsername, majPassword } from "../shared/maj-provisioning";

// school code from venue name
assert.equal(schoolCodeForVenue("Peninsula Grammar"), "PG");
assert.equal(schoolCodeForVenue("Toorak College"), "TC");
assert.equal(schoolCodeForVenue("Mornington Athletic Track"), "P2A");
assert.equal(schoolCodeForVenue("Ballam Park Athletic Track"), "P2A");
assert.equal(schoolCodeForVenue(""), "P2A");

// username base: firstname + last initial, lowercased, alphanumeric only
assert.equal(majUsernameBase("Eddy", "Kovac"), "eddyk");
assert.equal(majUsernameBase("Mary-Jane", "O'Brien"), "maryjaneo");
assert.equal(majUsernameBase("  Sam ", "Lee"), "saml");

// collision resolution
const taken = new Set(["eddyk", "eddyk2"]);
assert.equal(resolveUsername("eddyk", (u) => taken.has(u)), "eddyk3");
assert.equal(resolveUsername("zoel", (u) => taken.has(u)), "zoel");

// password = code + year
assert.equal(majPassword("PG", 2026), "PG2026");
assert.equal(majPassword("P2A", 2026), "P2A2026");

console.log("maj-provisioning tests passed");
