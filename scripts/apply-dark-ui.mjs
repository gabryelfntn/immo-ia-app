import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const roots = [
  path.join(__dirname, "..", "app", "dashboard"),
  path.join(__dirname, "..", "app", "login", "page.tsx"),
  path.join(__dirname, "..", "app", "register", "page.tsx"),
  path.join(__dirname, "..", "app", "page.tsx"),
];

const REPLACEMENTS = [
  ["text-gray-900", "text-zinc-50"],
  ["text-gray-800", "text-zinc-200"],
  ["text-gray-700", "text-zinc-300"],
  ["text-gray-600", "text-zinc-400"],
  ["border-gray-200/90", "border-white/[0.07]"],
  ["border-gray-200/80", "border-white/[0.07]"],
  ["border-gray-200", "border-white/[0.08]"],
  ["border-gray-100", "border-white/[0.06]"],
  ["bg-gray-50/90", "bg-[#0c0c10]/95"],
  ["bg-gray-50/80", "bg-[#0c0c10]/90"],
  ["bg-gray-50", "bg-[#0c0c10]"],
  ["bg-gray-100", "bg-white/[0.06]"],
  ["bg-slate-50/80", "bg-white/[0.04]"],
  ["bg-slate-50", "bg-white/[0.04]"],
  ["bg-white/95", "bg-[#12121a]/92"],
  ["bg-white/90", "bg-[#12121a]/88"],
  ["bg-white/85", "bg-[#12121a]/85"],
  ["bg-white/50", "bg-white/[0.03]"],
  ["bg-white/40", "bg-white/[0.025]"],
  ["bg-white/30", "bg-white/[0.02]"],
  ["bg-white/20", "bg-white/[0.04]"],
  ["bg-white/10", "bg-white/[0.06]"],
  ["bg-white/8", "bg-white/[0.03]"],
  ["bg-white/6", "bg-white/[0.025]"],
  ["bg-white/5", "bg-white/[0.03]"],
  ["bg-white/4", "bg-white/[0.04]"],
  ["bg-white/3", "bg-white/[0.03]"],
  ["hover:bg-gray-50", "hover:bg-white/[0.04]"],
  ["hover:bg-gray-100", "hover:bg-white/[0.06]"],
  ["hover:bg-slate-50", "hover:bg-white/[0.04]"],
  ["hover:border-gray-300", "hover:border-white/12"],
  ["hover:border-violet-300", "hover:border-violet-500/35"],
  ["hover:border-violet-200", "hover:border-violet-500/25"],
  ["hover:border-fuchsia-300", "hover:border-fuchsia-500/35"],
  ["hover:border-emerald-500/35", "hover:border-emerald-400/35"],
  ["hover:bg-violet-50", "hover:bg-violet-500/10"],
  ["hover:bg-violet-50/50", "hover:bg-violet-500/8"],
  ["hover:bg-fuchsia-50", "hover:bg-fuchsia-500/10"],
  ["hover:bg-emerald-500/10", "hover:bg-emerald-500/12"],
  ["hover:text-violet-800", "hover:text-violet-200"],
  ["hover:text-violet-700", "hover:text-violet-300"],
  ["hover:text-violet-600", "hover:text-violet-300"],
  ["hover:text-fuchsia-900", "hover:text-fuchsia-200"],
  ["hover:text-fuchsia-600", "hover:text-fuchsia-300"],
  ["hover:text-emerald-800", "hover:text-emerald-200"],
  ["group-hover:text-violet-700", "group-hover:text-violet-300"],
  ["group-hover:text-fuchsia-600", "group-hover:text-fuchsia-300"],
  ["from-slate-100 to-slate-200", "from-[#1a1a24] to-[#12121a]"],
  ["from-slate-900/75 via-slate-900/25", "from-black/70 via-black/20"],
  ["from-slate-900/30 via-slate-900/10", "from-black/45 via-black/15"],
  ["from-slate-900/25 via-transparent", "from-black/40 via-transparent"],
  ["from-slate-900/20 via-slate-900/10", "from-black/35 via-black/12"],
  ["ring-offset-white", "ring-offset-[#12121a]"],
  ["border-red-200 bg-red-50", "border-red-500/25 bg-red-500/10"],
  ["text-red-800", "text-red-300"],
  ["border-amber-200 bg-amber-50", "border-amber-500/25 bg-amber-500/10"],
  ["text-amber-900", "text-amber-200"],
  ["shadow-black/40", "shadow-black/60"],
  ["text-emerald-600", "text-emerald-400"],
  ["text-rose-600", "text-rose-400"],
  ["text-zinc-900", "text-zinc-50"],
];

function walkDir(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walkDir(p, files);
    else if (e.name.endsWith(".tsx")) files.push(p);
  }
  return files;
}

function processFile(filePath) {
  let c = fs.readFileSync(filePath, "utf8");
  const original = c;
  for (const [a, b] of REPLACEMENTS) {
    c = c.split(a).join(b);
  }
  c = c.split("bg-white ").join("bg-[#12121a] ");
  c = c.split('bg-white"').join('bg-[#12121a]"');
  c = c.split("bg-white`").join("bg-[#12121a]`");
  if (c !== original) {
    fs.writeFileSync(filePath, c);
    return true;
  }
  return false;
}

const files = new Set();
for (const r of roots) {
  if (r.endsWith(".tsx")) {
    if (fs.existsSync(r)) files.add(r);
  } else {
    walkDir(r).forEach((f) => files.add(f));
  }
}

let n = 0;
for (const f of files) {
  if (processFile(f)) {
    console.log(f);
    n++;
  }
}
console.log(`Updated ${n} files.`);
