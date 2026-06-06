<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useAccountStore } from '@/modules/accounts/account.store';
import { useRecurringStore } from '@/modules/recurring/recurring.store';
import { formatMinorUnits } from '@/modules/shared/money';

const recurringStore = useRecurringStore();
const accountStore = useAccountStore();
const dialogOpen = ref(false);
const error = ref('');

const dueEvents = computed(() => recurringStore.dueEvents);

function accountName(id: number | null) {
  if (!id) {
    return '-';
  }

  return accountStore.accounts.find((account) => account.id === id)?.name ?? '-';
}

async function refreshDueDialog() {
  await recurringStore.loadDue();
  dialogOpen.value = dueEvents.value.length > 0;
}

async function approve(index: number) {
  error.value = '';
  try {
    await recurringStore.approve(dueEvents.value[index]);
    await accountStore.load();
    dialogOpen.value = dueEvents.value.length > 0;
  } catch (err) {
    error.value = err instanceof Error ? err.message : '批准周期事件失败。';
  }
}

async function skip(index: number) {
  error.value = '';
  try {
    await recurringStore.skip(dueEvents.value[index]);
    dialogOpen.value = dueEvents.value.length > 0;
  } catch (err) {
    error.value = err instanceof Error ? err.message : '跳过周期事件失败。';
  }
}

async function disable(index: number) {
  error.value = '';
  try {
    await recurringStore.disable(dueEvents.value[index].id);
    dialogOpen.value = dueEvents.value.length > 0;
  } catch (err) {
    error.value = err instanceof Error ? err.message : '停用周期事件失败。';
  }
}

onMounted(async () => {
  await accountStore.load();
  await refreshDueDialog();
});
</script>

<template>
  <v-app>
    <RouterView />

    <v-dialog v-model="dialogOpen" max-width="780">
      <v-card>
        <v-card-title>待处理周期事件</v-card-title>
        <v-card-text>
          <v-alert v-if="error" class="mb-4" type="error" variant="tonal">
            {{ error }}
          </v-alert>
          <v-table>
            <thead>
              <tr>
                <th>触发日</th>
                <th>账户</th>
                <th>金额</th>
                <th>备注</th>
                <th class="text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(event, index) in dueEvents" :key="event.id">
                <td>{{ event.nextTriggerDate }}</td>
                <td>
                  {{ accountName(event.accountId) }}
                  <span v-if="event.targetAccountId">
                    → {{ accountName(event.targetAccountId) }}
                  </span>
                </td>
                <td>{{ formatMinorUnits(event.amount, event.currency) }}</td>
                <td>{{ event.note || '-' }}</td>
                <td class="text-right">
                  <v-btn size="small" variant="text" @click="approve(index)">批准</v-btn>
                  <v-btn size="small" variant="text" @click="skip(index)">跳过</v-btn>
                  <v-btn size="small" variant="text" @click="disable(index)">停用</v-btn>
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialogOpen = false">稍后处理</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-app>
</template>
