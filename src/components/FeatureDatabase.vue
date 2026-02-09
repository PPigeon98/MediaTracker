<script lang="ts">
  import Database from '@tauri-apps/plugin-sql';
  import { mediaType, status, type progress, type Item } from '../utils/types';

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
    }
    return db;
  }

  export { progressType, mediaType, tags, status, type progress, type Item } from '../utils/types';

  export async function getItems(includeImages: boolean = false): Promise<Item[]> {
    const database = await getDb();
    const result = await database.select<any[]>(
      'SELECT * FROM items ORDER BY title COLLATE NOCASE'
    );

    const items = result.map((item: any) => ({
      ...item,
      status: item.status as status,
      mediaType: item.mediaType as mediaType,
      ongoing: Boolean(item.ongoing),
      tags: JSON.parse(item.tags),
      progress: JSON.parse(item.progress) as progress[],
      otherNames: JSON.parse(item.otherNames),
      creators: JSON.parse(item.creators),
      imageSet: [] as string[]
    }));

    if (includeImages) {
      for (const item of items) {
        item.imageSet = await getItemImages(item.id);
      }
    }

    return items;
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

  export default {}
</script>
