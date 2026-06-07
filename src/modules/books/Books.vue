<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useI18n } from '@/i18n';
import AppBarVue from '@/components/shared/app-bar.vue';
import { useBookStore } from '@/modules/books/book.store';

const { t } = useI18n();
const store = useBookStore();
const error = ref('');
const editingId = ref<number | null>(null);
const editorOpen = ref(false);
const form = reactive({
  name: '',
  description: ''
});

function resetForm() {
  editingId.value = null;
  form.name = '';
  form.description = '';
}

function startCreate() {
  resetForm();
  editorOpen.value = true;
}

function editBook(bookId: number) {
  const book = store.books.find((item) => item.id === bookId);
  if (!book) {
    return;
  }

  editingId.value = book.id;
  form.name = book.name;
  form.description = book.description ?? '';
  editorOpen.value = true;
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
    editorOpen.value = false;
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
  <AppBarVue>
    <template #actions>
      <v-btn
        color="primary"
        icon="$add"
        size="small"
        variant="flat"
        @click="startCreate"
      />
    </template>
  </AppBarVue>

  <v-main>
    <v-container class="pa-4">
      <div class="d-flex flex-column ga-4">
        <v-alert v-if="error" type="error" variant="tonal">{{ error }}</v-alert>

        <v-card
          v-for="book in store.books"
          :key="book.id"
          class="soft-card pa-4"
        >
          <div class="d-flex align-center ga-3">
            <v-avatar color="primary" size="36" variant="tonal">
              <v-icon icon="$book" size="20" />
            </v-avatar>
            <div class="flex-grow-1 min-w-0" @click="editBook(book.id)">
              <div class="text-body-medium text-truncate">{{ book.name }}</div>
              <div class="mt-1 text-label-medium text-medium-emphasis text-truncate">
                {{ book.description || '-' }}
              </div>
              <v-chip
                class="book-status mt-2"
                size="x-small"
                :color="book.isArchived ? 'secondary' : 'success'"
                variant="tonal"
              >
                {{ book.isArchived ? t('common.archived') : t('common.active') }}
              </v-chip>
            </div>
            <div class="d-flex flex-column ga-1">
              <v-btn size="small" variant="text" @click="editBook(book.id)">
                {{ t('common.edit') }}
              </v-btn>
              <v-btn
                :disabled="book.isArchived"
                size="small"
                variant="text"
                @click="archive(book.id)"
              >
                {{ t('common.archive') }}
              </v-btn>
            </div>
          </div>
        </v-card>
      </div>

      <v-bottom-sheet v-model="editorOpen">
        <v-card class="pa-4" color="surface">
          <div class="text-title-large font-weight-bold mb-4">
            {{ editingId ? t('common.edit') : t('common.add') }}
          </div>
          <v-form class="d-flex flex-column ga-3" @submit.prevent="submit">
            <v-text-field v-model="form.name" :label="t('common.name')" required />
            <v-text-field
              v-model="form.description"
              :label="t('common.description')"
            />
            <div class="d-flex ga-2">
              <v-btn color="primary" type="submit">
                {{ editingId ? t('common.save') : t('common.add') }}
              </v-btn>
              <v-btn variant="text" @click="editorOpen = false">
                {{ t('common.cancel') }}
              </v-btn>
            </div>
          </v-form>
        </v-card>
      </v-bottom-sheet>
    </v-container>
  </v-main>
</template>

<style scoped>
.book-status {
  max-width: 6rem;
}

.book-status :deep(.v-chip__content) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
