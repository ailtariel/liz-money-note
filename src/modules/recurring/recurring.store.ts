import { defineStore } from 'pinia';
import { ref } from 'vue';
import {
  createRecurringEvent,
  disableRecurringEvent,
  listRecurringEvents,
  updateRecurringEvent
} from './recurring.repository';
import {
  approveRecurringEvent,
  loadDueRecurringEvents,
  skipRecurringEvent
} from './recurring.service';
import type { RecurringEvent, RecurringEventInput } from './recurring.types';

export const useRecurringStore = defineStore('recurring', () => {
  const events = ref<RecurringEvent[]>([]);
  const dueEvents = ref<RecurringEvent[]>([]);
  const loading = ref(false);

  async function load() {
    loading.value = true;
    try {
      events.value = await listRecurringEvents();
    } finally {
      loading.value = false;
    }
  }

  async function loadDue() {
    dueEvents.value = await loadDueRecurringEvents();
  }

  async function create(input: RecurringEventInput) {
    await createRecurringEvent(input);
    await load();
    await loadDue();
  }

  async function update(id: number, input: RecurringEventInput) {
    await updateRecurringEvent(id, input);
    await load();
    await loadDue();
  }

  async function approve(event: RecurringEvent) {
    await approveRecurringEvent(event);
    await load();
    await loadDue();
  }

  async function skip(event: RecurringEvent) {
    await skipRecurringEvent(event);
    await load();
    await loadDue();
  }

  async function disable(id: number) {
    await disableRecurringEvent(id);
    await load();
    await loadDue();
  }

  return {
    events,
    dueEvents,
    loading,
    load,
    loadDue,
    create,
    update,
    approve,
    skip,
    disable
  };
});
