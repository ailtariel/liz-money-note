<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useI18n } from '@/i18n';
import AppBarVue from '@/components/shared/app-bar.vue';
import { exportDatabaseJson, importDatabaseJson } from '@/modules/database/backup';
import { importTextFiles } from '@/modules/import/import.service';
import type { ImportBatchResult } from '@/modules/import/import.types';
import type { CurrencyCode } from '@/modules/shared/money';
import { useCurrencyStore } from '@/modules/currency/currency.store';
import { useSnackQueueStore } from '@/modules/snack-queue/snack-queue.store';

const { t } = useI18n();
const currencyStore = useCurrencyStore();
const snackQueueStore = useSnackQueueStore();
const validationError = ref('');
const importText = ref('');
const selectedFiles = ref<File[]>([]);
const importCurrency = ref<CurrencyCode | 'auto'>('auto');
const importResult = ref<ImportBatchResult | null>(null);

async function exportData() {
  validationError.value = '';
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
    snackQueueStore.success(t('data.exported'));
  } catch (err) {
    snackQueueStore.error(err instanceof Error ? err.message : t('data.exportFailed'));
  }
}

async function restoreData() {
  validationError.value = '';

  if (!window.confirm(t('data.restoreConfirm'))) {
    return;
  }

  try {
    await importDatabaseJson(importText.value);
    importText.value = '';
    snackQueueStore.success(t('data.restored'));
  } catch (err) {
    snackQueueStore.error(err instanceof Error ? err.message : t('data.restoreFailed'));
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
  validationError.value = '';
  importResult.value = null;

  if (selectedFiles.value.length === 0) {
    validationError.value = t('data.chooseFile');
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
    snackQueueStore.success(
      t('data.importDone', {
        count: importResult.value.importedRows
      })
    );
    selectedFiles.value = [];
  } catch (err) {
    snackQueueStore.error(err instanceof Error ? err.message : t('data.importFailed'));
  }
}

onMounted(async () => {
  try {
    await currencyStore.load();
  } catch (err) {
    snackQueueStore.error(
      err instanceof Error ? err.message : t('settings.defaultCurrency.loadFailed')
    );
  }
});
</script>

<template>
  <AppBarVue />

  <v-main>
    <v-container class="pa-4">
      <div class="d-flex flex-column ga-4">
        <div class="text-body-medium text-medium-emphasis">{{ t('data.subtitle') }}</div>
        <v-alert v-if="validationError" type="error" variant="tonal">
          {{ validationError }}
        </v-alert>

        <v-row>
          <v-col cols="12" sm="6">
            <v-card class="soft-card pa-4 h-100">
              <div class="text-title-medium font-weight-bold">
                {{ t('more.import') }}
              </div>
              <div class="text-body-medium text-medium-emphasis mb-4">
                {{ t('data.importHint') }}
              </div>
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
                  ...currencyStore.currencies.map((currency) => ({
                    title: currency,
                    value: currency
                  }))
                ]"
                :label="t('data.currency')"
              />
              <v-btn
                :disabled="selectedFiles.length === 0"
                block
                color="primary"
                prepend-icon="$upload"
                @click="importSelectedFiles"
              >
                {{ t('more.import') }}
              </v-btn>

              <v-divider class="my-4" />

              <v-textarea v-model="importText" :label="t('data.pasteJson')" rows="8" />
              <v-btn
                :disabled="!importText"
                block
                color="error"
                variant="tonal"
                @click="restoreData"
              >
                {{ t('data.importJson') }}
              </v-btn>
            </v-card>
          </v-col>

          <v-col cols="12" sm="6">
            <v-card class="soft-card pa-4 h-100">
              <div class="text-title-medium font-weight-bold">
                {{ t('more.export') }}
              </div>
              <div class="text-body-medium text-medium-emphasis mb-4">
                {{ t('data.exportHint') }}
              </div>
              <v-btn block color="primary" prepend-icon="$download" @click="exportData">
                {{ t('more.export') }}
              </v-btn>
            </v-card>
          </v-col>
        </v-row>

        <v-card v-if="importResult" class="soft-card pa-4">
          <v-list>
            <v-list-item v-for="file in importResult.files" :key="file.fileName">
              <v-list-item-title>{{ file.fileName }}</v-list-item-title>
              <v-list-item-subtitle>
                {{ file.bookName }} &middot; {{ file.currency }} &middot;
                {{ t('data.imported') }} {{ file.importedRows }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card>

        <v-alert v-if="importResult?.issueCount" type="warning" variant="tonal">
          {{ t('data.issueWarning', { count: importResult.issueCount }) }}
        </v-alert>
      </div>
    </v-container>
  </v-main>
</template>
