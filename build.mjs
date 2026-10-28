/**
 * Builds M67-phone.html — the single file you can double-click.
 *
 * It inlines styles.css, every module app.js imports (three.js included) and
 * the body of index.html, minified. esbuild is the only dependency, and it is
 * a dev dependency: the shipped file still needs nothing at runtime.
 *
 *   node build.mjs           rebuild
 *   node build.mjs --check   fail if the bundle is older than any source
 */
import { build } from "esbuild";
import { readFile, writeFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
process.chdir(root);

const OUTPUT = "M67-phone.html";
const SOURCES = ["index.html", "styles.css", "app.js", "vendor/three.module.js", "vendor/three.core.js"];

async function mtime(file) {
  try {
    return (await stat(resolve(root, file))).mtimeMs;
  } catch (error) {
    return 0;
  }
}

if (process.argv.includes("--check")) {
  const built = await mtime(OUTPUT);
  const newest = Math.max(...(await Promise.all(SOURCES.map(mtime))));
  if (!built) {
    console.error(`✗ ${OUTPUT} is missing — run: node build.mjs`);
    process.exit(1);
  }
  if (built < newest) {
    const stale = [];
    for (const file of SOURCES) {
      if ((await mtime(file)) > built) stale.push(file);
    }
    console.error(`✗ ${OUTPUT} is older than ${stale.join(", ")} — run: node build.mjs`);
    process.exit(1);
  }
  console.log(`✓ ${OUTPUT} is up to date`);
  process.exit(0);
}

const script = await build({
  entryPoints: ["app.js"],
  bundle: true,
  format: "iife",
  minify: true,
  target: ["es2020"],
  legalComments: "none",
  write: false,
  alias: { three: "./vendor/three.module.js" },
});

const styleSheet = await build({
  entryPoints: ["styles.css"],
  bundle: true,
  minify: true,
  write: false,
});

const js = script.outputFiles[0].text;
const css = styleSheet.outputFiles[0].text;
const html = await readFile(resolve(root, "index.html"), "utf8");

const steps = [
  [
    '<link rel="stylesheet" href="styles.css">',
    () => `<style>\n${css}\n</style>`,
  ],
  [
    /<script type="importmap">[\s\S]*?<\/script>\n?\s*/,
    () => "",
  ],
  [
    '<script type="module" src="app.js"></script>',
    () => `<script>\n${js}\n</script>`,
  ],
];

let output = html;
for (const [needle, replacement] of steps) {
  // The replacement has to go through a function: the minified JS is full of
  // `$&`, `$1` and `` $` `` sequences, which String.replace would treat as
  // capture references and mangle.
  const next = output.replace(needle, () => replacement());
  if (next === output) {
    console.error(`✗ could not find ${needle} in index.html — the bundle would have been incomplete`);
    process.exit(1);
  }
  output = next;
}

if (/href="styles\.css"|src="app\.js"|importmap/.test(output)) {
  console.error("✗ index.html still references external assets after inlining");
  process.exit(1);
}

await writeFile(resolve(root, OUTPUT), output);
const size = (Buffer.byteLength(output) / 1024).toFixed(0);
console.log(`✓ ${OUTPUT} — ${size} KB (js ${(js.length / 1024).toFixed(0)} KB, css ${(css.length / 1024).toFixed(0)} KB)`);
