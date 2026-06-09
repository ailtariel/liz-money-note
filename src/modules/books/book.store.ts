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

  const activeBooks = computed(() => books.value.filter((book) => !book.isArchived));

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
    await deleteBook(id);
    await load();
  }

  return {
    books,
    bookAccountLinks,
    activeBooks,
    loading,
    load,
    loadAccountLinks,
    ensureDefault,
    create,
    update,
    archive,
    restore,
    remove
  };
});
