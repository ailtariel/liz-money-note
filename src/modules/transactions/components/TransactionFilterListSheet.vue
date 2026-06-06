<script setup lang="ts">
interface FilterListItem {
  title: string;
  value: number | string | null;
}

interface Props {
  title: string;
  items: FilterListItem[];
  modelValue: number | string | null;
}

defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: number | string | null];
  select: [value: number | string | null];
}>();

function selectItem(value: number | string | null) {
  emit('update:modelValue', value);
  emit('select', value);
}
</script>

<template>
  <v-card class="pa-4">
    <div class="filter-sheet-title">
      {{ title }}
    </div>
    <v-list>
      <v-list-item
        v-for="item in items"
        :key="String(item.value)"
        :active="item.value === modelValue"
        rounded="lg"
        @click="selectItem(item.value)"
      >
        <v-list-item-title>{{ item.title }}</v-list-item-title>
        <template v-if="item.value === modelValue" #append>
          <v-icon color="primary" icon="$check" />
        </template>
      </v-list-item>
    </v-list>
  </v-card>
</template>

<style scoped>
.filter-sheet-title {
  margin-bottom: 0.75rem;
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.4;
}
</style>
