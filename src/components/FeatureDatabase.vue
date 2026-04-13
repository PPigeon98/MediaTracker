<script lang="ts">
  import Database from '@tauri-apps/plugin-sql';
  import { mediaType, status, type progress, type Item, type SortBy, type Tag } from '../utils/types';

  let db: Database | null = null;

  async function getDb(): Promise<Database> {
    if (!db) {
      db = await Database.load('sqlite:database.db');
      await db.execute(`
        CREATE TABLE IF NOT EXISTS items (
          id          INTEGER PRIMARY KEY AUTOINCREMENT,
          title       TEXT NOT NULL,
          description TEXT NOT NULL,
          lastUpdated TEXT NOT NULL,
          coverImage  TEXT,
          status      INTEGER NOT NULL DEFAULT 0,
          mediaType   INTEGER NOT NULL DEFAULT 0,
          tags        TEXT NOT NULL,
          progress    TEXT NOT NULL DEFAULT '[]',
          ongoing      INTEGER NOT NULL DEFAULT 0,
          notes       TEXT NOT NULL,
          otherNames  TEXT,
          creators    TEXT,
          startDate   TEXT,
          endDate     TEXT
        )
      `);

      await db.execute(`
        CREATE INDEX IF NOT EXISTS idx_items_title ON items(title COLLATE NOCASE)
      `);
      await db.execute(`
        CREATE INDEX IF NOT EXISTS idx_items_status ON items(status)
      `);
      await db.execute(`
        CREATE INDEX IF NOT EXISTS idx_items_mediaType ON items(mediaType)
      `);
      await db.execute(`
        CREATE INDEX IF NOT EXISTS idx_items_lastUpdated ON items(lastUpdated DESC)
      `);
      await db.execute(`
        CREATE INDEX IF NOT EXISTS idx_items_tags ON items(tags)
      `);

      await db.execute(`
        CREATE TABLE IF NOT EXISTS item_images (
          id          INTEGER PRIMARY KEY AUTOINCREMENT,
          itemId     INTEGER NOT NULL,
          imagePath  TEXT NOT NULL,
          imageOrder INTEGER NOT NULL DEFAULT 0,
          FOREIGN KEY (itemId) REFERENCES items(id) ON DELETE CASCADE
        )
      `);
      await db.execute(`
        CREATE INDEX IF NOT EXISTS idx_item_images_itemId ON item_images(itemId, imageOrder)
      `);
      await db.execute(`
        CREATE TABLE IF NOT EXISTS item_relations (
          id            INTEGER PRIMARY KEY AUTOINCREMENT,
          itemId        INTEGER NOT NULL,
          relatedItemId INTEGER NOT NULL,
          description   TEXT NOT NULL DEFAULT '',
          FOREIGN KEY (itemId) REFERENCES items(id) ON DELETE CASCADE,
          FOREIGN KEY (relatedItemId) REFERENCES items(id) ON DELETE CASCADE,
          UNIQUE (itemId, relatedItemId)
        )
      `);
      await db.execute(`
        CREATE INDEX IF NOT EXISTS idx_item_relations_itemId ON item_relations(itemId)
      `);
      await db.execute(`
        CREATE INDEX IF NOT EXISTS idx_item_relations_relatedItemId ON item_relations(relatedItemId)
      `);
    }
    return db;
  }

  export { progressType, mediaType, status, type progress, type Item } from '../utils/types';

  export interface ItemQueryFilters {
    status?: status;
    mediaType?: mediaType;
    search?: string;
    tags?: Tag[];
    sortBy?: SortBy;
    limit?: number;
  }

  export interface ItemRelation {
    relatedItemId: number;
    description: string;
  }

  function parseDbItem(item: any): Item {
    return {
      ...item,
      status: item.status as status,
      mediaType: item.mediaType as mediaType,
      ongoing: Boolean(item.ongoing),
      tags: JSON.parse(item.tags),
      progress: JSON.parse(item.progress) as progress[],
      otherNames: JSON.parse(item.otherNames),
      creators: JSON.parse(item.creators),
      imageSet: [] as string[]
    };
  }

  function escapeLike(value: string): string {
    return value.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
  }

  function buildItemsWhere(filters: ItemQueryFilters): { whereClause: string; params: any[] } {
    const clauses: string[] = [];
    const params: any[] = [];

    if (filters.status !== undefined) {
      clauses.push(`status = $${params.length + 1}`);
      params.push(filters.status);
    }

    if (filters.mediaType !== undefined) {
      clauses.push(`mediaType = $${params.length + 1}`);
      params.push(filters.mediaType);
    }

    if (filters.search && filters.search.trim()) {
      const search = `%${escapeLike(filters.search.trim().toLowerCase())}%`;
      const idx = params.length + 1;
      clauses.push(`(
        lower(title) LIKE $${idx} ESCAPE '\\'
        OR lower(description) LIKE $${idx} ESCAPE '\\'
        OR lower(otherNames) LIKE $${idx} ESCAPE '\\'
        OR lower(creators) LIKE $${idx} ESCAPE '\\'
      )`);
      params.push(search);
    }

    if (filters.tags && filters.tags.length > 0) {
      for (const tag of filters.tags) {
        const idx = params.length + 1;
        clauses.push(`lower(tags) LIKE $${idx} ESCAPE '\\'`);
        params.push(`%\"${escapeLike(tag.toLowerCase())}\"%`);
      }
    }

    const whereClause = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
    return { whereClause, params };
  }

  function getOrderBy(sortBy: SortBy | undefined): string {
    if (sortBy === 'lastUpdated') {
      return 'ORDER BY lastUpdated DESC';
    }
    return 'ORDER BY title COLLATE NOCASE';
  }

  export async function getItems(includeImages: boolean = false): Promise<Item[]> {
    const database = await getDb();
    const result = await database.select<any[]>(
      'SELECT * FROM items ORDER BY title COLLATE NOCASE'
    );

    const items = result.map(parseDbItem);

    if (includeImages) {
      for (const item of items) {
        item.imageSet = await getItemImages(item.id);
      }
    }

    return items;
  }

  export async function getFilteredItems(filters: ItemQueryFilters, includeImages: boolean = false): Promise<Item[]> {
    const database = await getDb();
    const { whereClause, params } = buildItemsWhere(filters);
    const orderBy = getOrderBy(filters.sortBy);
    const limitClause = filters.limit !== undefined ? `LIMIT $${params.length + 1}` : '';
    const queryParams = filters.limit !== undefined ? [...params, filters.limit] : params;

    const result = await database.select<any[]>(
      `SELECT * FROM items ${whereClause} ${orderBy} ${limitClause}`.trim(),
      queryParams
    );

    const items = result.map(parseDbItem);

    if (includeImages) {
      for (const item of items) {
        item.imageSet = await getItemImages(item.id);
      }
    }

    return items;
  }

  export async function getFilteredItemsCount(filters: ItemQueryFilters): Promise<number> {
    const database = await getDb();
    const { whereClause, params } = buildItemsWhere(filters);
    const result = await database.select<{ count: number }[]>(
      `SELECT COUNT(*) AS count FROM items ${whereClause}`.trim(),
      params
    );
    return result[0]?.count ?? 0;
  }

  export async function getItemImages(itemId: number): Promise<string[]> {
    const database = await getDb();
    const result = await database.select<{ imagePath: string }[]>(
      'SELECT imagePath FROM item_images WHERE itemId = $1 ORDER BY imageOrder',
      [itemId]
    );
    return result.map((row: { imagePath: string }) => row.imagePath);
  }

  export async function addItem(item: Item): Promise<number> {
    const database = await getDb();
    const result = await database.execute(
      `INSERT INTO items (title, description, lastUpdated, coverImage, status, mediaType, tags, progress, ongoing, notes, otherNames, creators, startDate, endDate)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        item.title,
        item.description,
        item.lastUpdated,
        item.coverImage,
        item.status,
        item.mediaType,
        JSON.stringify(item.tags),
        JSON.stringify(item.progress),
        Number(item.ongoing),
        item.notes,
        JSON.stringify(item.otherNames),
        JSON.stringify(item.creators),
        item.startDate,
        item.endDate
      ]
    );

    const itemId = result.lastInsertId;
    if (itemId === undefined) {
      throw new Error('Failed to get inserted item ID');
    }

    if (item.imageSet && item.imageSet.length > 0) {
      await setItemImages(itemId, item.imageSet);
    }

    return itemId;
  }

  export async function setItemImages(itemId: number, imagePaths: string[]): Promise<void> {
    const database = await getDb();
    await database.execute('DELETE FROM item_images WHERE itemId = $1', [itemId]);
    for (let i = 0; i < imagePaths.length; i++) {
      await database.execute(
        'INSERT INTO item_images (itemId, imagePath, imageOrder) VALUES ($1, $2, $3)',
        [itemId, imagePaths[i], i]
      );
    }
  }

  export async function getItemRelations(itemId: number): Promise<ItemRelation[]> {
    const database = await getDb();
    const result = await database.select<{ relatedItemId: number; description: string }[]>(
      'SELECT relatedItemId, description FROM item_relations WHERE itemId = $1 ORDER BY id',
      [itemId]
    );
    return result.map((row) => ({
      relatedItemId: Number(row.relatedItemId),
      description: row.description ?? ''
    }));
  }

  export async function setItemRelations(itemId: number, relations: ItemRelation[]): Promise<void> {
    const database = await getDb();
    await database.execute('DELETE FROM item_relations WHERE itemId = $1', [itemId]);
    for (const relation of relations) {
      if (!relation.relatedItemId || relation.relatedItemId === itemId) {
        continue;
      }
      await database.execute(
        'INSERT OR REPLACE INTO item_relations (itemId, relatedItemId, description) VALUES ($1, $2, $3)',
        [itemId, relation.relatedItemId, relation.description.trim()]
      );
    }
  }

  export async function updateItem(item: Item): Promise<void> {
    const database = await getDb();
    await database.execute(
      `UPDATE items SET title = $1, description = $2, lastUpdated = $3, coverImage = $4, status = $5, mediaType = $6, tags = $7, progress = $8, ongoing = $9, notes = $10, otherNames = $11, creators = $12, startDate = $13, endDate = $14 WHERE id = $15`,
      [
        item.title,
        item.description,
        item.lastUpdated,
        item.coverImage,
        item.status,
        item.mediaType,
        JSON.stringify(item.tags),
        JSON.stringify(item.progress),
        Number(item.ongoing),
        item.notes,
        JSON.stringify(item.otherNames),
        JSON.stringify(item.creators),
        item.startDate,
        item.endDate,
        item.id
      ]
    );

    if (item.imageSet) {
      await setItemImages(item.id, item.imageSet);
    }
  }

  export async function deleteItem(item: Item): Promise<void> {
    const database = await getDb();
    await database.execute(
      'DELETE FROM items WHERE id = $1',
      [item.id]
    );
  }

  export async function removeTagFromAllItems(tag: Tag): Promise<number> {
    const normalizedTag = tag.trim().toLowerCase();
    if (!normalizedTag) return 0;

    const database = await getDb();
    const rows = await database.select<{ id: number; tags: string }[]>(
      'SELECT id, tags FROM items'
    );

    let updatedCount = 0;
    for (const row of rows) {
      let parsedTags: string[] = [];
      try {
        const value = JSON.parse(row.tags);
        parsedTags = Array.isArray(value) ? value : [];
      } catch {
        parsedTags = [];
      }

      const nextTags = parsedTags.filter((itemTag) => itemTag.trim().toLowerCase() !== normalizedTag);
      if (nextTags.length !== parsedTags.length) {
        await database.execute('UPDATE items SET tags = $1 WHERE id = $2', [
          JSON.stringify(nextTags),
          row.id
        ]);
        updatedCount += 1;
      }
    }

    return updatedCount;
  }

  export default {}
</script>
