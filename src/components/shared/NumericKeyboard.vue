<script setup lang="ts">
interface Props {
  displayValue: string;
  title?: string;
  confirmLabel: string;
}

defineProps<Props>();
const emit = defineEmits<{
  input: [value: string];
  backspace: [];
  confirm: [];
}>();

const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'];
</script>

<template>
  <v-card class="pa-4">
    <div v-if="title" class="text-body-2 text-medium-emphasis">
      {{ title }}
    </div>
    <div class="numeric-keyboard-display mt-1">{{ displayValue }}</div>
    <div class="numeric-keyboard-grid mt-4">
      <v-btn
        v-for="key in keys"
        :key="key"
        size="large"
        variant="tonal"
        @click="emit('input', key)"
      >
        {{ key }}
      </v-btn>
      <v-btn
        icon="$close"
        size="large"
        variant="tonal"
        @click="emit('backspace')"
      />
    </div>
    <v-btn
      block
      class="mt-4"
      color="primary"
      size="large"
      @click="emit('confirm')"
    >
      {{ confirmLabel }}
    </v-btn>
  </v-card>
</template>

<style scoped>
.numeric-keyboard-display {
  color: rgb(var(--v-theme-primary));
  font-size: 4rem;
  font-weight: 800;
  line-height: 1.1;
}

.numeric-keyboard-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
</style>
