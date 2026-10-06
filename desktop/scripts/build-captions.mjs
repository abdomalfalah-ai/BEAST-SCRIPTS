// Downloads the pinned Tscaps release and builds its caption editor into
// desktop/captions-dist, served by the app at beast://app/captions/.
// Tscaps (https://github.com/francozanardi/tscaps) is shipped unmodified;
// its editor is AGPL-3.0, so the exact source is the pinned commit below.
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const TSCAPS_REPO = "https://github.com/francozanardi/tscaps";
export const TSCAPS_COMMIT = "9a34f7e1a7a3905e782830a4ca55eeabe0908115";

const desktopDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = join(desktopDir, ".tscaps-src");
const outDir = join(desktopDir, "captions-dist");

const run = (cmd, cwd) => execSync(cmd, { cwd, stdio: "inherit" });

if (!existsSync(join(srcDir, ".git"))) {
  mkdirSync(srcDir, { recursive: true });
  run("git init -q", srcDir);
  run(`git remote add origin ${TSCAPS_REPO}`, srcDir);
}
run(`git fetch -q --depth 1 origin ${TSCAPS_COMMIT}`, srcDir);
run("git checkout -q --force FETCH_HEAD", srcDir);

run("corepack pnpm install --frozen-lockfile", srcDir);
rmSync(outDir, { recursive: true, force: true });
run(`corepack pnpm exec vite build --base=/captions/ --outDir "${outDir}" --emptyOutDir`, join(srcDir, "apps", "studio"));

writeFileSync(join(outDir, "SOURCE.txt"),
  `Tscaps caption editor, built unmodified from:\n${TSCAPS_REPO}/tree/${TSCAPS_COMMIT}\n` +
  `Editor license: AGPL-3.0 (apps/studio/LICENSE). Engine and templates: MIT.\n`);
console.log(`Built Tscaps ${TSCAPS_COMMIT.slice(0, 7)} into ${outDir}`);
