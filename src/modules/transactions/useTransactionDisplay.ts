import { computed, reactive } from 'vue';
import { useI18n } from '@/i18n';
import type { Transaction } from '@/modules/transactions/transaction.types';
import { transactionTypeOptions } from '@/components/shared/financeDisplay';
import { useBookStore } from '@/modules/books/book.store';
import { useAccountStore } from '@/modules/accounts/account.store';
import { useTagStore } from '@/modules/tags/tag.store';
import type { Tag } from '@/modules/tags/tag.types';
import { useTransactionStore } from '@/modules/transactions/transaction.store';

let Instance: ReturnType<typeof createInstance> | null = null;

export default function useTransaction() {
  if (!Instance) {
    Instance = createInstance();
  }
  return Instance;
}

function createInstance() {
  const { t } = useI18n();
  const bookStore = useBookStore();
  const accountStore = useAccountStore();
  const tagStore = useTagStore();
  const transactionStore = useTransactionStore();
  const typeOptions = computed(() => transactionTypeOptions(t));
  const accountNameById = computed(
    () =>
      new Map(
        accountStore.accounts.map((account) => [account.id, account.name])
      )
  );
  const bookNameById = computed(
    () => new Map(bookStore.books.map((book) => [book.id, book.name]))
  );
  const tagById = computed(
    () => new Map(tagStore.tags.map((tag) => [tag.id, tag]))
  );
  const typeTitleByValue = computed(
    () =>
      new Map(typeOptions.value.map((option) => [option.value, option.title]))
  );
  const primaryTagByTransactionId = computed(() => {
    const lookup = new Map<number, Tag>();

    for (const transaction of transactionStore.transactions) {
      for (const tagId of transaction.tagIds) {
        const tag = tagById.value.get(tagId);
        if (tag) {
          lookup.set(transaction.id, tag);
          break;
        }
      }
    }

    return lookup;
  });

  const getTags = (tagIds: number[]): Tag[] =>
    tagIds
      .map((tagId) => tagById.value.get(tagId))
      .filter((tag): tag is Tag => Boolean(tag));

  const getPrimaryTag = (transaction: Transaction) => {
    return primaryTagByTransactionId.value.get(transaction.id);
  };

  const getColor = (transaction: Transaction) => {
    if (transaction.type === 'income') {
      return 'success';
    }

    if (transaction.type === 'transfer') {
      return 'secondary';
    }

    return 'error';
  };

  const getIcon = (transaction: Transaction) => {
    const tag = getPrimaryTag(transaction)?.name.toLowerCase() ?? '';

    if (tag.includes('car') || tag.includes('车') || tag.includes('交通')) {
      return '$car';
    }

    if (tag.includes('shop') || tag.includes('购')) {
      return '$shopping';
    }

    if (transaction.type === 'income') {
      return '$salary';
    }

    return '$food';
  };

  const getTitle = (transaction: Transaction) => {
    return (
      transaction.note ||
      getPrimaryTag(transaction)?.name ||
      typeTitleByValue.value.get(transaction.type) ||
      '-'
    );
  };

  const getAccountName = (id: number | null) => {
    if (!id) {
      return '-';
    }

    return accountNameById.value.get(id) ?? '-';
  };

  const getBookName = (id: number) => {
    return bookNameById.value.get(id) ?? '-';
  };

  const removeTransaction = async (id: number) => {
    if (!id) {
      return;
    }

    await transactionStore.remove(id);
  };

  return reactive({
    getTags,
    getPrimaryTag,
    getColor,
    getIcon,
    getTitle,
    getAccountName,
    getBookName,
    removeTransaction
  });
}
