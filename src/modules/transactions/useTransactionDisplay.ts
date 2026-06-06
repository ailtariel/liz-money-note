import { computed, reactive } from 'vue';
import { useI18n } from '@/i18n';
import type { Transaction } from '@/modules/transactions/transaction.types';
import { transactionTypeOptions } from '@/components/shared/financeDisplay';
import { useBookStore } from '@/modules/books/book.store';
import { useAccountStore } from '@/modules/accounts/account.store';
import { useTagStore } from '@/modules/tags/tag.store';
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

  const getPrimaryTag = (transaction: Transaction) => {
    return tagStore.tags.find((tag) => transaction.tagIds.includes(tag.id));
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
      typeOptions.value.find((item) => item.value === transaction.type)
        ?.title ||
      '-'
    );
  };

  const getAccountName = (id: number | null) => {
    if (!id) {
      return '-';
    }

    return (
      accountStore.accounts.find((account) => account.id === id)?.name ?? '-'
    );
  };

  const getBookName = (id: number) => {
    return bookStore.books.find((book) => book.id === id)?.name ?? '-';
  };

  const removeTransaction = async (id: number) => {
    if (!id) {
      return;
    }

    await transactionStore.remove(id);
  };

  return reactive({
    getPrimaryTag,
    getColor,
    getIcon,
    getTitle,
    getAccountName,
    getBookName,
    removeTransaction
  });
}
