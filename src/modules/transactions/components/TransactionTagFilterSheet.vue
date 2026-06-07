<script setup lang="ts">
import { ref, watch } from 'vue';
import type { Tag } from '@/modules/tags/tag.types';

interface Props {
  title: string;
  tags: Tag[];
  modelValue: number[];
  clearLabel: string;
  confirmLabel: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: number[]];
  apply: [];
}>();

const draftTagIds = ref<number[]>([]);

watch(
  () => props.modelValue,
  (value) => {
    draftTagIds.value = [...value];
  },
  { immediate: true }
);

function toggleTag(tagId: number) {
  draftTagIds.value = draftTagIds.value.includes(tagId)
    ? draftTagIds.value.filter((id) => id !== tagId)
    : [...draftTagIds.value, tagId];
}

function clearTags() {
  draftTagIds.value = [];
}

function applyTags() {
  emit('update:modelValue', [...draftTagIds.value]);
  emit('apply');
}
</script>

<template>
  <v-card class="pa-4" color="surface">
    <div class="d-flex align-center justify-space-between ga-4 mb-3">
      <div class="text-title-medium font-weight-bold">
        {{ title }}
      </div>
      <v-btn variant="text" color="primary" @click="clearTags">
        {{ clearLabel }}
      </v-btn>
    </div>

    <div class="d-flex flex-wrap ga-2">
      <v-chip
        v-for="tag in tags"
        :key="tag.id"
        :color="draftTagIds.includes(tag.id) ? 'primary' : undefined"
        :variant="draftTagIds.includes(tag.id) ? 'flat' : 'tonal'"
        @click="toggleTag(tag.id)"
      >
        {{ tag.name }}
      </v-chip>
    </div>

    <v-btn block color="primary" class="mt-4" @click="applyTags">
      {{ confirmLabel }}
    </v-btn>
  </v-card>
</template>
