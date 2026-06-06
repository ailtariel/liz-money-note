<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useTagStore } from '@/modules/tags/tag.store';

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
    error.value = err instanceof Error ? err.message : '保存 Tag 失败。';
  }
}

async function remove(tagId: number) {
  error.value = '';
  try {
    await store.remove(tagId);
  } catch (err) {
    error.value = err instanceof Error ? err.message : '删除 Tag 失败。';
  }
}

onMounted(() => store.load());
</script>

<template>
  <div class="d-flex flex-column ga-6">
    <div>
      <h1 class="text-h5">Tag</h1>
      <div class="text-body-2 text-medium-emphasis">维护流水和周期事件的灵活标记</div>
    </div>

    <v-alert v-if="error" type="error" variant="tonal">{{ error }}</v-alert>

    <v-form class="d-flex flex-wrap ga-3 align-start" @submit.prevent="submit">
      <v-text-field v-model="form.name" label="名称" max-width="220" required variant="outlined" />
      <v-text-field v-model="form.color" label="颜色" max-width="160" variant="outlined" />
      <v-text-field
        v-model.number="form.sortOrder"
        label="排序"
        max-width="120"
        type="number"
        variant="outlined"
      />
      <v-btn color="primary" type="submit">
        {{ editingId ? '保存' : '新增' }}
      </v-btn>
      <v-btn v-if="editingId" variant="text" @click="resetForm">取消</v-btn>
    </v-form>

    <v-table>
      <thead>
        <tr>
          <th>名称</th>
          <th>颜色</th>
          <th>排序</th>
          <th class="text-right">操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="tag in store.tags" :key="tag.id">
          <td>{{ tag.name }}</td>
          <td>
            <span
              class="d-inline-block rounded-circle mr-2"
              :style="{ width: '12px', height: '12px', background: tag.color || '#9ca3af' }"
            />
            {{ tag.color || '-' }}
          </td>
          <td>{{ tag.sortOrder }}</td>
          <td class="text-right">
            <v-btn size="small" variant="text" @click="editTag(tag.id)">编辑</v-btn>
            <v-btn size="small" variant="text" @click="remove(tag.id)">删除</v-btn>
          </td>
        </tr>
      </tbody>
    </v-table>
  </div>
</template>
