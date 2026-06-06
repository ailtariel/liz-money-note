import { defineStore } from 'pinia';
import { ref } from 'vue';
import { createTag, deleteTag, listTags, updateTag } from './tag.repository';
import type { Tag, TagInput } from './tag.types';

export const useTagStore = defineStore('tags', () => {
  const tags = ref<Tag[]>([]);
  const loading = ref(false);

  async function load() {
    loading.value = true;
    try {
      tags.value = await listTags();
    } finally {
      loading.value = false;
    }
  }

  async function create(input: TagInput) {
    await createTag(input);
    await load();
  }

  async function update(id: number, input: TagInput) {
    await updateTag(id, input);
    await load();
  }

  async function remove(id: number) {
    await deleteTag(id);
    await load();
  }

  return {
    tags,
    loading,
    load,
    create,
    update,
    remove
  };
});
