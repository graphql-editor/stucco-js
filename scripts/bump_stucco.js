import fetch from 'node-fetch';
import fs from 'fs';
fetch(
  "https://stucco-release.fra1.cdn.digitaloceanspaces.com/latest/version"
)
.then(r => r.text())
.then(b => fs.writeFileSync("src/stucco/version.ts", `export const version = '${b.trim()}';\n`));
