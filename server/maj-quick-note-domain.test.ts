import { describe, expect, it } from "vitest";
import { confirmObservationSchema, matchRosterName, parentNoteProjection, resolveDrafts } from "./maj-quick-note-domain";

const james = { id: "82dd2c5a-55b6-4a2d-a2e6-3d447bf9ea93", fullName: "James Prendergast" };
const ava = { id: "454c15e1-72ea-4475-ae90-9476aed48a25", fullName: "Ava Archer" };
const draft = {
  athlete_id: ava.id, athlete_name: "James Pendergrass", skill: "Running Arms",
  working_well: "Relaxed arms", to_improve: "Head position", suggested_cue: "Eyes ahead",
  parent_message: "James kept his arms relaxed; next time we'll practise looking ahead.",
};

describe("Quick Note matching and visibility", () => {
  it("matches the requested dictated surname variation", () => {
    expect(matchRosterName("James Pendergrass", [james, ava])?.id).toBe(james.id);
  });
  it("normalizes case, accents and punctuation", () => {
    expect(matchRosterName("  JAMES PRENDERGAST ", [james])?.id).toBe(james.id);
  });
  it("does not choose between children with the same first name", () => {
    expect(matchRosterName("James", [james, { ...ava, fullName: "James Archer" }])).toBeNull();
  });
  it("does not choose duplicate names", () => {
    expect(matchRosterName(james.fullName, [james, { ...ava, fullName: james.fullName }])).toBeNull();
  });
  it("requires confirmation for unknown athletes", () => {
    expect(resolveDrafts([{ ...draft, athlete_name: "Benjamin Nobody" }], [james])[0]).toMatchObject({ athlete_id: null, matched: false });
  });
  it("ignores a model's wrong athlete ID and resolves several observations", () => {
    expect(resolveDrafts([draft, { ...draft, athlete_name: ava.fullName }], [james, ava]).map(o => o.athlete_id)).toEqual([james.id, ava.id]);
  });
  it("rejects malformed or empty model output", () => {
    expect(() => resolveDrafts([], [james])).toThrow();
    expect(() => resolveDrafts([{ athlete_name: james.fullName }], [james])).toThrow();
  });
  it("requires an explicit send choice and message if sharing", () => {
    const confirm = { ...draft, athlete_id: james.id, clientNoteId: ava.id, send_to_parent: true };
    expect(confirmObservationSchema.safeParse(confirm).success).toBe(true);
    expect(confirmObservationSchema.safeParse({ ...confirm, parent_message: "" }).success).toBe(false);
    expect(confirmObservationSchema.safeParse({ ...confirm, parent_message: "", send_to_parent: false }).success).toBe(true);
  });
  it("projects only parent-approved fields, never private coaching detail or credentials", () => {
    const safe = parentNoteProjection({ id: "note", skill: "Arms", parentMessage: "Great effort",
      coachName: "Test Coach", createdAt: "today", strengths: "private", password: "private", clientNoteId: "private" });
    expect(Object.keys(safe)).toEqual(["id", "skill", "parent_message", "coach_name", "created_at"]);
    expect(JSON.stringify(safe)).not.toContain("private");
  });
});
