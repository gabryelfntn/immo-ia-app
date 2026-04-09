import fs from "fs";
import path from "path";

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory() && e.name !== "node_modules" && e.name !== ".next")
      walk(p, acc);
    else if (e.isFile() && e.name.endsWith(".tsx")) acc.push(p);
  }
  return acc;
}

const skip = /dashboard-sidebar\.tsx$/;
const reps = [
  [/border-white\/\[0\.08\]/g, "border-gray-200"],
  [/border-white\/\[0\.06\]/g, "border-gray-100"],
  [/border-white\/\[0\.10\]/g, "border-gray-200"],
  [/border-white\/\[0\.1\]/g, "border-gray-200"],
  [/bg-\[#12121a\]\/80/g, "bg-white"],
  [/bg-\[#12121a\]\/50/g, "bg-slate-50"],
  [/bg-\[#12121a\]\/40/g, "bg-slate-50"],
  [/bg-\[#12121a\]/g, "bg-white"],
  [/bg-\[#0a0a0f\]\/85/g, "bg-white/95"],
  [/bg-\[#0a0a0f\]\/80/g, "bg-slate-50"],
  [/bg-\[#0a0a0f\]\/50/g, "bg-slate-50/90"],
  [/bg-\[#0a0a0f\]/g, "bg-slate-50"],
  [/from-\[#1a1a24\] to-\[#0a0a0f\]/g, "from-slate-100 to-slate-200"],
  [/border-dashed border-white\/10/g, "border-dashed border-gray-200"],
  [/border-white\/10/g, "border-gray-200"],
  [/border-white\/15/g, "border-gray-300"],
  [/border-white\/20/g, "border-gray-300"],
  [/bg-black\/20/g, "bg-slate-50"],
  [/bg-black\/25/g, "bg-slate-100"],
  [
    /focus-visible:ring-offset-\[#0a0a0f\]/g,
    "focus-visible:ring-offset-white",
  ],
];

let n = 0;
for (const f of walk("app")) {
  if (skip.test(f)) continue;
  let s = fs.readFileSync(f, "utf8");
  const orig = s;
  for (const [a, b] of reps) s = s.replace(a, b);
  if (s !== orig) {
    fs.writeFileSync(f, s);
    n++;
  }
}
console.log("updated", n, "files");
