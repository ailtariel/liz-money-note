<script setup lang="ts">
defineProps<{
  modelValue: boolean;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: string;
  persistent?: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  confirm: [];
  cancel: [];
}>();

function close() {
  emit('update:modelValue', false);
}

function confirm() {
  emit('confirm');
  close();
}

function cancel() {
  emit('cancel');
  close();
}
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    :persistent="persistent"
    max-width="420"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card class="pa-4" color="surface">
      <v-card-title class="px-0 pt-0 text-title-medium font-weight-bold">
        {{ title }}
      </v-card-title>

      <v-card-text class="px-0 text-body-medium text-medium-emphasis">
        <slot>
          {{ message }}
        </slot>
      </v-card-text>

      <v-card-actions class="px-0 pb-0">
        <v-spacer />
        <slot
          name="actions"
          :confirm="confirm"
          :cancel="cancel"
          :close="close"
        >
          <v-btn :color="confirmColor ?? 'primary'" variant="flat" @click="confirm">
            {{ confirmText }}
          </v-btn>
          <v-btn variant="text" @click="cancel">
            {{ cancelText }}
          </v-btn>
        </slot>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
