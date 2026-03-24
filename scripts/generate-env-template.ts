import fs from 'node:fs';
import path from 'node:path';
import { loadEnv, type Plugin } from 'vite';

function getEnvFiles(rootDir: string, mode: string) {
  return [
    '.env',
    '.env.local',
    `.env.${mode}`,
    `.env.${mode}.local`
  ].map((file) => path.join(rootDir, file));
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

function writeTemplate(rootDir: string, mode: string) {
  const env = pickAppEnv(loadEnv(mode, rootDir, ''));
  const outputPath = path.join(rootDir, 'public', 'config', 'env-config.template.json');
  const lines = Object.keys(env).map((key) => `  "${key}": "\${${key}}"`);

  const content = lines.length ? `{\n${lines.join(',\n')}\n}\n` : '{}\n';

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, content, 'utf8');
}

function writeDevRuntimeEnv(rootDir: string, mode: string) {
  const env = pickAppEnv(loadEnv(mode, rootDir, ''));
  const outputPath = path.join(rootDir, 'public', 'config', 'env-config.json');
  writeJsonFile(outputPath, env);
}

export default function generateEnvTemplate(mode: string): Plugin {
  return {
    name: 'generate-env-template',
    buildStart() {
      writeTemplate(process.cwd(), mode);
    },
    configureServer(server) {
      const rootDir = server.config.root;
      writeDevRuntimeEnv(rootDir, mode);

      const envFiles = getEnvFiles(rootDir, mode);
      server.watcher.add(envFiles);
      server.watcher.on('change', (changedFile) => {
        if (!envFiles.includes(changedFile)) {
          return;
        }

        writeDevRuntimeEnv(rootDir, mode);
        server.ws.send({ type: 'full-reload' });
      });
    }
  };
}
