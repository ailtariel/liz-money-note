<script setup lang="ts">
import { computed, ref, watch } from 'vue';

type QuickRange = 'month' | 'year' | 'custom';

interface Props {
  title: string;
  dateFrom: string | null;
  dateTo: string | null;
  monthLabel: string;
  yearLabel: string;
  customLabel: string;
  confirmLabel: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  apply: [
    range: {
      dateFrom: string | null;
      dateTo: string | null;
      mode: QuickRange;
    }
  ];
}>();

const quickRange = ref<QuickRange>('month');
const selectedDates = ref<Date[]>([]);
const updatingFromQuickRange = ref(false);

const quickRangeItems = computed(() => [
  { title: props.monthLabel, value: 'month' },
  { title: props.yearLabel, value: 'year' },
  { title: props.customLabel, value: 'custom' }
]);

watch(
  () => [props.dateFrom, props.dateTo],
  ([dateFrom, dateTo]) => {
    if (!dateFrom && !dateTo) {
      setQuickRangeDates('month');
      return;
    }

    selectedDates.value = [dateFrom, dateTo]
      .filter((date): date is string => Boolean(date))
      .map((date) => new Date(`${date}T00:00:00`));
    quickRange.value = inferQuickRange(dateFrom, dateTo);
  },
  { immediate: true }
);

watch(quickRange, (value) => {
  if (value === 'custom') {
    return;
  }
  setQuickRangeDates(value);
});

function setQuickRangeDates(value: Exclude<QuickRange, 'custom'>) {
  updatingFromQuickRange.value = true;
  const now = new Date();
  const start =
    value === 'month'
      ? new Date(now.getFullYear(), now.getMonth(), 1)
      : new Date(now.getFullYear(), 0, 1);
  const end =
    value === 'month'
      ? new Date(now.getFullYear(), now.getMonth() + 1, 0)
      : new Date(now.getFullYear(), 11, 31);
  selectedDates.value = [start, end];
  requestAnimationFrame(() => {
    updatingFromQuickRange.value = false;
  });
}

function handleSelectedDatesUpdate(value: Date[]) {
  selectedDates.value = value;
  if (!updatingFromQuickRange.value) {
    quickRange.value = 'custom';
  }
}

function inferQuickRange(
  dateFrom: string | null,
  dateTo: string | null
): QuickRange {
  const monthDates = getQuickRangeDateStrings('month');
  const yearDates = getQuickRangeDateStrings('year');

  if (dateFrom === monthDates.dateFrom && dateTo === monthDates.dateTo) {
    return 'month';
  }

  if (dateFrom === yearDates.dateFrom && dateTo === yearDates.dateTo) {
    return 'year';
  }

  return 'custom';
}

function getQuickRangeDateStrings(value: Exclude<QuickRange, 'custom'>) {
  const now = new Date();
  const start =
    value === 'month'
      ? new Date(now.getFullYear(), now.getMonth(), 1)
      : new Date(now.getFullYear(), 0, 1);
  const end =
    value === 'month'
      ? new Date(now.getFullYear(), now.getMonth() + 1, 0)
      : new Date(now.getFullYear(), 11, 31);
  return {
    dateFrom: formatDate(start),
    dateTo: formatDate(end)
  };
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function applyDateRange() {
  const sortedDates = [...selectedDates.value].sort(
    (left, right) => left.getTime() - right.getTime()
  );
  emit('apply', {
    dateFrom: sortedDates[0] ? formatDate(sortedDates[0]) : null,
    dateTo: sortedDates.at(-1) ? formatDate(sortedDates.at(-1)!) : null,
    mode: quickRange.value
  });
}
</script>

<template>
  <v-card class="date-filter-sheet pa-4">
    <div class="date-filter-title">
      {{ title }}
    </div>
    <v-btn-toggle
      v-model="quickRange"
      class="date-filter-toggle"
      color="primary"
      variant="outlined"
    >
      <v-btn
        v-for="item in quickRangeItems"
        :key="item.value"
        :value="item.value"
        style="border-radius: 0"
      >
        {{ item.title }}
      </v-btn>
    </v-btn-toggle>

    <v-date-picker
      :model-value="selectedDates"
      class="date-filter-picker"
      color="primary"
      hide-header
      multiple="range"
      @update:model-value="handleSelectedDatesUpdate"
    />

    <v-btn block color="primary" class="mt-4" @click="applyDateRange">
      {{ confirmLabel }}
    </v-btn>
  </v-card>
</template>

<style scoped>
.date-filter-title {
  margin-bottom: 0.75rem;
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.4;
}

.date-filter-toggle {
  width: 100%;
  margin-bottom: 0.75rem;
}

.date-filter-toggle :deep(.v-btn) {
  flex: 1 1 0;
}

.date-filter-picker {
  width: 100%;
}

.date-filter-picker
  :deep(.v-date-picker-month__day--range-start > .v-btn),
.date-filter-picker
  :deep(.v-date-picker-month__day--range-end > .v-btn) {
  background-color: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
}

.date-filter-picker :deep(.v-date-picker-month__range-bg--range) {
  background-color: rgb(var(--v-theme-primary));
  opacity: 0.14;
}
</style>
