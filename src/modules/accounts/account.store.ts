import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import {
  archiveAccount,
  createAccount,
  listAccounts,
  updateAccount
} from './account.repository';
import type { Account, AccountInput } from './account.types';

export const useAccountStore = defineStore('accounts', () => {
  const accounts = ref<Account[]>([]);
  const loading = ref(false);

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

  async function archive(id: number) {
    await archiveAccount(id);
    await load();
  }

  return {
    accounts,
    activeAccounts,
    loading,
    load,
    create,
    update,
    archive
  };
});
