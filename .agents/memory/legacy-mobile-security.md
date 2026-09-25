---
name: Legacy mobile security upgrades
description: Tradeoff and verification for dependency security work in the older mobile app.
---

Prefer compatible patches and targeted transitive dependency upgrades over a wholesale mobile SDK migration when repairing dependency advisories.

**Why:** A major SDK migration changes the React Native and Expo runtime together and needs product-level regression testing; an older mobile toolchain may need compatibility work to use patched transitive dependencies safely.

**How to apply:** When touching mobile dependencies, audit the independent mobile lockfile and test a clean install and native export. If upgrading the SDK intentionally, reassess which compatibility measures are still necessary.