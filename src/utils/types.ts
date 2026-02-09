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

export enum tags {
  western = 'western',
  chinese = 'chinese',
  japanese = 'japanese',
  action = 'action',
  comedy = 'comedy',
  drama = 'drama',
  horror = 'horror',
  thriller = 'thriller',
  sciFi = 'sci-fi',
  romance = 'romance',
  fantasy = 'fantasy',
  adventure = 'adventure',
  animation = 'animation',
  documentary = 'documentary',
  crime = 'crime',
  mystery = 'mystery',
  family = 'family',
  musical = 'musical',
  war = 'war',
  historical = 'historical',
  wuxia = 'wuxia',
  xianxia = 'xianxia',
  josei = 'josei',
  shoujo = 'shoujo',
  shounen = 'shounen',
  seinen = 'seinen',
  isekai = 'isekai',
  sliceOfLife = 'slice-of-life',
  sports = 'sports',
  mecha = 'mecha',
  school = 'school',
  psychological = 'psychological',
  supernatural = 'supernatural',
  regression = 'regression',
  cultivation = 'cultivation',
  other = 'other',
}

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
  type: progressType;
}

export interface Item {
  id: number;
  title: string;
  description: string;
  lastUpdated: string;
  coverImage: string;
  status: status;
  mediaType: mediaType;
  tags: tags[];
  progress: progress[];
  imageSet: string[];
  notes: string;
  otherNames: string[];
  creators: string[];
  startDate: string;
  endDate: string;
  ongoing: boolean;
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

