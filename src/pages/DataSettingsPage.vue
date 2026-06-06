<script setup lang="ts">
import { ref } from 'vue';
import { exportDatabaseJson, importDatabaseJson } from '@/modules/database/backup';
import { importTextFiles } from '@/modules/import/import.service';
import type { ImportBatchResult } from '@/modules/import/import.types';
import { currencies, type CurrencyCode } from '@/modules/shared/money';

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
    message.value = '数据已导出。';
  } catch (err) {
    error.value = err instanceof Error ? err.message : '导出失败。';
  }
}

async function restoreData() {
  error.value = '';
  message.value = '';

  if (!window.confirm('恢复会替换当前数据，是否继续？')) {
    return;
  }

  try {
    await importDatabaseJson(importText.value);
    importText.value = '';
    message.value = '数据已恢复，请刷新当前页面数据。';
  } catch (err) {
    error.value = err instanceof Error ? err.message : '恢复失败。';
  }
}

function readFileAsText(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error ?? new Error('读取文件失败。'));
    reader.readAsText(file);
  });
}

async function importSelectedFiles() {
  error.value = '';
  message.value = '';
  importResult.value = null;

  if (selectedFiles.value.length === 0) {
    error.value = '请选择 CSV 或 TXT 文件。';
    return;
  }

  if (!window.confirm('重复导入同一文件会产生重复流水，是否继续？')) {
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
    message.value = `导入完成：${importResult.value.importedRows} 条流水。`;
    selectedFiles.value = [];
  } catch (err) {
    error.value = err instanceof Error ? err.message : '导入失败。';
  }
}
</script>

<template>
  <div class="d-flex flex-column ga-6">
    <div>
      <h1 class="text-h5">数据</h1>
      <div class="text-body-2 text-medium-emphasis">导出或恢复本地 SQLite 数据</div>
    </div>

    <v-alert v-if="message" type="success" variant="tonal">{{ message }}</v-alert>
    <v-alert v-if="error" type="error" variant="tonal">{{ error }}</v-alert>

    <div>
      <v-btn color="primary" @click="exportData">导出数据</v-btn>
    </div>

    <v-textarea
      v-model="importText"
      label="粘贴导出的 JSON"
      rows="10"
      variant="outlined"
    />
    <v-btn :disabled="!importText" color="error" variant="tonal" @click="restoreData">
      恢复数据
    </v-btn>

    <v-divider />

    <div>
      <h2 class="text-h6">导入 CSV / TXT</h2>
      <div class="text-body-2 text-medium-emphasis">
        每个文件会作为一个账本导入，分类会转换为 Tag。
      </div>
    </div>

    <div class="d-flex flex-wrap ga-3 align-start">
      <v-file-input
        v-model="selectedFiles"
        accept=".csv,.txt,text/csv,text/plain"
        label="选择文件"
        multiple
        max-width="420"
        variant="outlined"
      />
      <v-select
        v-model="importCurrency"
        :items="[
          { title: '自动推断', value: 'auto' },
          ...currencies.map((currency) => ({ title: currency, value: currency }))
        ]"
        label="币种"
        max-width="180"
        variant="outlined"
      />
      <v-btn
        :disabled="selectedFiles.length === 0"
        color="primary"
        @click="importSelectedFiles"
      >
        导入
      </v-btn>
    </div>

    <v-table v-if="importResult">
      <thead>
        <tr>
          <th>文件</th>
          <th>账本</th>
          <th>账户</th>
          <th>币种</th>
          <th>导入</th>
          <th>跳过</th>
          <th>问题</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="file in importResult.files" :key="file.fileName">
          <td>{{ file.fileName }}</td>
          <td>{{ file.bookName }}</td>
          <td>{{ file.accountName }}</td>
          <td>{{ file.currency }}</td>
          <td>{{ file.importedRows }}</td>
          <td>{{ file.skippedRows }}</td>
          <td>{{ file.issueCount }}</td>
        </tr>
      </tbody>
    </v-table>

    <v-alert
      v-if="importResult?.issueCount"
      type="warning"
      variant="tonal"
    >
      有 {{ importResult.issueCount }} 行未导入，请检查文件格式或金额/日期内容。
    </v-alert>
  </div>
</template>
