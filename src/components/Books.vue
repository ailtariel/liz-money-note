<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useI18n } from '@/i18n';
import { useBookStore } from '@/modules/books/book.store';

const { t } = useI18n();
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
    error.value = err instanceof Error ? err.message : t('book.saveFailed');
  }
}

async function archive(bookId: number) {
  error.value = '';
  try {
    await store.archive(bookId);
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('book.archiveFailed');
  }
}

onMounted(() => store.load());
</script>

<template>
  <div class="d-flex flex-column ga-4">
    <v-alert v-if="error" type="error" variant="tonal">{{ error }}</v-alert>

      <v-card class="soft-card pa-4">
        <v-form class="d-flex flex-column ga-3" @submit.prevent="submit">
          <v-text-field v-model="form.name" :label="t('common.name')" required />
          <v-text-field v-model="form.description" :label="t('common.description')" />
          <div class="d-flex ga-2">
            <v-btn color="primary" type="submit">
              {{ editingId ? t('common.save') : t('common.add') }}
            </v-btn>
            <v-btn v-if="editingId" variant="text" @click="resetForm">
              {{ t('common.cancel') }}
            </v-btn>
          </div>
        </v-form>
      </v-card>

      <v-card v-for="book in store.books" :key="book.id" class="soft-card pa-4">
        <div class="d-flex align-center ga-3">
          <v-avatar color="primary" variant="tonal">
            <v-icon icon="$book" />
          </v-avatar>
          <div class="flex-grow-1">
            <div class="text-subtitle-1 font-weight-bold">{{ book.name }}</div>
            <div class="text-body-2 text-medium-emphasis">{{ book.description || '-' }}</div>
            <v-chip class="mt-2" size="small" :color="book.isArchived ? 'secondary' : 'success'" variant="tonal">
              {{ book.isArchived ? t('common.archived') : t('common.active') }}
            </v-chip>
          </div>
          <div class="d-flex flex-column ga-1">
            <v-btn size="small" variant="text" @click="editBook(book.id)">{{ t('common.edit') }}</v-btn>
            <v-btn :disabled="book.isArchived" size="small" variant="text" @click="archive(book.id)">
              {{ t('common.archive') }}
            </v-btn>
          </div>
        </div>
    </v-card>
  </div>
</template>
