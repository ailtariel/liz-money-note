import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import {
  createAccount,
  listAccounts,
  restoreAccount,
  updateAccount
} from './account.repository';
import { deleteAccount } from './account.service';
import type { Account, AccountInput } from './account.types';

export const useAccountStore = defineStore('accounts', () => {
  const accounts = ref<Account[]>([]);
  const loading = ref(false);
  const deletingAccountId = ref<number | null>(null);

  const activeAccounts = computed(() =>
    accounts.value.filter((account) => !account.isArchived)
  );

  async function load(includeArchived = true) {
    loading.value = true;
    try {
      accounts.value = await listAccounts(includeArchived);
    } finally {
      loading.value = false;
    }
  }

  async function create(input: AccountInput) {
    await createAccount(input);
    await load();
  }

  async function update(id: number, input: AccountInput) {
    await updateAccount(id, input);
    await load();
  }

  async function restore(id: number) {
    await restoreAccount(id);
    await load();
  }

  async function remove(id: number) {
    if (deletingAccountId.value !== null) {
      return null;
    }

    deletingAccountId.value = id;
    try {
      const result = await deleteAccount(id);
      if (result.deleted) {
        await load();
      }
      return result;
    } finally {
      deletingAccountId.value = null;
    }
  }

  return {
    accounts,
    activeAccounts,
    loading,
    deletingAccountId,
    load,
    create,
    update,
    restore,
    remove
  };
});
