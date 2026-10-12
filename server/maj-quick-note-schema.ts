import { db } from "./db";
import { sql } from "drizzle-orm";

/** Additive, idempotent migration for the existing Neon database; no data rewrites. */
export async function ensureMajQuickNoteSchema() {
  await db.transaction(async tx => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(901225, 3)`);
    await tx.execute(sql`ALTER TABLE maj_athletes ADD COLUMN IF NOT EXISTS roster_active boolean NOT NULL DEFAULT true`);
    await tx.execute(sql`ALTER TABLE maj_skill_assessments
      ADD COLUMN IF NOT EXISTS observation_kind text NOT NULL DEFAULT 'assessment',
      ADD COLUMN IF NOT EXISTS skill text,
      ADD COLUMN IF NOT EXISTS parent_message text,
      ADD COLUMN IF NOT EXISTS send_to_parent boolean NOT NULL DEFAULT true,
      ADD COLUMN IF NOT EXISTS client_note_id uuid,
      ADD COLUMN IF NOT EXISTS coach_username text`);
    await tx.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS maj_skill_assessments_client_note_id_unique
      ON maj_skill_assessments(client_note_id)`);
    await tx.execute(sql`ALTER TABLE maj_push_subscriptions
      ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES users(id) ON DELETE CASCADE`);
    await tx.execute(sql`ALTER TABLE maj_push_subscriptions ALTER COLUMN athlete_id DROP NOT NULL`);
    await tx.execute(sql`CREATE TABLE IF NOT EXISTS maj_parent_links (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      athlete_id uuid NOT NULL REFERENCES maj_athletes(id) ON DELETE CASCADE,
      parent_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(athlete_id, parent_id))`);
    await tx.execute(sql`CREATE TABLE IF NOT EXISTS maj_parent_invites (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      athlete_id uuid NOT NULL REFERENCES maj_athletes(id) ON DELETE CASCADE,
      email varchar(255) NOT NULL,
      token_hash text NOT NULL UNIQUE,
      expires_at timestamptz NOT NULL,
      accepted_by uuid REFERENCES users(id),
      created_at timestamptz DEFAULT now())`);
    await tx.execute(sql`CREATE INDEX IF NOT EXISTS maj_parent_links_parent_idx ON maj_parent_links(parent_id)`);
    await tx.execute(sql`CREATE INDEX IF NOT EXISTS maj_quick_notes_athlete_idx ON maj_skill_assessments(athlete_id, created_at)
      WHERE observation_kind = 'quick_note'`);
  });
}
