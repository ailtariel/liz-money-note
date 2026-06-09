import { registerPlugin } from '@capacitor/core';
import type { ImportTextFile } from '@/modules/import/import.types';

type DataImportPlugin = {
  pickTextFiles: () => Promise<{ files: ImportTextFile[] }>;
};

const DataImport = registerPlugin<DataImportPlugin>('DataImport');

export async function pickNativeTextImportFiles() {
  const result = await DataImport.pickTextFiles();
  return result.files;
}
