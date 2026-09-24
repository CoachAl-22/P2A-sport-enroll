import { pool } from "../server/db";
import { configureTerm4AndArchiveTerm3 } from "../server/term4-2026-setup";

configureTerm4AndArchiveTerm3()
  .then(({ created, archived }) => {
    console.log(`Term 4 2026 configured with ${created} closed classes; ${archived} active Term 3 classes archived.`);
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());