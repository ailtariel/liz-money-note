<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useBookStore } from '@/modules/books/book.store';

const store = useBookStore();
const error = ref('');
const editingId = ref<number | null>(null);
const form = reactive({
  name: '',
  description: ''
});

function resetForm() {
  editingId.value = null;
  form.name = '';
  form.description = '';
}

function editBook(bookId: number) {
  const book = store.books.find((item) => item.id === bookId);
  if (!book) {
    return;
  }

  editingId.value = book.id;
  form.name = book.name;
  form.description = book.description ?? '';
}

async function submit() {
  error.value = '';
  try {
    const input = {
      name: form.name,
      description: form.description || null
    };

    if (editingId.value) {
      await store.update(editingId.value, input);
    } else {
      await store.create(input);
    }

    resetForm();
  } catch (err) {
    error.value = err instanceof Error ? err.message : '保存账本失败。';
  }
}

async function archive(bookId: number) {
  error.value = '';
  try {
    await store.archive(bookId);
  } catch (err) {
    error.value = err instanceof Error ? err.message : '归档账本失败。';
  }
}

onMounted(() => store.load());
</script>

<template>
  <div class="d-flex flex-column ga-6">
    <div class="d-flex align-center">
      <div>
        <h1 class="text-h5">账本</h1>
        <div class="text-body-2 text-medium-emphasis">管理流水归属的基础分类</div>
      </div>
    </div>

    <v-alert v-if="error" type="error" variant="tonal">{{ error }}</v-alert>

    <v-form class="d-flex flex-wrap ga-3 align-start" @submit.prevent="submit">
      <v-text-field
        v-model="form.name"
        label="名称"
        max-width="260"
        required
        variant="outlined"
      />
      <v-text-field
        v-model="form.description"
        label="说明"
        max-width="360"
        variant="outlined"
      />
      <v-btn color="primary" type="submit">
        {{ editingId ? '保存' : '新增' }}
      </v-btn>
      <v-btn v-if="editingId" variant="text" @click="resetForm">取消</v-btn>
    </v-form>

    <v-table>
      <thead>
        <tr>
          <th>名称</th>
          <th>说明</th>
          <th>状态</th>
          <th class="text-right">操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="book in store.books" :key="book.id">
          <td>{{ book.name }}</td>
          <td>{{ book.description || '-' }}</td>
          <td>{{ book.isArchived ? '已归档' : '启用' }}</td>
          <td class="text-right">
            <v-btn size="small" variant="text" @click="editBook(book.id)">编辑</v-btn>
            <v-btn
              :disabled="book.isArchived"
              size="small"
              variant="text"
              @click="archive(book.id)"
            >
              归档
            </v-btn>
          </td>
        </tr>
      </tbody>
    </v-table>
  </div>
</template>
