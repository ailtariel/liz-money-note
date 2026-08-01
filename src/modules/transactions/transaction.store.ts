import { defineStore } from 'pinia';
import { ref, shallowRef } from 'vue';
import { useAccountStore } from '@/modules/accounts/account.store';
import {
  createTransaction,
  deleteTransaction,
  updateTransaction
} from './transaction.service';
import { listTransactions } from './transaction.repository';
import type {
  Transaction,
  TransactionFilters,
  TransactionInput
} from './transaction.types';

export const useTransactionStore = defineStore('transactions', () => {
  const transactions = shallowRef<Transaction[]>([]);
  const filters = ref<TransactionFilters>({});
  const loading = ref(false);
  const mutating = ref(false);
  const accountStore = useAccountStore();
  let latestLoadRequestId = 0;

  async function load(nextFilters: TransactionFilters = filters.value) {
    const requestId = ++latestLoadRequestId;
    const requestFilters = {
      ...nextFilters,
      tagIds: nextFilters.tagIds ? [...nextFilters.tagIds] : undefined
    };

    filters.value = requestFilters;
    loading.value = true;
    try {
      const result = await listTransactions(requestFilters);
      if (requestId === latestLoadRequestId) {
        transactions.value = result;
      }
    } finally {
      if (requestId === latestLoadRequestId) {
        loading.value = false;
      }
    }
  }

  async function create(input: TransactionInput) {
    if (mutating.value) {
      return false;
    }

    mutating.value = true;
    try {
      await createTransaction(input);
      await Promise.all([load(), accountStore.load()]);
      return true;
    } finally {
      mutating.value = false;
    }
  }

  async function update(id: number, input: TransactionInput) {
    if (mutating.value) {
      return false;
    }

    mutating.value = true;
    try {
      const updated = await updateTransaction(id, input);
      if (updated) {
        await Promise.all([load(), accountStore.load()]);
      }
      return updated;
    } finally {
      mutating.value = false;
    }
  }

  async function remove(id: number) {
    if (mutating.value) {
      return false;
    }

    mutating.value = true;
    try {
      await deleteTransaction(id);
      await Promise.all([load(), accountStore.load()]);
      return true;
    } finally {
      mutating.value = false;
    }
  }

  return {
    transactions,
    filters,
    loading,
    mutating,
    load,
    create,
    update,
    remove
  };
});
