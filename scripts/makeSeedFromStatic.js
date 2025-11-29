#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// simple argv parsing
const argv = {};
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (a === '--apply') argv.apply = true;
  if (a === '--dry') argv.dry = true;
}

const staticPath = path.join(__dirname, '..', 'frontend', 'services', 'staticStations.ts');
const seedPath = path.join(__dirname, '..', 'backend', 'seedStations.js');
const outPath = path.join(__dirname, '..', 'backend', 'seedStations.js');

function normalizeKey(s) {
  return (s || '').replace(/^\d+\.?\s*/, '').replace(/\s*\(.+\)\s*$/, '').trim().toLowerCase();
}


if (!fs.existsSync(staticPath)) {
  console.error('staticStations.ts not found at', staticPath);
  process.exit(1);
}

const statics = fs.readFileSync(staticPath, 'utf8');

// Extract entries as key and object block
const kvRegex = /\"([^\"]+)\"\s*:\s*\{([\s\S]*?)\},?/gm;
let m;
const entries = [];
while ((m = kvRegex.exec(statics))) {
  const key = m[1];
  const block = m[2];
  // Find id, address, lat, lng, type, organizer, contactNumber, remarks
  const idMatch = block.match(/id:\s*'([^']+)'/);
  const en_nameMatch = block.match(/en_name:\s*'([^']+)'/);
  const addrMatch = block.match(/address:\s*"([^"]+)"/);
  const latMatch = block.match(/lat:\s*([0-9.\-]+)/);
  const lngMatch = block.match(/lng:\s*([0-9.\-]+)/);
  const typeMatch = block.match(/type:\s*'([^']+)'/);
  const orgMatch = block.match(/organizer:\s*'([^']+)'/);
  const contactMatch = block.match(/contactNumber:\s*"([^\"]*)"/);
  const mapMatch = block.match(/mapLink:\s*"([^\"]*)"/);
  const remarksMatch = block.match(/remarks:\s*'([^']+)'/);
  entries.push({
    key,
    id: idMatch ? idMatch[1] : undefined,
    en_name: en_nameMatch ? en_nameMatch[1] : '',
    address: addrMatch ? addrMatch[1] : '',
    lat: latMatch ? parseFloat(latMatch[1]) : undefined,
    lng: lngMatch ? parseFloat(lngMatch[1]) : undefined,
    type: typeMatch ? typeMatch[1] : 'SHELTER',
    organizer: orgMatch ? orgMatch[1] : 'COMMUNITY',
    contactNumber: contactMatch ? contactMatch[1] : '',
    mapLink: mapMatch ? mapMatch[1] : '',
    remarks: remarksMatch ? remarksMatch[1] : ''
  });
}

// Build station objects
const stations = entries.map((e) => {
  return {
    id: e.id || '',
    name: e.key,
    ...(e.en_name ? { name_en: e.en_name } : {}),
    address: e.address || '',
    location: { lat: e.lat || 0, lng: e.lng || 0 },
    type: e.type || 'SHELTER',
    status: 'NO_DATA',
    organizer: e.organizer || 'COMMUNITY',
    offerings: [],
    needs: [],
    ...(e.contactNumber ? { contactNumber: e.contactNumber } : {}),
    ...(e.mapLink ? { mapLink: e.mapLink } : {}),
    lastUpdated: Date.now(),
    upvotes: 0,
    downvotes: 0,
    ...(e.remarks ? { remarks: e.remarks } : {})
  };
});

// build seed content
function buildSeedJS(stationsArray) {
  let seed = "const admin = require('firebase-admin');\n\n";
  seed += "const serviceAccount = require('./serviceAccountKey.json');\n\n";
  seed += "admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });\n\n";
  seed += "const db = admin.firestore();\n\n";
  seed += "async function seedDatabase() {\n";
  seed += "  console.log('Seeding canonical stations...');\n";
  seed += "  const batch = db.batch();\n";
  seed += "  const stationsData = ";
  seed += JSON.stringify(stationsArray, null, 2);
  seed += ";\n  stationsData.forEach(station => { const ref = db.collection('stations').doc(station.id); batch.set(ref, station); });\n  await batch.commit();\n  console.log('Done.');\n}\n\nseedDatabase().catch(console.error);\n";
  return seed;
}

const seedJS = buildSeedJS(stations);
fs.writeFileSync(outPath, seedJS, 'utf8');
console.log('Wrote updated seed to', outPath);

if (argv.apply) {
  const backup = seedPath + '.bak';
  if (fs.existsSync(seedPath)) {
    fs.copyFileSync(seedPath, backup);
  }
  fs.writeFileSync(seedPath, seedJS, 'utf8');
  if (fs.existsSync(backup)) {
    console.log('Applied updated seed to', seedPath, 'backup saved to', backup);
  } else {
    console.log('Applied updated seed to', seedPath);
  }
}

if (argv.dry) {
  console.log('Dry run complete, no apply performed. Use --apply to replace backend/seed.js');
}

process.exit(0);
