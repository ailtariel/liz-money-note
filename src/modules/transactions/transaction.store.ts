import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useAccountStore } from '@/modules/accounts/account.store';
import {
  createTransaction,
  deleteTransaction
} from './transaction.service';
import { listTransactions } from './transaction.repository';
import type {
  Transaction,
  TransactionFilters,
  TransactionInput
} from './transaction.types';

export const useTransactionStore = defineStore('transactions', () => {
  const transactions = ref<Transaction[]>([]);
  const filters = ref<TransactionFilters>({});
  const loading = ref(false);
  const accountStore = useAccountStore();

  async function load(nextFilters: TransactionFilters = filters.value) {
    filters.value = { ...nextFilters };
    loading.value = true;
    try {
      transactions.value = await listTransactions(filters.value);
    } finally {
      loading.value = false;
    }
  }

  async function create(input: TransactionInput) {
    await createTransaction(input);
    await Promise.all([load(), accountStore.load()]);
  }

  async function remove(id: number) {
    await deleteTransaction(id);
    await Promise.all([load(), accountStore.load()]);
  }

  return {
    transactions,
    filters,
    loading,
    load,
    create,
    remove
  };
});
