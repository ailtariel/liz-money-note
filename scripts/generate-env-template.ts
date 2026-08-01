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
  const fileEnv = getEnvFiles(rootDir).reduce<Record<string, string>>(
    (acc, filePath) => {
      if (!fs.existsSync(filePath)) {
        return acc;
      }

      return {
        ...acc,
        ...parseEnvFile(fs.readFileSync(filePath, 'utf8'))
      };
    },
    {}
  );

  const processEnv = Object.entries(process.env).reduce<Record<string, string>>(
    (acc, [key, value]) => {
      if (typeof value === 'string') {
        acc[key] = value;
      }

      return acc;
    },
    {}
  );

  return {
    ...fileEnv,
    ...processEnv
  };
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

function writeRuntimeEnv(rootDir: string) {
  const env = pickAppEnv(loadSelectedEnv(rootDir));
  const outputPath = path.join(rootDir, 'public', 'config', 'env-config.json');
  writeJsonFile(outputPath, env);
}

export default function generateEnvTemplate(): Plugin {
  return {
    name: 'generate-env-template',
    buildStart() {
      const rootDir = process.cwd();
      writeTemplate(rootDir);
      writeRuntimeEnv(rootDir);
    },
    configureServer(server) {
      const rootDir = server.config.root;
      writeRuntimeEnv(rootDir);

      const envFiles = getEnvFiles(rootDir);
      server.watcher.add(envFiles);
      server.watcher.on('change', (changedFile) => {
        if (!envFiles.includes(changedFile)) {
          return;
        }

        writeRuntimeEnv(rootDir);
        server.ws.send({ type: 'full-reload' });
      });
    }
  };
}
