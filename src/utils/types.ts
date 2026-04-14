// Enums
export enum progressType {
  episode = 0,
  chapter = 1,
  volume = 2,
  page = 3,
  season = 4,
  arc = 5,
  part = 6,
}

export enum mediaType {
  anime = 0,
  manga = 1,
  manhua = 2,
  manhwa = 3,
  lightNovel = 4,
  webNovel = 5,
  movie = 6,
  series = 7,
  novel = 8,
  textbook = 9,
  game = 10,
  other = 11,
}

export type Tag = string

export enum status {
  tracking = 0,
  completed = 1,
  onHold = 2,
  dropped = 3,
  planned = 4,
}

// Interfaces
export interface progress {
  current: number;
  max: number;
  type: progressType | string;
  hiddenInCard?: boolean;
}

export interface Item {
  id: number;
  title: string;
  description: string;
  lastUpdated: string;
  coverImage: string;
  status: status;
  mediaType: mediaType;
  tags: Tag[];
  progress: progress[];
  imageSet: string[];
  notes: string;
  otherNames: string[];
  creators: string[];
  startDate: string;
  endDate: string;
  ongoing: boolean;
  flagLabel?: 'ongoing' | 'downloaded';
}

export interface SelectOption {
  value: string | number;
  label: string;
}

export type SortBy = 'lastUpdated' | 'title'

// Utility functions
export function getNumericEnumValues<T extends Record<string, number | string>>(enumObject: T): number[] {
  return Object.values(enumObject).filter(v => typeof v === 'number') as number[]
}

export function sortItems(items: Item[], sortBy: SortBy): Item[] {
  return [...items].sort((a, b) => {
    if (sortBy === 'title') {
      return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
    } else {
      return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
    }
  })
}

export function isExternalImage(path: string): boolean {
  return path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:image/')
}

export function splitLines(value: string): string[] {
  return value.split('\n').filter(Boolean)
}

// Label Mappings
export const progressTypeLabels: Record<progressType, string> = {
  [progressType.episode]: 'Episodes',
  [progressType.chapter]: 'Chapters',
  [progressType.volume]: 'Volumes',
  [progressType.page]: 'Pages',
  [progressType.season]: 'Seasons',
  [progressType.arc]: 'Arcs',
  [progressType.part]: 'Parts',
}

export const progressTypeLabelsLowercase: Record<progressType, string> = {
  [progressType.episode]: 'episodes',
  [progressType.chapter]: 'chapters',
  [progressType.volume]: 'volumes',
  [progressType.page]: 'pages',
  [progressType.season]: 'seasons',
  [progressType.arc]: 'arcs',
  [progressType.part]: 'parts',
}

export function isBuiltInProgressType(value: unknown): value is progressType {
  return typeof value === 'number' && getNumericEnumValues(progressType).includes(value)
}

export function getProgressTypeLabel(value: progressType | string, lowercase = false): string {
  if (isBuiltInProgressType(value)) {
    return lowercase ? progressTypeLabelsLowercase[value] : progressTypeLabels[value]
  }

  const label = String(value || '').trim()
  if (!label) return lowercase ? 'parts' : 'Parts'
  return lowercase ? label.toLowerCase() : label
}

function toNonNegativeNumber(value: unknown, fallback: number): number {
  const num = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(num)) return fallback
  return Math.max(0, num)
}

export function normalizeProgressEntries(raw: unknown): progress[] {
  if (!Array.isArray(raw)) return []

  return raw.map((entry: any) => {
    const max = toNonNegativeNumber(entry?.max, 1)
    const current = Math.min(toNonNegativeNumber(entry?.current, 0), max)

    let type: progressType | string
    if (isBuiltInProgressType(entry?.type)) {
      type = entry.type
    } else if (typeof entry?.type === 'string' && entry.type.trim()) {
      type = entry.type.trim()
    } else {
      type = progressType.part
    }

    return {
      current,
      max,
      type,
      hiddenInCard: entry?.hiddenInCard === true,
    }
  })
}

export const mediaTypeLabels: Record<mediaType, string> = {
  [mediaType.anime]: 'Anime',
  [mediaType.manga]: 'Manga',
  [mediaType.manhua]: 'Manhua',
  [mediaType.manhwa]: 'Manhwa',
  [mediaType.lightNovel]: 'Light Novel',
  [mediaType.webNovel]: 'Web Novel',
  [mediaType.movie]: 'Movie',
  [mediaType.series]: 'Series',
  [mediaType.novel]: 'Novel',
  [mediaType.textbook]: 'Textbook',
  [mediaType.game]: 'Game',
  [mediaType.other]: 'Other',
}

export const statusLabels: Record<status, string> = {
  [status.tracking]: 'Tracking',
  [status.completed]: 'Completed',
  [status.onHold]: 'On Hold',
  [status.dropped]: 'Dropped',
  [status.planned]: 'Planned',
}

export const typeVariableNames: Record<mediaType, string> = {
  [mediaType.anime]: 'anime',
  [mediaType.manga]: 'manga',
  [mediaType.manhua]: 'manhua',
  [mediaType.manhwa]: 'manhwa',
  [mediaType.lightNovel]: 'lightnovel',
  [mediaType.webNovel]: 'webnovel',
  [mediaType.movie]: 'movie',
  [mediaType.series]: 'series',
  [mediaType.novel]: 'novel',
  [mediaType.textbook]: 'textbook',
  [mediaType.game]: 'game',
  [mediaType.other]: 'other',
}

