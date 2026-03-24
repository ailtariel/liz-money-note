import fs from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';

function parseEnvFile(content: string): Record<string, string> {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .reduce<Record<string, string>>((acc, line) => {
      const separatorIndex = line.indexOf('=');

      if (separatorIndex === -1) {
        return acc;
      }

      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim();
      acc[key] = value;
      return acc;
    }, {});
}

function resolveSourceEnvPath(rootDir: string) {
  const candidates = [
    '.env.example',
    '.env',
    '.env.production',
    '.env.development'
  ];

  for (const candidate of candidates) {
    const fullPath = path.join(rootDir, candidate);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }

  return undefined;
}

function writeTemplate(rootDir: string) {
  const sourcePath = resolveSourceEnvPath(rootDir);
  const outputPath = path.join(
    rootDir,
    'public',
    'config',
    'env-config.template.json'
  );

  if (!sourcePath) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, '{}\n', 'utf8');
    return;
  }

  const env = parseEnvFile(fs.readFileSync(sourcePath, 'utf8'));
  const lines = Object.keys(env)
    .filter((key) => key.startsWith('APP_'))
    .sort()
    .map((key) => `  "${key}": "\${${key}}"`);

  const content = lines.length ? `{\n${lines.join(',\n')}\n}\n` : '{}\n';

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, content, 'utf8');
}

export default function generateEnvTemplate(): Plugin {
  return {
    name: 'generate-env-template',
    apply: 'build',
    buildStart() {
      writeTemplate(process.cwd());
    },
    configureServer() {
      writeTemplate(process.cwd());
    }
  };
}
