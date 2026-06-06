<script setup lang="ts">
import { ref } from 'vue';
import { exportDatabaseJson, importDatabaseJson } from '@/modules/database/backup';

const message = ref('');
const error = ref('');
const importText = ref('');

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
  </div>
</template>
