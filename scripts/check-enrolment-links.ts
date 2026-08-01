import { storage } from "../server/storage";

const BASE = process.env.SITE_BASE_URL ?? "https://www.power2adapt.online";

async function main() {
  const links = await storage.getAllEnrolmentLinks();
  const active = links.filter((l) => l.active);
  const failures: string[] = [];

  console.log(`Checking ${active.length} active links (${links.length - active.length} inactive, skipped)\n`);

  for (const link of active) {
    const url = link.destinationUrl.startsWith("/")
      ? `${BASE}${link.destinationUrl}`
      : link.destinationUrl;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      try {
        const res = await fetch(url, { redirect: "follow", signal: controller.signal });
        clearTimeout(timeout);
        const ok = res.status === 200;
        console.log(`${ok ? "OK  " : "FAIL"}  ${res.status}  /enrol/${link.slug}  ->  ${url}`);
        if (!ok) failures.push(`/enrol/${link.slug} -> ${url} returned ${res.status}`);
      } finally {
        clearTimeout(timeout);
      }
    } catch (err) {
      const isTimeout = err instanceof Error && err.name === "AbortError";
      const message = isTimeout ? "timeout (10s)" : (err as Error).message;
      console.log(`FAIL  ERR  /enrol/${link.slug}  ->  ${url}`);
      failures.push(`/enrol/${link.slug} -> ${url} ${isTimeout ? "timed out" : `threw ${message}`}`);
    }
  }

  if (failures.length > 0) {
    console.error(`\n${failures.length} dead link(s):`);
    failures.forEach((f) => console.error(`  ${f}`));
    process.exit(1);
  }

  console.log("\nAll active links healthy.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
