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
  <v-card class="pa-4" color="surface">
    <div v-if="title" class="text-body-medium text-medium-emphasis">
      {{ title }}
    </div>
    <div class="numeric-keyboard-display mt-1 text-primary font-weight-bold">
      {{ displayValue }}
    </div>
    <div class="numeric-keyboard-grid mt-4 ga-2">
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
  font-size: 4rem;
  line-height: 1.1;
}

.numeric-keyboard-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
}
</style>
