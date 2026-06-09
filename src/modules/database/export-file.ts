import { Capacitor, registerPlugin } from '@capacitor/core';

type DataExportPlugin = {
  saveJson: (params: { fileName: string; content: string }) => Promise<void>;
};

const DataExport = registerPlugin<DataExportPlugin>('DataExport');

function downloadJsonInBrowser(fileName: string, content: string) {
  const blob = new Blob([content], {
    type: 'application/json'
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export async function saveDatabaseJsonFile(fileName: string, content: string) {
  if (Capacitor.getPlatform() === 'android') {
    await DataExport.saveJson({
      fileName,
      content
    });
    return;
  }

  downloadJsonInBrowser(fileName, content);
}

