import fs from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';

function getEnvFiles(rootDir: string) {
  return ['.env', '.env.production'].map((file) => path.join(rootDir, file));
}

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

function loadSelectedEnv(rootDir: string) {
  return getEnvFiles(rootDir).reduce<Record<string, string>>((acc, filePath) => {
    if (!fs.existsSync(filePath)) {
      return acc;
    }

    return {
      ...acc,
      ...parseEnvFile(fs.readFileSync(filePath, 'utf8'))
    };
  }, {});
}

function pickAppEnv(env: Record<string, string>) {
  return Object.keys(env)
    .filter((key) => key.startsWith('APP_'))
    .sort()
    .reduce<Record<string, string>>((acc, key) => {
      acc[key] = env[key];
      return acc;
    }, {});
}

function writeJsonFile(filePath: string, payload: Record<string, string>) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

function writeTemplate(rootDir: string) {
  const env = pickAppEnv(loadSelectedEnv(rootDir));
  const outputPath = path.join(rootDir, 'public', 'config', 'env-config.template.json');
  const lines = Object.keys(env).map((key) => `  "${key}": "\${${key}}"`);

  const content = lines.length ? `{\n${lines.join(',\n')}\n}\n` : '{}\n';

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, content, 'utf8');
}

function writeDevRuntimeEnv(rootDir: string) {
  const env = pickAppEnv(loadSelectedEnv(rootDir));
  const outputPath = path.join(rootDir, 'public', 'config', 'env-config.json');
  writeJsonFile(outputPath, env);
}

export default function generateEnvTemplate(): Plugin {
  return {
    name: 'generate-env-template',
    buildStart() {
      writeTemplate(process.cwd());
    },
    configureServer(server) {
      const rootDir = server.config.root;
      writeDevRuntimeEnv(rootDir);

      const envFiles = getEnvFiles(rootDir);
      server.watcher.add(envFiles);
      server.watcher.on('change', (changedFile) => {
        if (!envFiles.includes(changedFile)) {
          return;
        }

        writeDevRuntimeEnv(rootDir);
        server.ws.send({ type: 'full-reload' });
      });
    }
  };
}
