import { readFileSync, readdirSync, statSync, existsSync } from "fs";
import { join, dirname, resolve, relative } from "path";

const SRC = resolve("src");
const exts = [".js", ".jsx", ".ts", ".tsx"];

const files = [];
(function walk(dir) {
  for (const e of readdirSync(dir)) {
    if (e === "node_modules" || e === "dist" || e.startsWith(".")) continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p);
    else if (exts.some((x) => p.endsWith(x))) files.push(p);
  }
})(SRC);

const resolveSpec = (spec, fromFile) => {
  if (!spec.startsWith(".")) return null;
  const base = resolve(dirname(fromFile), spec);
  const cands = [base, ...exts.map((x) => base + x), ...exts.map((x) => join(base, "index" + x))];
  for (const c of cands) {
    if (existsSync(c) && statSync(c).isFile()) return c;
  }
  return null;
};

// match:  import ... from "x"   |  import "x"  |  export ... from "x"  |  import("x")  |  require("x")
const RE_STATIC = /(?:^|[\s;}])(?:import|export)\s(?:[^'"]*?\sfrom\s)?['"]([^'"]+)['"]/g;
const RE_DYN = /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
const RE_REQ = /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

const graph = new Map();
let edgeCount = 0;
let unresolved = 0;
const bad = [];

for (const f of files) {
  const src = readFileSync(f, "utf8");
  const deps = new Set();
  for (const re of [RE_STATIC, RE_DYN, RE_REQ]) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(src))) {
      const spec = m[1];
      if (!spec.startsWith(".")) continue;
      const r = resolveSpec(spec, f);
      if (r) { deps.add(r); edgeCount++; }
      else { unresolved++; bad.push(`${relative(SRC, f).replace(/\\/g,"/")}  ->  ${spec}`); }
    }
  }
  graph.set(f, [...deps]);
}

console.log("files scanned :", files.length);
console.log("import edges  :", edgeCount);
console.log("unresolved    :", unresolved, unresolved ? "<-- scanner is missing edges!" : "");

const WHITE = 0, GREY = 1, BLACK = 2;
const colour = new Map();
const cycles = [];
const stack = [];
function dfs(n) {
  colour.set(n, GREY);
  stack.push(n);
  for (const d of graph.get(n) || []) {
    const c = colour.get(d) || WHITE;
    if (c === WHITE) dfs(d);
    else if (c === GREY) {
      const i = stack.indexOf(d);
      if (i !== -1) cycles.push(stack.slice(i).concat(d));
    }
  }
  stack.pop();
  colour.set(n, BLACK);
}
for (const f of files) if ((colour.get(f) || WHITE) === WHITE) dfs(f);

const rel = (f) => relative(SRC, f).replace(/\\/g, "/");
const uniq = [];
const seen = new Set();
for (const cyc of cycles) {
  const key = [...cyc].sort().join("|");
  if (seen.has(key)) continue;
  seen.add(key);
  uniq.push(cyc);
}

console.log("\nunresolved imports:");
[...new Set(bad)].forEach((b) => console.log("   " + b));
console.log("\ncycles found  :", uniq.length, "\n");
for (const cyc of uniq) {
  console.log("CYCLE (" + (cyc.length - 1) + "):");
  cyc.forEach((n, i) => console.log("   " + (i === cyc.length - 1 ? "-> " : "   ") + rel(n)));
  console.log("");
}
