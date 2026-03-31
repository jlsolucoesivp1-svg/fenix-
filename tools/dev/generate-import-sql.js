const fs = require('fs');
const path = require('path');

const [, , inputPath, outputPath] = process.argv;

if (!inputPath || !outputPath) {
  console.error('Usage: node tools/dev/generate-import-sql.js <input-json> <output-sql>');
  process.exit(1);
}

const backup = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const payload = backup?.data && typeof backup.data === 'object' ? backup.data : {};

const collectionKeys = [
  'customers',
  'serviceOrders',
  'stock',
  'sales',
  'financialTransactions',
  'users',
  'appointments',
  'quotes',
  'kits',
  'serviceOrderViews',
];

const singletonKeys = [
  'companyInfo',
  'settings',
];

const escapeLiteral = (value) => String(value).replace(/'/g, "''");
const toJsonb = (value) => `'${escapeLiteral(JSON.stringify(value))}'::jsonb`;

const buildCollectionStatements = (collection, records) =>
  records.map((record) => {
    const recordId = record?.id;
    if (!recordId) return null;

    return `INSERT INTO app_records (collection, record_id, data, updated_at)
VALUES ('${collection}', '${escapeLiteral(recordId)}', ${toJsonb(record)}, NOW())
ON CONFLICT (collection, record_id)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();`;
  }).filter(Boolean);

const buildSingletonStatements = (collection, value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return [];
  }

  return [
    `INSERT INTO app_singletons (collection, data, updated_at)
VALUES ('${collection}', ${toJsonb(value)}, NOW())
ON CONFLICT (collection)
DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();`,
  ];
};

const collectionCounts = {};
const singletonCounts = {};

const collectionStatements = collectionKeys.flatMap((key) => {
  const records = Array.isArray(payload[key]) ? payload[key] : [];
  collectionCounts[key] = records.length;
  return buildCollectionStatements(key, records);
});

const singletonStatements = singletonKeys.flatMap((key) => {
  const value = payload[key];
  singletonCounts[key] = value && typeof value === 'object' && !Array.isArray(value) ? 1 : 0;
  return buildSingletonStatements(key, value);
});

const statements = [
  'BEGIN;',
  ...collectionStatements,
  ...singletonStatements,
  'COMMIT;',
  '',
];

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, statements.join('\n'), 'utf8');
console.log(
  JSON.stringify(
    {
      output: path.resolve(outputPath),
      collections: collectionCounts,
      singletons: singletonCounts,
    },
    null,
    2
  )
);
