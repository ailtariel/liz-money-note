<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from '@/i18n';
import AppBarVue from '@/components/shared/app-bar.vue';
import ConfirmationDialog from '@/components/common/ConfirmationDialog.vue';
import { exportDatabaseJson, importDatabaseJson } from '@/modules/database/backup';
import { saveDatabaseJsonFile } from '@/modules/database/export-file';
import { pickNativeTextImportFiles } from '@/modules/database/import-file';
import {
  getImportDuplicateSummary,
  importTextFiles
} from '@/modules/import/import.service';
import type {
  ImportBatchResult,
  ImportDuplicateStrategy,
  ImportDuplicateSummary,
  ImportTextFile
} from '@/modules/import/import.types';
import type { CurrencyCode } from '@/modules/shared/money';
import { useCurrencyStore } from '@/modules/currency/currency.store';
import { useSnackQueueStore } from '@/modules/snack-queue/snack-queue.store';
import { useSystemStore } from '@/app/system.store';

const { t } = useI18n();
const currencyStore = useCurrencyStore();
const snackQueueStore = useSnackQueueStore();
const systemStore = useSystemStore();
const validationError = ref('');
const importText = ref('');
const selectedFiles = ref<File[]>([]);
const nativeSelectedFiles = ref<ImportTextFile[]>([]);
const importCurrency = ref<CurrencyCode | 'auto'>('auto');
const importResult = ref<ImportBatchResult | null>(null);
const restoreConfirmDialog = ref(false);
const duplicateConfirmDialog = ref(false);
const pendingImportFiles = ref<ImportTextFile[]>([]);
const duplicateSummary = ref<ImportDuplicateSummary | null>(null);
const activeDataOperation = ref<'text-import' | 'restore' | 'export' | null>(null);
const pendingDuplicateStrategy = ref<ImportDuplicateStrategy | null>(null);
const textImporting = computed(() => activeDataOperation.value === 'text-import');
const restoring = computed(() => activeDataOperation.value === 'restore');
const importing = computed(() => textImporting.value || restoring.value);
const exporting = computed(() => activeDataOperation.value === 'export');
const dataOperationInProgress = computed(() => activeDataOperation.value !== null);
const selectedImportFileCount = computed(() =>
  systemStore.isAndroid ? nativeSelectedFiles.value.length : selectedFiles.value.length
);

async function exportData() {
  if (dataOperationInProgress.value) {
    return;
  }

  activeDataOperation.value = 'export';
  validationError.value = '';
  try {
    const data = await exportDatabaseJson();
    const fileName = `liz-money-note-${new Date().toISOString().slice(0, 10)}.json`;
    await saveDatabaseJsonFile(fileName, JSON.stringify(data, null, 2));
    snackQueueStore.success(t('data.exported'));
  } catch (err) {
    snackQueueStore.error(err instanceof Error ? err.message : t('data.exportFailed'));
  } finally {
    activeDataOperation.value = null;
  }
}

async function restoreData() {
  if (dataOperationInProgress.value) {
    return;
  }

  validationError.value = '';
  restoreConfirmDialog.value = true;
}

async function confirmRestoreData() {
  if (dataOperationInProgress.value) {
    return;
  }

  activeDataOperation.value = 'restore';
  try {
    await importDatabaseJson(importText.value);
    importText.value = '';
    snackQueueStore.success(t('data.restored'));
  } catch (err) {
    snackQueueStore.error(err instanceof Error ? err.message : t('data.restoreFailed'));
  } finally {
    activeDataOperation.value = null;
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

async function runTextImport(
  files: ImportTextFile[],
  duplicateStrategy: ImportDuplicateStrategy
) {
  importResult.value = await importTextFiles(files, {
    duplicateStrategy
  });
  snackQueueStore.success(
    t('data.importDone', {
      count: importResult.value.importedRows
    })
  );
  selectedFiles.value = [];
  nativeSelectedFiles.value = [];
  pendingImportFiles.value = [];
  duplicateSummary.value = null;
}

function withSelectedCurrency(file: ImportTextFile): ImportTextFile {
  return {
    ...file,
    currency: importCurrency.value === 'auto' ? undefined : importCurrency.value
  };
}

async function chooseNativeImportFiles() {
  validationError.value = '';
  importResult.value = null;

  try {
    nativeSelectedFiles.value = await pickNativeTextImportFiles();
  } catch (err) {
    snackQueueStore.error(err instanceof Error ? err.message : t('data.readFileFailed'));
  }
}

async function importSelectedFiles() {
  if (dataOperationInProgress.value) {
    return;
  }

  validationError.value = '';
  importResult.value = null;

  if (selectedImportFileCount.value === 0) {
    validationError.value = t('data.chooseFile');
    return;
  }

  activeDataOperation.value = 'text-import';
  try {
    const files = systemStore.isAndroid
      ? nativeSelectedFiles.value.map(withSelectedCurrency)
      : await Promise.all(
        selectedFiles.value.map(async (file) => withSelectedCurrency({
          fileName: file.name,
          content: await readFileAsText(file)
        }))
      );
    const summary = await getImportDuplicateSummary(files);

    if (summary.duplicateRows > 0) {
      pendingImportFiles.value = files;
      duplicateSummary.value = summary;
      duplicateConfirmDialog.value = true;
      return;
    }

    await runTextImport(files, 'keep');
  } catch (err) {
    snackQueueStore.error(err instanceof Error ? err.message : t('data.importFailed'));
  } finally {
    activeDataOperation.value = null;
  }
}

async function confirmDuplicateImport(strategy: ImportDuplicateStrategy) {
  if (dataOperationInProgress.value) {
    return;
  }

  activeDataOperation.value = 'text-import';
  pendingDuplicateStrategy.value = strategy;
  try {
    await runTextImport(pendingImportFiles.value, strategy);
    duplicateConfirmDialog.value = false;
  } catch (err) {
    snackQueueStore.error(err instanceof Error ? err.message : t('data.importFailed'));
  } finally {
    activeDataOperation.value = null;
    pendingDuplicateStrategy.value = null;
  }
}

function abortDuplicateImport() {
  if (dataOperationInProgress.value) {
    return;
  }

  duplicateConfirmDialog.value = false;
  pendingImportFiles.value = [];
  duplicateSummary.value = null;
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

  <ConfirmationDialog
    v-model="restoreConfirmDialog"
    :title="t('data.restoreTitle')"
    :message="t('data.restoreConfirm')"
    :confirm-text="t('common.confirm')"
    :cancel-text="t('common.cancel')"
    confirm-color="error"
    @confirm="confirmRestoreData"
  />

  <ConfirmationDialog
    v-model="duplicateConfirmDialog"
    :title="t('data.duplicateFoundTitle')"
    persistent
  >
    <div class="d-flex flex-column ga-3">
      <div>
        {{
          t('data.duplicateFoundMessage', {
            count: duplicateSummary?.duplicateRows ?? 0
          })
        }}
      </div>
      <v-list v-if="duplicateSummary?.files.length" density="compact">
        <v-list-item v-for="file in duplicateSummary.files" :key="file.fileName">
          <v-list-item-title>{{ file.fileName }}</v-list-item-title>
          <v-list-item-subtitle>
            {{ t('data.duplicateRows', { count: file.duplicateRows }) }}
          </v-list-item-subtitle>
        </v-list-item>
      </v-list>
    </div>

    <template #actions>
      <v-btn
        color="secondary"
        variant="tonal"
        :disabled="textImporting"
        :loading="textImporting && pendingDuplicateStrategy === 'ignore'"
        @click="confirmDuplicateImport('ignore')"
      >
        {{ t('data.ignoreDuplicates') }}
      </v-btn>
      <v-btn
        color="primary"
        variant="flat"
        :disabled="textImporting"
        :loading="textImporting && pendingDuplicateStrategy === 'keep'"
        @click="confirmDuplicateImport('keep')"
      >
        {{ t('data.keepDuplicates') }}
      </v-btn>
      <v-btn :disabled="textImporting" variant="text" @click="abortDuplicateImport">
        {{ t('data.abortImport') }}
      </v-btn>
    </template>
  </ConfirmationDialog>

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
                v-if="!systemStore.isAndroid"
                v-model="selectedFiles"
                accept=".csv,.txt,text/csv,text/plain"
                :disabled="dataOperationInProgress"
                :label="t('data.chooseFiles')"
                multiple
              />
              <div v-else class="d-flex flex-column ga-2 mb-4">
                <v-btn
                  block
                  color="primary"
                  :disabled="dataOperationInProgress"
                  prepend-icon="$upload"
                  variant="tonal"
                  @click="chooseNativeImportFiles"
                >
                  {{ t('data.chooseFiles') }}
                </v-btn>
                <v-list v-if="nativeSelectedFiles.length" density="compact">
                  <v-list-item
                    v-for="file in nativeSelectedFiles"
                    :key="file.fileName"
                    :title="file.fileName"
                  />
                </v-list>
              </div>
              <v-select
                v-model="importCurrency"
                :disabled="dataOperationInProgress"
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
                :disabled="selectedImportFileCount === 0 || exporting"
                :loading="textImporting"
                block
                color="primary"
                prepend-icon="$upload"
                @click="importSelectedFiles"
              >
                {{ t('more.import') }}
              </v-btn>

              <v-divider class="my-4" />

              <v-textarea
                v-model="importText"
                :disabled="dataOperationInProgress"
                :label="t('data.pasteJson')"
                rows="8"
              />
              <v-btn
                :disabled="!importText || exporting"
                :loading="restoring"
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
              <v-btn
                block
                color="primary"
                :disabled="importing"
                prepend-icon="$download"
                :loading="exporting"
                @click="exportData"
              >
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
                <template v-if="file.duplicateRows">
                  &middot; {{ t('data.duplicateIgnored') }} {{ file.duplicateRows }}
                </template>
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
