import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

/** Ordre : chaînes longues d’abord */
const REPLACEMENTS = [
  ["from-violet-600 to-fuchsia-600", "from-neutral-800 to-stone-900"],
  ["from-violet-500 to-fuchsia-600", "from-stone-600 to-stone-900"],
  ["from-violet-500 to-fuchsia-500", "from-stone-700 to-neutral-900"],
  ["from-violet-500/90 to-fuchsia-600", "from-stone-600 to-neutral-800"],
  ["from-indigo-500/90 to-violet-600", "from-stone-600 to-stone-800"],
  ["from-cyan-500/90 to-indigo-600", "from-stone-500 to-neutral-800"],
  ["from-emerald-500/90 to-teal-600", "from-stone-600 to-emerald-900"],
  ["from-emerald-500 to-teal-500", "from-stone-600 to-emerald-800"],
  ["from-amber-500/90 to-orange-600", "from-amber-700 to-orange-900"],
  ["from-amber-500 to-orange-500", "from-amber-600 to-amber-800"],
  ["from-red-500/90 to-rose-600", "from-orange-800 to-stone-900"],
  ["from-red-500 to-rose-500", "from-orange-700 to-stone-800"],
  ["hover:border-fuchsia-400/50 hover:bg-fuchsia-50 hover:text-fuchsia-800", "hover:border-stone-400 hover:bg-stone-100 hover:text-stone-900"],
  ["hover:border-violet-400/50 hover:bg-violet-50 hover:text-violet-800", "hover:border-stone-400 hover:bg-stone-100 hover:text-stone-900"],
  ["border-violet-300/80 bg-violet-50", "border-stone-300 bg-stone-100"],
  ["text-violet-800", "text-stone-900"],
  ["hover:text-violet-600", "hover:text-stone-900"],
  ["text-violet-500", "text-stone-700"],
  ["text-violet-400", "text-stone-600"],
  ["text-fuchsia-500", "text-stone-600"],
  ["text-fuchsia-400", "text-stone-600"],
  ["text-indigo-400", "text-stone-600"],
  ["text-indigo-500", "text-stone-700"],
  ["border-indigo-500/40", "border-stone-400"],
  ["focus:border-indigo-500", "focus:border-stone-500"],
  ["focus:ring-indigo-500", "focus:ring-stone-500"],
  ["hover:border-indigo-500", "hover:border-stone-400"],
  ["hover:text-indigo-300", "hover:text-stone-800"],
  ["hover:text-violet-300", "hover:text-stone-800"],
  ["ring-indigo-500", "ring-stone-500"],
  ["shadow-indigo-500", "shadow-stone-500"],
  ["shadow-violet-500", "shadow-stone-600"],
  ["from-violet-500", "from-stone-600"],
  ["to-fuchsia-500", "to-stone-800"],
  ["bg-violet-600", "bg-stone-800"],
  ["bg-violet-500", "bg-stone-700"],
  ["text-violet-600", "text-stone-800"],
  ["text-violet-700", "text-stone-800"],
  ["border-violet-", "border-stone-"],
  ["ring-violet-", "ring-stone-"],
  ["bg-violet-", "bg-stone-"],
  ["hover:bg-violet-", "hover:bg-stone-"],
  ["focus:border-violet-", "focus:border-stone-"],
  ["focus:ring-violet-", "focus:ring-stone-"],
  ["text-fuchsia-300", "text-stone-700"],
  ["hover:text-fuchsia-300", "hover:text-stone-800"],
  ["border-fuchsia-", "border-stone-"],
  ["bg-fuchsia-", "bg-stone-"],
  ["from-fuchsia-", "from-stone-"],
  ["to-fuchsia-", "to-stone-"],
  ["text-purple-", "text-stone-"],
];

function walk(dir, out) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === "node_modules" || ent.name === ".next") continue;
      walk(p, out);
    } else if (/\.(tsx|ts|css)$/.test(ent.name)) out.push(p);
  }
}

const files = [];
for (const d of ["app", "lib"]) walk(path.join(root, d), files);

for (const file of files) {
  if (file.includes("beige-noir-theme.mjs")) continue;
  let s = fs.readFileSync(file, "utf8");
  const orig = s;
  for (const [a, b] of REPLACEMENTS) {
    if (a.includes("(")) {
      s = s.split(a).join(b);
    } else {
      s = s.split(a).join(b);
    }
  }
  if (s !== orig) fs.writeFileSync(file, s);
}

console.log("beige/noir theme pass:", files.length, "files scanned");
