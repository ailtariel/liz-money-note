<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useI18n } from '@/i18n';
import AppBarVue from '@/components/shared/app-bar.vue';
import { useTagStore } from '@/modules/tags/tag.store';

const { t } = useI18n();
const store = useTagStore();
const error = ref('');
const editingId = ref<number | null>(null);
const editorOpen = ref(false);
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

function startCreate() {
  resetForm();
  editorOpen.value = true;
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
  editorOpen.value = true;
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
    editorOpen.value = false;
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
  <AppBarVue>
    <template #actions>
      <v-btn
        color="primary"
        icon="$add"
        size="small"
        variant="flat"
        @click="startCreate"
      />
    </template>
  </AppBarVue>

  <v-main>
    <v-container class="pa-4">
      <div class="d-flex flex-column ga-4">
        <v-alert v-if="error" type="error" variant="tonal">{{ error }}</v-alert>

        <v-card v-for="tag in store.tags" :key="tag.id" class="soft-card pa-4">
          <div class="d-flex align-center ga-3">
            <v-avatar :color="tag.color || 'primary'" size="36" variant="tonal">
              <v-icon icon="$tag" size="20" />
            </v-avatar>
            <div class="flex-grow-1 min-w-0" @click="editTag(tag.id)">
              <div class="text-body-medium text-truncate">{{ tag.name }}</div>
              <div class="mt-1 text-label-medium text-medium-emphasis text-truncate">
                {{ tag.color || '-' }} &middot; {{ tag.sortOrder }}
              </div>
            </div>
            <v-btn size="small" variant="text" @click="editTag(tag.id)">
              {{ t('common.edit') }}
            </v-btn>
            <v-btn size="small" variant="text" @click="remove(tag.id)">
              {{ t('common.delete') }}
            </v-btn>
          </div>
        </v-card>
      </div>

      <v-bottom-sheet v-model="editorOpen">
        <v-card class="pa-4" color="surface">
          <div class="text-title-large font-weight-bold mb-4">
            {{ editingId ? t('common.edit') : t('common.add') }}
          </div>
          <v-form class="d-flex flex-column ga-3" @submit.prevent="submit">
            <v-text-field v-model="form.name" :label="t('common.name')" required />
            <v-color-input
              v-model="form.color"
              :label="t('common.color')"
              hide-actions
            />
            <v-text-field
              v-model.number="form.sortOrder"
              :label="t('common.sortOrder')"
              type="number"
            />
            <div class="d-flex ga-2">
              <v-btn color="primary" type="submit">
                {{ editingId ? t('common.save') : t('common.add') }}
              </v-btn>
              <v-btn variant="text" @click="editorOpen = false">
                {{ t('common.cancel') }}
              </v-btn>
            </div>
          </v-form>
        </v-card>
      </v-bottom-sheet>
    </v-container>
  </v-main>
</template>
