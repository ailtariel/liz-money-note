import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import {
  archiveBook,
  createBook,
  ensureDefaultBook,
  listBooks,
  restoreBook,
  updateBook
} from './book.repository';
import { deleteBook } from './book.service';
import type { Book, BookInput } from './book.types';

export const useBookStore = defineStore('books', () => {
  const books = ref<Book[]>([]);
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

  async function ensureDefault() {
    await ensureDefaultBook();
    await load();
  }

  async function create(input: BookInput) {
    await createBook(input);
    await load();
  }

  async function update(id: number, input: BookInput) {
    await updateBook(id, input);
    await load();
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
    activeBooks,
    loading,
    load,
    ensureDefault,
    create,
    update,
    archive,
    restore,
    remove
  };
});
