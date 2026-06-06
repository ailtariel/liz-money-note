import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const parserModuleUrl = pathToFileURL(
  path.join(rootDir, 'src/modules/import/text-import.parser.ts')
).href;
const { parseTextImportFile } = await import(parserModuleUrl);

function countExpectedRows(content) {
  const lines = content.split(/\r?\n/);
  return lines
    .slice(1)
    .filter((line) => {
      const trimmed = line.trim();
      return trimmed && !trimmed.includes('合计');
    }).length;
}

const mockDir = path.join(rootDir, '.mockdata');
const files = (await readdir(mockDir)).filter((fileName) =>
  /\.(csv|txt)$/i.test(fileName)
);

if (files.length === 0) {
  throw new Error('No .csv or .txt files found in .mockdata.');
}

let importedRows = 0;

for (const fileName of files) {
  const content = await readFile(path.join(mockDir, fileName), 'utf8');
  const parsed = parseTextImportFile({
    fileName,
    content
  });
  const expectedRows = countExpectedRows(content);

  if (parsed.issues.length > 0) {
    throw new Error(
      `${fileName} has parse issues: ${parsed.issues
        .map((issue) => `${issue.rowNumber}: ${issue.message}`)
        .join('; ')}`
    );
  }

  if (parsed.transactions.length !== expectedRows) {
    throw new Error(
      `${fileName} parsed ${parsed.transactions.length} rows, expected ${expectedRows}.`
    );
  }

  importedRows += parsed.transactions.length;
  console.log(
    `${fileName}: ${parsed.bookName}, ${parsed.currency}, ${parsed.transactions.length} rows`
  );
}

console.log(`Parsed ${files.length} files and ${importedRows} rows.`);
