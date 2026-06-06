<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from '@/i18n';
import { exportDatabaseJson, importDatabaseJson } from '@/modules/database/backup';
import { importTextFiles } from '@/modules/import/import.service';
import type { ImportBatchResult } from '@/modules/import/import.types';
import { currencies, type CurrencyCode } from '@/modules/shared/money';
import MobilePage from '@/components/shared/MobilePage.vue';

const { t } = useI18n();
const message = ref('');
const error = ref('');
const importText = ref('');
const selectedFiles = ref<File[]>([]);
const importCurrency = ref<CurrencyCode | 'auto'>('auto');
const importResult = ref<ImportBatchResult | null>(null);

async function exportData() {
  error.value = '';
  message.value = '';
  try {
    const data = await exportDatabaseJson();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `liz-money-note-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    message.value = t('data.exported');
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('data.exportFailed');
  }
}

async function restoreData() {
  error.value = '';
  message.value = '';

  if (!window.confirm(t('data.restoreConfirm'))) {
    return;
  }

  try {
    await importDatabaseJson(importText.value);
    importText.value = '';
    message.value = t('data.restored');
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('data.restoreFailed');
  }
}

function readFileAsText(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error ?? new Error(t('data.readFileFailed')));
    reader.readAsText(file);
  });
}

async function importSelectedFiles() {
  error.value = '';
  message.value = '';
  importResult.value = null;

  if (selectedFiles.value.length === 0) {
    error.value = t('data.chooseFile');
    return;
  }

  if (!window.confirm(t('data.duplicateImportConfirm'))) {
    return;
  }

  try {
    const files = await Promise.all(
      selectedFiles.value.map(async (file) => ({
        fileName: file.name,
        content: await readFileAsText(file),
        currency: importCurrency.value === 'auto' ? undefined : importCurrency.value
      }))
    );

    importResult.value = await importTextFiles(files);
    message.value = t('data.importDone', { count: importResult.value.importedRows });
    selectedFiles.value = [];
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('data.importFailed');
  }
}
</script>

<template>
  <MobilePage :title="t('nav.data')" show-back>
    <div class="d-flex flex-column ga-4">
      <div class="text-body-2 text-medium-emphasis">{{ t('data.subtitle') }}</div>
      <v-alert v-if="message" type="success" variant="tonal">{{ message }}</v-alert>
      <v-alert v-if="error" type="error" variant="tonal">{{ error }}</v-alert>

      <v-card class="soft-card pa-4">
        <v-btn block color="primary" prepend-icon="$download" @click="exportData">
          {{ t('more.export') }}
        </v-btn>
      </v-card>

      <v-card class="soft-card pa-4">
        <v-textarea v-model="importText" :label="t('data.pasteJson')" rows="8" />
        <v-btn :disabled="!importText" block color="error" variant="tonal" @click="restoreData">
          {{ t('more.restore') }}
        </v-btn>
      </v-card>

      <v-card class="soft-card pa-4">
        <div class="text-subtitle-1 font-weight-bold">{{ t('data.importText') }}</div>
        <div class="text-body-2 text-medium-emphasis mb-4">{{ t('data.importHint') }}</div>
        <v-file-input
          v-model="selectedFiles"
          accept=".csv,.txt,text/csv,text/plain"
          :label="t('data.chooseFiles')"
          multiple
        />
        <v-select
          v-model="importCurrency"
          :items="[
            { title: t('data.autoCurrency'), value: 'auto' },
            ...currencies.map((currency) => ({ title: currency, value: currency }))
          ]"
          :label="t('data.currency')"
        />
        <v-btn :disabled="selectedFiles.length === 0" block color="primary" prepend-icon="$upload" @click="importSelectedFiles">
          {{ t('more.import') }}
        </v-btn>
      </v-card>

      <v-card v-if="importResult" class="soft-card pa-4">
        <v-list class="bg-transparent">
          <v-list-item v-for="file in importResult.files" :key="file.fileName">
            <v-list-item-title>{{ file.fileName }}</v-list-item-title>
            <v-list-item-subtitle>
              {{ file.bookName }} · {{ file.currency }} · {{ t('data.imported') }} {{ file.importedRows }}
            </v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </v-card>

      <v-alert v-if="importResult?.issueCount" type="warning" variant="tonal">
        {{ t('data.issueWarning', { count: importResult.issueCount }) }}
      </v-alert>
    </div>
  </MobilePage>
</template>
