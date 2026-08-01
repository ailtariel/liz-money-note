<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useI18n } from '@/i18n';
import ConfirmationDialog from '@/components/common/ConfirmationDialog.vue';
import AppBarVue from '@/components/shared/app-bar.vue';
import { useAccountStore } from '@/modules/accounts/account.store';
import { useBookStore } from '@/modules/books/book.store';

const { t } = useI18n();
const store = useBookStore();
const accountStore = useAccountStore();
const error = ref('');
const editingId = ref<number | null>(null);
const editorOpen = ref(false);
const deleteConfirmOpen = ref(false);
const pendingDeleteBookId = ref<number | null>(null);
const form = reactive({
  name: '',
  description: '',
  accountIds: [] as number[],
  defaultAccountId: null as number | null
});
const activeAccounts = computed(() => accountStore.activeAccounts);

function resetForm() {
  editingId.value = null;
  form.name = '';
  form.description = '';
  const defaultAccountId = activeAccounts.value[0]?.id ?? null;
  form.accountIds = defaultAccountId ? [defaultAccountId] : [];
  form.defaultAccountId = defaultAccountId;
}

function startCreate() {
  resetForm();
  editorOpen.value = true;
}

async function editBook(bookId: number) {
  const book = store.books.find((item) => item.id === bookId);
  if (!book) {
    return;
  }

  await store.loadAccountLinks(bookId);
  const links = store.bookAccountLinks[bookId] ?? [];
  const defaultLink = links.find((link) => link.isDefault);

  editingId.value = book.id;
  form.name = book.name;
  form.description = book.description ?? '';
  form.accountIds = links.map((link) => link.accountId);
  form.defaultAccountId =
    defaultLink?.accountId ?? form.accountIds[0] ?? activeAccounts.value[0]?.id ?? null;

  if (form.defaultAccountId && !form.accountIds.includes(form.defaultAccountId)) {
    form.accountIds = [form.defaultAccountId, ...form.accountIds];
  }

  editorOpen.value = true;
}

function toggleAccount(accountId: number) {
  if (form.accountIds.includes(accountId)) {
    form.accountIds = form.accountIds.filter((id) => id !== accountId);

    if (form.defaultAccountId === accountId) {
      form.defaultAccountId = form.accountIds[0] ?? null;
    }
    return;
  }

  form.accountIds = [...form.accountIds, accountId];
  form.defaultAccountId ??= accountId;
}

async function submit() {
  error.value = '';
  if (!form.accountIds.length || !form.defaultAccountId) {
    error.value = t('book.accountRequired');
    return;
  }

  if (!form.accountIds.includes(form.defaultAccountId)) {
    error.value = t('book.defaultAccountRequired');
    return;
  }

  try {
    const input = {
      name: form.name,
      description: form.description || null
    };
    const accountConfig = {
      accountIds: form.accountIds,
      defaultAccountId: form.defaultAccountId
    };

    if (editingId.value) {
      await store.update(editingId.value, input, accountConfig);
    } else {
      await store.create(input, accountConfig);
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

async function restore(bookId: number) {
  error.value = '';
  try {
    await store.restore(bookId);
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('book.restoreFailed');
  }
}

async function setDefaultBook(bookId: number) {
  error.value = '';
  try {
    await store.setDefault(bookId);
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('book.defaultBookFailed');
  }
}

function requestDelete(bookId: number) {
  if (store.deletingBookId !== null) {
    return;
  }

  pendingDeleteBookId.value = bookId;
  deleteConfirmOpen.value = true;
}

async function confirmDelete() {
  if (!pendingDeleteBookId.value || store.deletingBookId !== null) {
    return;
  }

  error.value = '';
  try {
    const deleted = await store.remove(pendingDeleteBookId.value);
    if (deleted) {
      pendingDeleteBookId.value = null;
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('book.deleteFailed');
  }
}

onMounted(async () => {
  await Promise.all([store.load(), store.loadPreferences(), accountStore.load()]);
});
</script>

<template>
  <ConfirmationDialog
    v-model="deleteConfirmOpen"
    :title="t('book.deleteConfirmTitle')"
    :message="t('book.deleteConfirmMessage')"
    :confirm-text="t('common.delete')"
    :cancel-text="t('common.cancel')"
    confirm-color="error"
    @cancel="pendingDeleteBookId = null"
    @confirm="confirmDelete"
  />

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
              <v-chip
                v-if="store.defaultBookId === book.id"
                class="book-status mt-2 ml-2"
                color="primary"
                size="x-small"
                variant="flat"
              >
                {{ t('book.defaultBook') }}
              </v-chip>
            </div>
            <div class="d-flex flex-column ga-1">
              <v-btn
                :disabled="book.isArchived || store.defaultBookId === book.id || store.deletingBookId !== null"
                size="small"
                variant="text"
                @click="setDefaultBook(book.id)"
              >
                {{ t('book.setDefault') }}
              </v-btn>
              <v-btn
                :disabled="store.deletingBookId !== null"
                size="small"
                variant="text"
                @click="editBook(book.id)"
              >
                {{ t('common.edit') }}
              </v-btn>
              <v-btn
                :disabled="store.deletingBookId !== null"
                size="small"
                variant="text"
                @click="book.isArchived ? restore(book.id) : archive(book.id)"
              >
                {{ book.isArchived ? t('common.restore') : t('common.archive') }}
              </v-btn>
              <v-btn
                color="error"
                :disabled="store.deletingBookId !== null"
                :loading="store.deletingBookId === book.id"
                size="small"
                variant="text"
                @click="requestDelete(book.id)"
              >
                {{ t('common.delete') }}
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
            <div>
              <div class="text-body-medium font-weight-bold mb-2">
                {{ t('book.linkedAccounts') }}
              </div>
              <div class="d-flex flex-column ga-2">
                <v-card
                  v-for="account in activeAccounts"
                  :key="account.id"
                  class="book-account-option pa-3"
                  color="surface-variant"
                >
                  <div class="d-flex align-center ga-2">
                    <v-checkbox
                      :model-value="form.accountIds.includes(account.id)"
                      density="compact"
                      hide-details
                      @update:model-value="toggleAccount(account.id)"
                    />
                    <div class="flex-grow-1 min-w-0">
                      <div class="text-body-medium text-truncate">
                        {{ account.name }}
                      </div>
                      <div class="text-label-medium text-medium-emphasis">
                        {{ account.currency }}
                      </div>
                    </div>
                    <v-radio
                      v-model="form.defaultAccountId"
                      :disabled="!form.accountIds.includes(account.id)"
                      :label="t('book.defaultAccount')"
                      :value="account.id"
                    />
                  </div>
                </v-card>
              </div>
            </div>
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

.book-account-option {
  border: 1px solid rgb(var(--v-theme-outline));
}
</style>
