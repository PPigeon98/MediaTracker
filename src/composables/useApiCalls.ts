import { type Item, mediaType, status, type Tag, progressType } from '../utils/types'
import { invoke } from '@tauri-apps/api/core'

// TODO: Re-enable tag mapping from country/genre (restore mapCountryToTag / mapGenreToTag + call sites below).

type ApiKeys = {
  tmdb?: string;
  neodb?: string;
  hardcover?: string;
  rawg?: string;
}

function normalizeApiKey(raw: unknown): string {
  if (typeof raw !== 'string') return ''
  const trimmed = raw.trim()
  if (!trimmed) return ''
  return trimmed.replace(/^Bearer\s+/i, '').trim()
}

function getApiKeys(): ApiKeys {
  const saved = localStorage.getItem('apiKeys')
  if (!saved) return {}

  try {
    const parsed = JSON.parse(saved)
    // Backward compatibility: old format stored only TMDB key as a string.
    if (typeof parsed === 'string') {
      return { tmdb: normalizeApiKey(parsed) }
    }
    if (parsed && typeof parsed === 'object') {
      const keys = parsed as ApiKeys
      return {
        tmdb: normalizeApiKey(keys.tmdb),
        neodb: normalizeApiKey(keys.neodb),
        hardcover: normalizeApiKey(keys.hardcover),
        rawg: normalizeApiKey(keys.rawg),
      }
    }
  } catch {
    return {}
  }

  return {}
}

function getTmdbApiKey(): string | null {
  return getApiKeys().tmdb || null
}

function getNeoDbAccessToken(): string | null {
  return getApiKeys().neodb || null
}

function getHardcoverApiKey(): string | null {
  return getApiKeys().hardcover || null
}

function getRawgApiKey(): string | null {
  return getApiKeys().rawg || null
}

export async function anilistSearch(searchInput: string) {
  const query = `
    query ($search: String!) {
      Page {
        media(search: $search, isAdult: false) {
          title {
            romaji
            english
            native
          }
          type
          episodes
          chapters
          genres
          tags {
            name
          }
          countryOfOrigin
          coverImage {
            extraLarge
          }
          startDate {
            year
            month
            day
          }
          endDate {
            year
            month
            day
          }
          description
          bannerImage
          synonyms
          studios {
            edges {
              isMain
              node {
                name
              }
            }
          }
          staff {
            edges {
              role
              node {
                name {
                  full
                }
              }
            }
          }
        }
      }
    }
  `;

  const response = await fetch(`https://graphql.anilist.co`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ query: query, variables: { search: searchInput } }),
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const data = await response.json()
  return data
}

export async function tmdbMovieSearch(searchInput: string) {
  const apiKey = getTmdbApiKey()
  if (!apiKey) {
    return { results: [] }
  }

  const response = await fetch(
    `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(searchInput)}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'accept': 'application/json',
      },
    }
  )

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const data = await response.json()
  return data
}

export async function tmdbSeriesSearch(searchInput: string) {
  const apiKey = getTmdbApiKey()
  if (!apiKey) {
    return { results: [] }
  }

  const response = await fetch(
    `https://api.themoviedb.org/3/search/tv?query=${encodeURIComponent(searchInput)}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'accept': 'application/json',
      },
    }
  )

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const data = await response.json()
  return data
}

export async function tmdbMovieDetails(movieId: number) {
  try {
    const apiKey = getTmdbApiKey()

    if (!apiKey) {
      throw new Error('TMDB API key is missing')
    }

    const response = await fetch(
      `https://api.themoviedb.org/3/movie/${movieId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'accept': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('TMDB Movie Details API error:', error)
    throw error
  }
}

export async function tmdbSeriesDetails(seriesId: number) {
  try {
    const apiKey = getTmdbApiKey()

    if (!apiKey) {
      throw new Error('TMDB API key is missing')
    }

    const response = await fetch(
      `https://api.themoviedb.org/3/tv/${seriesId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'accept': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('TMDB Series Details API error:', error)
    throw error
  }
}

export async function googlebooksSearch(searchInput: string) {
  const response = await fetch(
    `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchInput)}`,
    {
      method: 'GET',
      headers: {
        'accept': 'application/json',
      },
    }
  )

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const data = await response.json()
  return data
}

export async function openLibrarySearch(searchInput: string) {
  const response = await fetch(
    `https://openlibrary.org/search.json?q=${encodeURIComponent(searchInput)}&limit=50`,
    {
      method: 'GET',
      headers: {
        accept: 'application/json',
      },
    }
  )

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return response.json()
}

export async function hardcoverBooksSearch(searchInput: string) {
  const apiKey = getHardcoverApiKey()
  if (!apiKey) {
    return { data: { search: { results: [] } } }
  }

  const response = await invoke('hardcover_search_books', {
    apiKey,
    query: searchInput,
  })
  return response
}

export async function rawgGamesSearch(searchInput: string) {
  const apiKey = getRawgApiKey()
  if (!apiKey) {
    return { results: [] }
  }

  const q = encodeURIComponent(searchInput.trim())
  const response = await fetch(
    `https://api.rawg.io/api/games?search=${q}&page_size=25&key=${encodeURIComponent(apiKey)}`,
    {
      method: 'GET',
      headers: {
        accept: 'application/json',
      },
    }
  )

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return response.json()
}

export async function modrinthProjectsSearch(searchInput: string) {
  const response = await invoke('modrinth_search_projects', {
    query: searchInput,
  })
  return response
}

export async function neoDbSearch(searchInput: string) {
  const token = getNeoDbAccessToken()
  if (!token) {
    return { data: [] }
  }

  const headers = {
    accept: 'application/json',
    authorization: `Bearer ${token}`,
  }

  const firstResponse = await fetch(
    `https://neodb.social/api/catalog/search?query=${encodeURIComponent(searchInput)}&page=1`,
    { method: 'GET', headers }
  )
  if (!firstResponse.ok) {
    throw new Error(`HTTP error! status: ${firstResponse.status}`)
  }
  const firstPage = await firstResponse.json()

  const allData: any[] = Array.isArray(firstPage?.data) ? [...firstPage.data] : []
  const totalPages = Number(firstPage?.pages || 1)
  const pagesToFetch = Math.min(Math.max(totalPages, 1), 5)

  for (let page = 2; page <= pagesToFetch; page++) {
    const response = await fetch(
      `https://neodb.social/api/catalog/search?query=${encodeURIComponent(searchInput)}&page=${page}`,
      { method: 'GET', headers }
    )
    if (!response.ok) continue
    const pageJson = await response.json()
    if (Array.isArray(pageJson?.data)) {
      allData.push(...pageJson.data)
    }
  }

  const seen = new Set<string>()
  const deduped = allData.filter((entry: any) => {
    const key =
      entry?.uuid ||
      entry?.id ||
      entry?.url ||
      `${entry?.title || entry?.name || ''}|${entry?.cover_image_url || entry?.cover_image || ''}`
    if (!key) return true
    if (seen.has(String(key))) return false
    seen.add(String(key))
    return true
  })

  return { data: deduped, pages: totalPages, count: deduped.length }
}

const JIKAN_BASE = 'https://api.jikan.moe/v4'

function jikanFetch(pathWithQuery: string) {
  return fetch(`${JIKAN_BASE}${pathWithQuery}`, {
    method: 'GET',
    headers: { accept: 'application/json' },
  })
}

export async function jikanAnimeSearch(searchInput: string) {
  const q = encodeURIComponent(searchInput.trim())
  const response = await jikanFetch(`/anime?q=${q}&limit=25&sfw=true`)

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return response.json()
}

export async function jikanMangaSearch(searchInput: string) {
  const q = encodeURIComponent(searchInput.trim())
  const response = await jikanFetch(`/manga?q=${q}&limit=25&sfw=true`)

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return response.json()
}

function stripJikanSynopsis(raw: string | null | undefined): string {
  if (!raw) return ''
  return raw
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function datePrefix(iso: string | null | undefined): string {
  if (!iso) return ''
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(iso)
  return m ? m[1] : ''
}

function jikanLargeCover(images: { jpg?: { large_image_url?: string }; webp?: { large_image_url?: string } } | undefined): string {
  return images?.jpg?.large_image_url || images?.webp?.large_image_url || ''
}

function parseJikanAnime(data: any): Item[] {
  if (!data?.data?.length) return []

  return data.data.map((a: any) => {
    const studios = ((a.studios as { name?: string }[] | undefined) ?? [])
      .map(s => s.name)
      .filter((n): n is string => Boolean(n))
    const other: string[] = [
      a.title_english,
      a.title_japanese,
      ...(a.title_synonyms || []),
    ].filter(Boolean)

    const maxEp = typeof a.episodes === 'number' && a.episodes > 0 ? a.episodes : 1
    const ongoing = a.airing === true || a.status === 'Currently Airing'

    return {
      id: -1,
      title: a.title || 'Unknown',
      description: stripJikanSynopsis(a.synopsis),
      lastUpdated: new Date().toISOString(),
      coverImage: jikanLargeCover(a.images),
      status: status.planned,
      mediaType: mediaType.anime,
      tags: [] as Tag[],
      progress: [{
        current: 0,
        max: maxEp,
        type: progressType.episode,
      }],
      ongoing,
      imageSet: [] as string[],
      notes: '',
      otherNames: other,
      creators: studios,
      startDate: datePrefix(a.aired?.from),
      endDate: datePrefix(a.aired?.to),
    }
  })
}

function parseJikanManga(data: any): Item[] {
  if (!data?.data?.length) return []

  return data.data.map((m: any) => {
    const authors = ((m.authors as { name?: string }[] | undefined) ?? [])
      .map(x => x.name)
      .filter((n): n is string => Boolean(n))
    const other: string[] = [
      m.title_english,
      m.title_japanese,
      ...(m.title_synonyms || []),
    ].filter(Boolean)

    const maxCh = typeof m.chapters === 'number' && m.chapters > 0 ? m.chapters : 1
    const ongoing = m.publishing === true || m.status === 'Publishing'

    return {
      id: -1,
      title: m.title || 'Unknown',
      description: stripJikanSynopsis(m.synopsis),
      lastUpdated: new Date().toISOString(),
      coverImage: jikanLargeCover(m.images),
      status: status.planned,
      mediaType: mediaType.manga,
      tags: [] as Tag[],
      progress: [{
        current: 0,
        max: maxCh,
        type: progressType.chapter,
      }],
      ongoing,
      imageSet: [] as string[],
      notes: '',
      otherNames: other,
      creators: authors,
      startDate: datePrefix(m.published?.from),
      endDate: datePrefix(m.published?.to),
    }
  })
}

// Tag mapping helpers are temporarily disabled.
// function mapCountryToTag(countryOfOrigin: string | null | undefined): Tag | null {
//   if (!countryOfOrigin) return null
//
//   const country = countryOfOrigin.toLowerCase()
//   if (country === 'jp' || country === 'japan' || country === 'ja') {
//     return 'japanese'
//   } else if (country === 'cn' || country === 'china' || country === 'zh' || country === 'hk') {
//     return 'chinese'
//   } else if (country === 'us' || country === 'uk' || country === 'gb' || country === 'ca' || country === 'au' ||
//            country === 'united states' || country === 'united kingdom' || country === 'canada' ||
//            country === 'australia' || country === 'nz' || country === 'new zealand' ||
//            country === 'en' || country === 'english') {
//     return 'western'
//   }
//   return null
// }
//
// function mapGenreToTag(genre: string | null | undefined): Tag | null {
//   if (!genre) return null
//
//   const normalized = genre.toLowerCase().trim()
//
//   const genreMap: Record<string, Tag> = {
//     'action': 'action',
//     'comedy': 'comedy',
//     'drama': 'drama',
//     'horror': 'horror',
//     'thriller': 'thriller',
//     'sci-fi': 'sci-fi',
//     'science fiction': 'sci-fi',
//     'scifi': 'sci-fi',
//     'romance': 'romance',
//     'fantasy': 'fantasy',
//     'adventure': 'adventure',
//     'animation': 'animation',
//     'animated': 'animation',
//     'documentary': 'documentary',
//     'crime': 'crime',
//     'mystery': 'mystery',
//     'family': 'family',
//     'musical': 'musical',
//     'war': 'war',
//     'historical': 'historical',
//     'history': 'historical',
//     'wuxia': 'wuxia',
//     'xianxia': 'xianxia',
//     'josei': 'josei',
//     'shoujo': 'shoujo',
//     'shounen': 'shounen',
//     'shonen': 'shounen',
//     'seinen': 'seinen',
//     'isekai': 'isekai',
//     'slice-of-life': 'slice-of-life',
//     'slice of life': 'slice-of-life',
//     'sol': 'slice-of-life',
//     'sports': 'sports',
//     'sport': 'sports',
//     'mecha': 'mecha',
//     'mech': 'mecha',
//     'school': 'school',
//     'psychological': 'psychological',
//     'supernatural': 'supernatural',
//     'regression': 'regression',
//     'cultivation': 'cultivation',
//   }
//
//   return genreMap[normalized] || null
// }

function parseAnilist(data: any): Item[] {
  if (!data?.data?.Page?.media) return []

  return data.data.Page.media.map((media: any) => {
    // Tag mapping temporarily disabled.
    // const countryTag = mapCountryToTag(media.countryOfOrigin)
    // const tagArray = countryTag ? [countryTag] : []
    //
    // if (media.genres) {
    //   for (const genre of media.genres) {
    //     const mappedTag = mapGenreToTag(genre)
    //     if (mappedTag && !tagArray.includes(mappedTag)) {
    //       tagArray.push(mappedTag)
    //     }
    //   }
    // }
    //
    // if (media.tags) {
    //   for (const tag of media.tags) {
    //     const mappedTag = mapGenreToTag(tag.name)
    //     if (mappedTag && !tagArray.includes(mappedTag)) {
    //       tagArray.push(mappedTag)
    //     }
    //   }
    // }
    const tagArray: Tag[] = []

    const creators: string[] = []

    if (media.type === 'ANIME' && media.studios?.edges) {
      // For anime: get main studios
      const mainStudios = media.studios.edges
        .filter((edge: any) => edge.isMain)
        .map((edge: any) => edge.node?.name)
        .filter(Boolean)
      creators.push(...mainStudios)
    } else if (media.type === 'MANGA' && media.staff?.edges) {
      // For manga: get authors (Story & Art, Story, Art roles)
      const authorRoles = ['Story & Art', 'Story', 'Art', 'Original Creator']
      const authors = media.staff.edges
        .filter((edge: any) => authorRoles.includes(edge.role))
        .map((edge: any) => edge.node?.name?.full || edge.node?.name)
        .filter(Boolean)
      creators.push(...authors)
    }

    return {
      id: -1,
      title: media.title?.romaji || media.title?.english || media.title?.native || 'Unknown',
      description: media.description || '',
      lastUpdated: new Date().toISOString(),
      coverImage: media.coverImage?.extraLarge || '',
      status: status.planned,
      mediaType: media.type === 'ANIME' ? mediaType.anime :
                 media.type === 'MANGA' ? mediaType.manga : mediaType.other,
      tags: tagArray,
      progress: [{
        current: 0,
        max: media.episodes || media.chapters || 1,
        type: media.type === 'ANIME' ? progressType.episode : progressType.chapter
      }],
      ongoing: false,
      imageSet: [media.bannerImage || ''],
      notes: '',
      otherNames: [
        media.title?.romaji,
        media.title?.english,
        media.title?.native,
        ...(media.synonyms || [])
      ].filter(Boolean) as string[],
      creators: creators,
      startDate: media.startDate?.year && media.startDate?.month && media.startDate?.day
        ? `${media.startDate.year}-${String(media.startDate.month).padStart(2, '0')}-${String(media.startDate.day).padStart(2, '0')}`
        : '',
      endDate: media.endDate?.year && media.endDate?.month && media.endDate?.day
        ? `${media.endDate.year}-${String(media.endDate.month).padStart(2, '0')}-${String(media.endDate.day).padStart(2, '0')}`
        : ''
    }
  })
}

async function parseTmdbMovies(searchData: any): Promise<Item[]> {
  if (!searchData?.results) return []

  const items: Item[] = []
  for (const movie of searchData.results) {
    // Tag mapping temporarily disabled.
    // const countryTag = mapCountryToTag(movie.origin_country?.[0] || movie.production_countries?.[0]?.iso_3166_1)
    // const tagArray = countryTag ? [countryTag] : []
    const tagArray: Tag[] = []

    const baseItem = {
      id: -1,
      title: movie.title || 'Unknown',
      description: movie.overview || '',
      lastUpdated: new Date().toISOString(),
      coverImage: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '',
      status: status.planned,
      mediaType: mediaType.movie,
      tags: tagArray,
      progress: [{
        current: 0,
        max: 1,
        type: progressType.episode
      }],
      ongoing: false,
      imageSet: [movie.backdrop_path ? `https://image.tmdb.org/t/p/w500${movie.backdrop_path}` : '',
                 movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : ''].filter(Boolean),
      notes: '',
      otherNames: [] as string[],
      creators: [] as string[],
      startDate: movie.release_date || '',
      endDate: ''
    }

    // Fetch detailed information for additional data
    try {
      const details = await tmdbMovieDetails(movie.id)
      if (details.original_title && details.original_title !== details.title) {
        baseItem.otherNames.push(details.original_title)
      }
      if (details.production_companies) {
        baseItem.creators = details.production_companies.map((company: any) => company.name)
      }
      if (details.release_date) {
        baseItem.startDate = details.release_date
      }
      // Tag mapping temporarily disabled.
      // if (details.genres) {
      //   for (const genre of details.genres) {
      //     const mappedTag = mapGenreToTag(genre.name)
      //     if (mappedTag && !baseItem.tags.includes(mappedTag)) {
      //       baseItem.tags.push(mappedTag)
      //     }
      //   }
      // }
    } catch (error) {
      console.error(`Failed to fetch details for movie ${movie.id}:`, error)
    }

    items.push(baseItem)
  }
  return items
}

async function parseTmdbSeries(searchData: any): Promise<Item[]> {
  if (!searchData?.results) return []

  const items: Item[] = []
  for (const series of searchData.results) {
    // Tag mapping temporarily disabled.
    // const countryTag = mapCountryToTag(series.origin_country?.[0] || series.production_countries?.[0]?.iso_3166_1)
    // const tagArray = countryTag ? [countryTag] : []
    const tagArray: Tag[] = []

    const baseItem = {
      id: -1,
      title: series.name || 'Unknown',
      description: series.overview || '',
      lastUpdated: new Date().toISOString(),
      coverImage: series.poster_path ? `https://image.tmdb.org/t/p/w500${series.poster_path}` : '',
      status: status.planned,
      mediaType: mediaType.series,
      tags: tagArray,
      progress: [{
        current: 0,
        max: series.number_of_episodes || 1,
        type: progressType.episode
      }],
      ongoing: false,
      imageSet: [series.backdrop_path ? `https://image.tmdb.org/t/p/w500${series.backdrop_path}` : '',
                 series.poster_path ? `https://image.tmdb.org/t/p/w500${series.poster_path}` : ''].filter(Boolean),
      notes: '',
      otherNames: [] as string[],
      creators: [] as string[],
      startDate: series.first_air_date || '',
      endDate: series.last_air_date || ''
    }

    // Fetch detailed information for additional data
    try {
      const details = await tmdbSeriesDetails(series.id)
      if (details.original_name && details.original_name !== details.name) {
        baseItem.otherNames.push(details.original_name)
      }
      if (details.production_companies) {
        baseItem.creators = details.production_companies.map((company: any) => company.name)
      }
      if (details.first_air_date) {
        baseItem.startDate = details.first_air_date
      }
      if (details.last_air_date) {
        baseItem.endDate = details.last_air_date
      }
      if (details.number_of_episodes) {
        if (baseItem.progress.length > 0) {
          baseItem.progress[0].max = details.number_of_episodes
        }
      }
      // Tag mapping temporarily disabled.
      // if (details.genres) {
      //   for (const genre of details.genres) {
      //     const mappedTag = mapGenreToTag(genre.name)
      //     if (mappedTag && !baseItem.tags.includes(mappedTag)) {
      //       baseItem.tags.push(mappedTag)
      //     }
      //   }
      // }
    } catch (error) {
      console.error(`Failed to fetch details for series ${series.id}:`, error)
    }

    items.push(baseItem)
  }
  return items
}

function parseGoogleBooks(data: any): Item[] {
  if (!data?.items) return []
  return data.items.map((book: any) => {
    // Tag mapping temporarily disabled.
    // const countryTag = mapCountryToTag(book.volumeInfo?.country || book.saleInfo?.country)
    // const tagArray = countryTag ? [countryTag] : []
    //
    // if (book.volumeInfo?.categories) {
    //   for (const category of book.volumeInfo.categories) {
    //     const mappedTag = mapGenreToTag(category)
    //     if (mappedTag && !tagArray.includes(mappedTag)) {
    //       tagArray.push(mappedTag)
    //     }
    //   }
    // }
    const tagArray: Tag[] = []

    return {
      id: -1,
      title: book.volumeInfo?.title || 'Unknown',
      description: book.volumeInfo?.description || '',
      lastUpdated: new Date().toISOString(),
      coverImage: book.volumeInfo?.imageLinks?.thumbnail ||
                 book.volumeInfo?.imageLinks?.smallThumbnail || '',
      status: status.planned,
      mediaType: mediaType.novel,
      tags: tagArray,
      progress: [{
        current: 0,
        max: book.volumeInfo?.pageCount || 1,
        type: progressType.page
      }],
      ongoing: false,
      imageSet: [],
      notes: '',
      otherNames: [],
      creators: book.volumeInfo?.authors || [],
      startDate: book.volumeInfo?.publishedDate || '',
      endDate: ''
    }
  })
}

function parseOpenLibrary(data: any): Item[] {
  if (!Array.isArray(data?.docs)) return []

  return data.docs.map((book: any) => {
    const coverImage = typeof book?.cover_i === 'number'
      ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`
      : ''

    return {
      id: -1,
      title: book?.title || 'Unknown',
      description: '',
      lastUpdated: new Date().toISOString(),
      coverImage,
      status: status.planned,
      mediaType: mediaType.novel,
      tags: [] as Tag[],
      progress: [{
        current: 0,
        max: typeof book?.number_of_pages_median === 'number' && book.number_of_pages_median > 0
          ? book.number_of_pages_median
          : 1,
        type: progressType.page
      }],
      ongoing: false,
      flagLabel: 'ongoing' as const,
      imageSet: coverImage ? [coverImage] : [],
      notes: '',
      otherNames: Array.isArray(book?.alternative_title) ? book.alternative_title : [],
      creators: Array.isArray(book?.author_name) ? book.author_name : [],
      startDate: typeof book?.first_publish_year === 'number' ? String(book.first_publish_year) : '',
      endDate: ''
    }
  })
}

function parseRawgGames(data: any): Item[] {
  if (!Array.isArray(data?.results)) return []

  return data.results.map((game: any) => {
    const coverImage = typeof game?.background_image === 'string' ? game.background_image : ''
    const developers = Array.isArray(game?.developers)
      ? game.developers.map((d: any) => d?.name).filter(Boolean)
      : []
    const genres = Array.isArray(game?.genres)
      ? game.genres.map((g: any) => g?.name).filter(Boolean)
      : []
    const metacritic = typeof game?.metacritic === 'number' ? game.metacritic : null
    const notes = [
      game?.slug ? `RAWG: https://rawg.io/games/${game.slug}` : '',
      metacritic !== null ? `Metacritic: ${metacritic}` : '',
    ].filter(Boolean).join('\n')

    return {
      id: -1,
      title: game?.name || 'Unknown',
      description: '',
      lastUpdated: new Date().toISOString(),
      coverImage,
      status: status.planned,
      mediaType: mediaType.game,
      tags: genres as Tag[],
      progress: [{
        current: 0,
        max: 1,
        type: progressType.part,
      }],
      ongoing: false,
      flagLabel: 'downloaded' as const,
      imageSet: coverImage ? [coverImage] : [],
      notes,
      otherNames: [],
      creators: developers as string[],
      startDate: typeof game?.released === 'string' ? game.released : '',
      endDate: '',
    }
  })
}

function parseModrinthProjects(data: any): Item[] {
  const rows = Array.isArray(data?.hits) ? data.hits : []
  return rows.map((project: any) => {
    const title = project?.title || project?.name || 'Unknown'
    const description = project?.description || ''
    const coverImage = typeof project?.icon_url === 'string' ? project.icon_url : ''
    const categories = Array.isArray(project?.categories)
      ? project.categories.map((x: unknown) => String(x)).filter(Boolean)
      : []
    const versions = Array.isArray(project?.versions)
      ? project.versions.map((x: unknown) => String(x)).filter(Boolean)
      : []
    const loaders = Array.isArray(project?.display_categories)
      ? project.display_categories
        .map((x: unknown) => String(x))
        .filter((x: string) => x !== 'mod' && x !== 'modpack')
      : []
    const projectType = typeof project?.project_type === 'string' ? project.project_type : ''
    const slug = typeof project?.slug === 'string' ? project.slug : ''
    const notes = [
      projectType ? `Type: ${projectType}` : '',
      versions.length ? `Versions: ${versions.join(', ')}` : '',
      loaders.length ? `Loaders: ${loaders.join(', ')}` : '',
      slug ? `Modrinth: https://modrinth.com/${projectType || 'project'}/${slug}` : '',
    ].filter(Boolean).join('\n')

    return {
      id: -1,
      title,
      description,
      lastUpdated: new Date().toISOString(),
      coverImage,
      status: status.planned,
      mediaType: mediaType.game,
      tags: categories as Tag[],
      progress: [{
        current: 0,
        max: 1,
        type: progressType.part,
      }],
      ongoing: false,
      flagLabel: 'downloaded' as const,
      imageSet: coverImage ? [coverImage] : [],
      notes,
      otherNames: [],
      creators: [],
      startDate: '',
      endDate: '',
    }
  })
}

function parseHardcoverBooks(data: any): Item[] {
  const results = data?.data?.search?.results
  const rows = Array.isArray(results)
    ? results
    : Array.isArray(results?.hits)
      ? results.hits.map((hit: any) => hit?.document ?? hit)
      : []
  if (!rows.length) return []

  function normalizeImageUrl(value: unknown): string {
    if (typeof value !== 'string') return ''
    const trimmed = value.trim()
    if (!trimmed) return ''
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed
    if (trimmed.startsWith('//')) return `https:${trimmed}`
    if (trimmed.startsWith('/')) return `https://hardcover.app${trimmed}`
    return ''
  }

  function isLikelyImageUrl(value: unknown): value is string {
    if (typeof value !== 'string') return false
    const trimmed = value.trim()
    if (
      !trimmed.startsWith('http://')
      && !trimmed.startsWith('https://')
      && !trimmed.startsWith('//')
      && !trimmed.startsWith('/')
    ) {
      return false
    }
    return /(\.jpg|\.jpeg|\.png|\.webp|\.gif)(\?|$)/i.test(trimmed)
      || /image|cover|cdn|img/i.test(trimmed)
  }

  function findCoverImage(value: unknown, depth = 0): string {
    if (depth > 5 || value === null || value === undefined) return ''
    if (isLikelyImageUrl(value)) return normalizeImageUrl(value)

    if (Array.isArray(value)) {
      for (const item of value) {
        const found = findCoverImage(item, depth + 1)
        if (found) return found
      }
      return ''
    }

    if (typeof value === 'object') {
      const obj = value as Record<string, unknown>

      const preferredKeys = [
        'cover_image_url',
        'cover_url',
        'image_url',
        'image',
        'cover',
        'large',
        'thumbnail',
        'url'
      ]

      for (const key of preferredKeys) {
        if (key in obj) {
          const found = findCoverImage(obj[key], depth + 1)
          if (found) return found
        }
      }

      for (const key of Object.keys(obj)) {
        const found = findCoverImage(obj[key], depth + 1)
        if (found) return found
      }
    }

    return ''
  }

  const parsed = rows.map((book: any) => {
    const releaseYear = typeof book?.release_year === 'number' ? String(book.release_year) : ''
    const isbns = Array.isArray(book?.isbns)
      ? book.isbns.filter((isbn: unknown): isbn is string => typeof isbn === 'string' && Boolean(isbn))
      : []
    const coverImage = findCoverImage(book) ||
      normalizeImageUrl(book?.image?.url) ||
      normalizeImageUrl(book?.image?.cover?.url) ||
      normalizeImageUrl(book?.image_url) ||
      normalizeImageUrl(book?.cover_image_url) ||
      normalizeImageUrl(book?.cover_url) ||
      normalizeImageUrl(book?.cover?.url) ||
      normalizeImageUrl(book?.default_edition?.image?.url) ||
      normalizeImageUrl(book?.default_cover_edition?.image?.url) ||
      (isbns.length > 0 ? `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(isbns[0])}-L.jpg` : '')

    const description =
      (typeof book?.description === 'string' && book.description) ||
      (typeof book?.subtitle === 'string' && book.subtitle) ||
      ''

    const authors = Array.isArray(book?.author_names)
      ? book.author_names.filter((a: unknown): a is string => typeof a === 'string' && Boolean(a))
      : []

    return {
      id: -1,
      title: book?.title || 'Unknown',
      description,
      lastUpdated: new Date().toISOString(),
      coverImage,
      status: status.planned,
      mediaType: mediaType.novel,
      tags: [] as Tag[],
      progress: [{
        current: 0,
        max: typeof book?.pages === 'number' && book.pages > 0 ? book.pages : 1,
        type: progressType.page,
      }],
      ongoing: false,
      flagLabel: 'ongoing' as const,
      imageSet: coverImage ? [coverImage] : [],
      notes: '',
      otherNames: [],
      creators: authors,
      startDate: releaseYear,
      endDate: '',
    }
  })
  return parsed
}

function extractNeoDbItems(data: any): any[] {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.results)) return data.results
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.book)) return data.book
  return []
}

function mapNeoDbCategoryToMedia(categoryRaw: unknown): { media: mediaType; progress: progressType } {
  const category = String(categoryRaw || '').toLowerCase().trim()
  if (category.includes('movie') || category === 'film') {
    return { media: mediaType.movie, progress: progressType.part }
  }
  if (category.includes('tv') || category.includes('series') || category.includes('show') || category.includes('season')) {
    return { media: mediaType.series, progress: progressType.episode }
  }
  if (category.includes('anime')) {
    return { media: mediaType.anime, progress: progressType.episode }
  }
  if (category.includes('manga') || category.includes('comic')) {
    return { media: mediaType.manga, progress: progressType.chapter }
  }
  if (category.includes('game')) {
    return { media: mediaType.game, progress: progressType.part }
  }
  if (category.includes('podcast') || category.includes('album') || category.includes('music') || category.includes('performance')) {
    return { media: mediaType.other, progress: progressType.part }
  }
  if (category.includes('book') || category.includes('edition') || category.includes('novel') || category.includes('text')) {
    return { media: mediaType.novel, progress: progressType.page }
  }
  return { media: mediaType.other, progress: progressType.part }
}

function parseNeoDb(data: any): Item[] {
  const rows = extractNeoDbItems(data)
  return rows.map((entry: any) => {
    const title = entry?.title || entry?.name || entry?.display_title || 'Unknown'
    const creators = [
      ...(Array.isArray(entry?.authors) ? entry.authors : []),
      ...(Array.isArray(entry?.author) ? entry.author : []),
      ...(Array.isArray(entry?.director) ? entry.director : []),
      ...(Array.isArray(entry?.artist) ? entry.artist : []),
      ...(Array.isArray(entry?.developer) ? entry.developer : []),
      ...(Array.isArray(entry?.publisher) ? entry.publisher : []),
    ]
      .map((a: any) => a?.name || a?.display_name || a)
      .filter(Boolean)

    const coverImage =
      entry?.cover_image_url ||
      entry?.cover_image ||
      entry?.image_url ||
      ''

    const pages = Number(entry?.pages || entry?.page_count || 0)
    const year = entry?.release_year || entry?.published_year || ''
    const mapped = mapNeoDbCategoryToMedia(entry?.category)

    return {
      id: -1,
      title,
      description: entry?.description || entry?.summary || '',
      lastUpdated: new Date().toISOString(),
      coverImage,
      status: status.planned,
      mediaType: mapped.media,
      tags: [] as Tag[],
      progress: [{
        current: 0,
        max: Number.isFinite(pages) && pages > 0 && mapped.progress === progressType.page ? pages : 1,
        type: mapped.progress,
      }],
      ongoing: false,
      imageSet: coverImage ? [coverImage] : [],
      notes: '',
      otherNames: [],
      creators: creators as string[],
      startDate: year ? String(year) : '',
      endDate: '',
    }
  })
}

export async function search(searchInput: string): Promise<Item[]> {
  const [
    anilistData,
    tmdbMovieData,
    tmdbSeriesData,
    googleBooksData,
    openLibraryData,
    hardcoverData,
    rawgData,
    modrinthData,
    neoDbData,
    jikanAnimeData,
    jikanMangaData,
  ] = await Promise.allSettled([
    anilistSearch(searchInput),
    tmdbMovieSearch(searchInput),
    tmdbSeriesSearch(searchInput),
    googlebooksSearch(searchInput),
    openLibrarySearch(searchInput),
    hardcoverBooksSearch(searchInput),
    rawgGamesSearch(searchInput),
    modrinthProjectsSearch(searchInput),
    neoDbSearch(searchInput),
    jikanAnimeSearch(searchInput),
    jikanMangaSearch(searchInput),
  ])

  const items: Item[] = []

  if (anilistData.status === 'fulfilled') {
    items.push(...parseAnilist(anilistData.value))
  }

  if (tmdbMovieData.status === 'fulfilled') {
    const movieItems = await parseTmdbMovies(tmdbMovieData.value)
    items.push(...movieItems)
  }

  if (tmdbSeriesData.status === 'fulfilled') {
    const seriesItems = await parseTmdbSeries(tmdbSeriesData.value)
    items.push(...seriesItems)
  }

  if (googleBooksData.status === 'fulfilled') {
    items.push(...parseGoogleBooks(googleBooksData.value))
  }

  if (openLibraryData.status === 'fulfilled') {
    items.push(...parseOpenLibrary(openLibraryData.value))
  }

  if (hardcoverData.status === 'fulfilled') {
    items.push(...parseHardcoverBooks(hardcoverData.value))
  }

  if (rawgData.status === 'fulfilled') {
    items.push(...parseRawgGames(rawgData.value))
  }

  if (modrinthData.status === 'fulfilled') {
    items.push(...parseModrinthProjects(modrinthData.value))
  }

  if (neoDbData.status === 'fulfilled') {
    items.push(...parseNeoDb(neoDbData.value))
  }

  if (jikanAnimeData.status === 'fulfilled') {
    items.push(...parseJikanAnime(jikanAnimeData.value))
  }

  if (jikanMangaData.status === 'fulfilled') {
    items.push(...parseJikanManga(jikanMangaData.value))
  }

  return items
}
