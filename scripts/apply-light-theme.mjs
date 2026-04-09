import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const reps = [
  [/text-zinc-100\b/g, "text-slate-800"],
  [/text-zinc-200\b/g, "text-slate-700"],
  [/text-zinc-300\b/g, "text-slate-600"],
  [/text-zinc-400\b/g, "text-slate-500"],
  [/text-zinc-50\b/g, "text-slate-900"],
  [/text-zinc-500\b/g, "text-slate-500"],
  [/text-zinc-600\b/g, "text-slate-600"],
  [/bg-\[#12121a\]/g, "bg-white"],
  [/bg-\[#0c0c10\]\/50/g, "bg-slate-50/80"],
  [/bg-\[#0c0c10\]/g, "bg-slate-50"],
  [/bg-\[#08080c\]\/75/g, "bg-white/85"],
  [/bg-\[#0c0c12\]\/80/g, "bg-slate-50"],
  [/border-white\/\[0\.08\]/g, "border-slate-200/90"],
  [/border-white\/\[0\.06\]/g, "border-slate-100"],
  [/shadow-inner shadow-black\/20/g, "shadow-inner shadow-slate-200/40"],
  [/border-t border-white\/\[0\.06\]/g, "border-t border-slate-100"],
  [/border-b border-white\/\[0\.06\]/g, "border-b border-slate-100"],
  [/border border-dashed border-white\/\[0\.08\]/g, "border border-dashed border-slate-200/90"],
];

function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === "node_modules" || ent.name === ".next") continue;
      walk(p);
    } else if (/\.(tsx|ts|css)$/.test(ent.name)) {
      let s = fs.readFileSync(p, "utf8");
      const o = s;
      for (const [a, b] of reps) s = s.replace(a, b);
      if (s !== o) {
        fs.writeFileSync(p, s);
        console.log("updated", path.relative(root, p));
      }
    }
  }
}

for (const d of ["app", "lib"]) {
  const full = path.join(root, d);
  if (fs.existsSync(full)) walk(full);
}
