import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import {
  archiveBook,
  createBook,
  ensureDefaultBook,
  listBookAccountLinks,
  listBooks,
  restoreBook,
  setBookAccountLinks,
  updateBook
} from './book.repository';
import { deleteBook } from './book.service';
import {
  getDefaultBookId,
  getLastOpenedBookId,
  setDefaultBookId,
  setLastOpenedBookId
} from '@/modules/settings/settings.repository';
import type {
  Book,
  BookAccountConfigInput,
  BookAccountLink,
  BookInput
} from './book.types';

export const useBookStore = defineStore('books', () => {
  const books = ref<Book[]>([]);
  const bookAccountLinks = ref<Record<number, BookAccountLink[]>>({});
  const loading = ref(false);
  const deletingBookId = ref<number | null>(null);
  const defaultBookId = ref<number | null>(null);
  const lastOpenedBookId = ref<number | null>(null);

  const activeBooks = computed(() => books.value.filter((book) => !book.isArchived));
  const activeDefaultBookId = computed(() =>
    activeBooks.value.some((book) => book.id === defaultBookId.value)
      ? defaultBookId.value
      : null
  );
  const activeLastOpenedBookId = computed(() =>
    activeBooks.value.some((book) => book.id === lastOpenedBookId.value)
      ? lastOpenedBookId.value
      : null
  );

  async function load(includeArchived = true) {
    loading.value = true;
    try {
      books.value = await listBooks(includeArchived);
    } finally {
      loading.value = false;
    }
  }

  async function loadAccountLinks(bookId: number) {
    bookAccountLinks.value = {
      ...bookAccountLinks.value,
      [bookId]: await listBookAccountLinks(bookId)
    };
  }

  async function ensureDefault() {
    await ensureDefaultBook();
    await load();
  }

  async function loadPreferences() {
    [defaultBookId.value, lastOpenedBookId.value] = await Promise.all([
      getDefaultBookId(),
      getLastOpenedBookId()
    ]);
  }

  async function setDefault(id: number) {
    if (!activeBooks.value.some((book) => book.id === id)) {
      throw new Error('Default book must be active.');
    }

    await setDefaultBookId(id);
    defaultBookId.value = id;
  }

  async function rememberLastOpened(id: number) {
    if (!activeBooks.value.some((book) => book.id === id)) {
      return;
    }

    await setLastOpenedBookId(id);
    lastOpenedBookId.value = id;
  }

  async function create(
    input: BookInput,
    accountConfig?: BookAccountConfigInput
  ) {
    const bookId = await createBook(input);
    if (accountConfig) {
      await setBookAccountLinks(bookId, accountConfig);
    }
    await load();
    await loadAccountLinks(bookId);
  }

  async function update(
    id: number,
    input: BookInput,
    accountConfig?: BookAccountConfigInput
  ) {
    await updateBook(id, input);
    if (accountConfig) {
      await setBookAccountLinks(id, accountConfig);
    }
    await load();
    await loadAccountLinks(id);
  }

  async function archive(id: number) {
    await archiveBook(id);
    await load();
  }

  async function restore(id: number) {
    await restoreBook(id);
    await load();
  }

  async function remove(id: number) {
    if (deletingBookId.value !== null) {
      return false;
    }

    deletingBookId.value = id;
    try {
      await deleteBook(id);
      if (defaultBookId.value === id) {
        await setDefaultBookId(null);
        defaultBookId.value = null;
      }
      if (lastOpenedBookId.value === id) {
        await setLastOpenedBookId(null);
        lastOpenedBookId.value = null;
      }
      await load();
      return true;
    } finally {
      deletingBookId.value = null;
    }
  }

  return {
    books,
    bookAccountLinks,
    activeBooks,
    loading,
    deletingBookId,
    defaultBookId,
    lastOpenedBookId,
    activeDefaultBookId,
    activeLastOpenedBookId,
    load,
    loadPreferences,
    loadAccountLinks,
    ensureDefault,
    setDefault,
    rememberLastOpened,
    create,
    update,
    archive,
    restore,
    remove
  };
});
