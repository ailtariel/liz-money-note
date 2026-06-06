<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useI18n } from '@/i18n';
import { useTagStore } from '@/modules/tags/tag.store';

const { t } = useI18n();
const store = useTagStore();
const error = ref('');
const editingId = ref<number | null>(null);
const form = reactive({
  name: '',
  color: '#0f766e',
  sortOrder: 0
});

function resetForm() {
  editingId.value = null;
  form.name = '';
  form.color = '#0f766e';
  form.sortOrder = 0;
}

function editTag(tagId: number) {
  const tag = store.tags.find((item) => item.id === tagId);
  if (!tag) {
    return;
  }

  editingId.value = tag.id;
  form.name = tag.name;
  form.color = tag.color ?? '#0f766e';
  form.sortOrder = tag.sortOrder;
}

async function submit() {
  error.value = '';
  try {
    const input = {
      name: form.name,
      color: form.color,
      sortOrder: Number(form.sortOrder)
    };

    if (editingId.value) {
      await store.update(editingId.value, input);
    } else {
      await store.create(input);
    }

    resetForm();
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('tag.saveFailed');
  }
}

async function remove(tagId: number) {
  error.value = '';
  try {
    await store.remove(tagId);
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('tag.deleteFailed');
  }
}

onMounted(() => store.load());
</script>

<template>
  <div class="d-flex flex-column ga-4">
    <v-alert v-if="error" type="error" variant="tonal">{{ error }}</v-alert>

      <v-card class="soft-card pa-4">
        <v-form class="d-flex flex-column ga-3" @submit.prevent="submit">
          <v-text-field v-model="form.name" :label="t('common.name')" required />
          <v-text-field v-model="form.color" :label="t('common.color')" />
          <v-text-field v-model.number="form.sortOrder" :label="t('common.sortOrder')" type="number" />
          <div class="d-flex ga-2">
            <v-btn color="primary" type="submit">
              {{ editingId ? t('common.save') : t('common.add') }}
            </v-btn>
            <v-btn v-if="editingId" variant="text" @click="resetForm">
              {{ t('common.cancel') }}
            </v-btn>
          </div>
        </v-form>
      </v-card>

      <v-card v-for="tag in store.tags" :key="tag.id" class="soft-card pa-4">
        <div class="d-flex align-center ga-3">
          <v-avatar :color="tag.color || 'primary'" variant="tonal">
            <v-icon icon="$tag" />
          </v-avatar>
          <div class="flex-grow-1">
            <div class="text-subtitle-1 font-weight-bold">{{ tag.name }}</div>
            <div class="text-body-2 text-medium-emphasis">{{ tag.color || '-' }} · {{ tag.sortOrder }}</div>
          </div>
          <v-btn size="small" variant="text" @click="editTag(tag.id)">{{ t('common.edit') }}</v-btn>
          <v-btn size="small" variant="text" @click="remove(tag.id)">{{ t('common.delete') }}</v-btn>
        </div>
    </v-card>
  </div>
</template>
