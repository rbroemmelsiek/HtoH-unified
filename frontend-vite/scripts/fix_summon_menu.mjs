import fs from 'fs';

const p = 'd:\\dev\\HtoH-Unified\\frontend\\src\\App.tsx';
let s = fs.readFileSync(p,'utf8');

// Ensure menu array includes Academy + Kindle items
if (!s.includes("label: 'Ai Academy'")) {
  // Insert after the Graph item in the Summon Widget array
  s = s.replace(
    /\{ icon: BarChart3, label: 'Graph', tool: 'Graph Widget' \}/,
    "{ icon: BarChart3, label: 'Graph', tool: 'Graph Widget' },\n            { icon: BookOpen, label: 'Ai Academy', tool: 'Ai Academy' },\n            { icon: BookText, label: 'Kindle PDF', tool: 'Kindle PDF' }"
  );
}

fs.writeFileSync(p,s,'utf8');
console.log('Patched App.tsx summon menu to include Ai Academy + Kindle PDF');
