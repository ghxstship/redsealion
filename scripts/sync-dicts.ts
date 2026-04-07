import * as fs from 'fs';
import * as path from 'path';

const dictDir = path.join(process.cwd(), 'src/lib/i18n/dictionaries');
const locales = ['de-DE', 'en-AU', 'en-GB', 'es-ES', 'es-MX'];
const enUs = JSON.parse(fs.readFileSync(path.join(dictDir, 'en-US.json'), 'utf8'));

for (const loc of locales) {
  const p = path.join(dictDir, `${loc}.json`);
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  data.dashboard = { ...enUs.dashboard };
  data.myTasks = { ...enUs.myTasks };
  data.mySchedule = { ...enUs.mySchedule };
  data.myInbox = { ...enUs.myInbox };
  data.myDocuments = { ...enUs.myDocuments };
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n');
  console.log(`Updated ${loc} with dashboard namespace`);
}
