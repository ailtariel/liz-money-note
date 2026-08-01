import type { SQLiteDBConnection } from '@capacitor-community/sqlite';
import { getDatabase, persistDatabase } from '@/modules/database/connection';
import { nowIso } from '@/modules/shared/date';
import { getTagPaletteColor } from './tag-colors';
import type { Tag, TagInput } from './tag.types';

interface TagRow {
  id: number;
  name: string;
  color: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface SequenceRow {
  seq: number | null;
}

function mapTag(row: TagRow): Tag {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function listTags(db?: SQLiteDBConnection) {
  const connection = db ?? (await getDatabase());
  const result = await connection.query(
    'SELECT * FROM tags ORDER BY sort_order ASC, name ASC'
  );
  return ((result.values ?? []) as TagRow[]).map(mapTag);
}

export async function getNextTagPaletteIndex(db: SQLiteDBConnection) {
  const result = await db.query(
    `SELECT seq FROM sqlite_sequence WHERE name = 'tags' LIMIT 1`
  );
  return Number(((result.values ?? [])[0] as SequenceRow | undefined)?.seq ?? 0);
}

export async function createTag(input: TagInput) {
  const db = await getDatabase();
  const now = nowIso();
  const color =
    input.color?.trim() || getTagPaletteColor(await getNextTagPaletteIndex(db));
  await db.run(
    `INSERT INTO tags (name, color, sort_order, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)`,
    [input.name.trim(), color, input.sortOrder ?? 0, now, now]
  );
  await persistDatabase();
}

export async function updateTag(id: number, input: TagInput) {
  const db = await getDatabase();
  await db.run(
    `UPDATE tags
     SET name = ?, color = ?, sort_order = ?, updated_at = ?
     WHERE id = ?`,
    [input.name.trim(), input.color ?? null, input.sortOrder ?? 0, nowIso(), id]
  );
  await persistDatabase();
}

export async function deleteTag(id: number) {
  const db = await getDatabase();
  const result = await db.query(
    `SELECT
      (SELECT COUNT(*) FROM transaction_tags WHERE tag_id = ?) +
      (SELECT COUNT(*) FROM recurring_event_tags WHERE tag_id = ?) AS usage_count`,
    [id, id]
  );
  const usageCount = Number((result.values ?? [])[0]?.usage_count ?? 0);

  if (usageCount > 0) {
    throw new Error('Tag 已被流水或周期事件使用，请先解除关联。');
  }

  await db.run('DELETE FROM tags WHERE id = ?', [id]);
  await persistDatabase();
}
