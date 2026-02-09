import { type Item, mediaType, status, tags, progressType } from '../utils/types'

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

  try {
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
  } catch (error) {
    console.error('AniList API error:', error)
    throw error
  }
}

export async function tmdbMovieSearch(searchInput: string) {
  try {
    // Get API key from localStorage
    const saved = localStorage.getItem('apiKeys')
    if (!saved) {
      throw new Error('TMDB API key not found in localStorage')
    }
    const apiKey = JSON.parse(saved)

    if (!apiKey) {
      throw new Error('TMDB API key is missing')
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
  } catch (error) {
    console.error('TMDB API error:', error)
    throw error
  }
}

export async function tmdbSeriesSearch(searchInput: string) {
  try {
    // Get API key from localStorage
    const saved = localStorage.getItem('apiKeys')
    if (!saved) {
      throw new Error('TMDB API key not found in localStorage')
    }
    const apiKey = JSON.parse(saved)

    if (!apiKey) {
      throw new Error('TMDB API key is missing')
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
  } catch (error) {
    console.error('TMDB API error:', error)
    throw error
  }
}

export async function tmdbMovieDetails(movieId: number) {
  try {
    const saved = localStorage.getItem('apiKeys')
    if (!saved) {
      throw new Error('TMDB API key not found in localStorage')
    }
    const apiKey = JSON.parse(saved)

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
    const saved = localStorage.getItem('apiKeys')
    if (!saved) {
      throw new Error('TMDB API key not found in localStorage')
    }
    const apiKey = JSON.parse(saved)

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
  try {
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
  } catch (error) {
    console.error('Google Books API error:', error)
    throw error
  }
}

function mapCountryToTag(countryOfOrigin: string | null | undefined): tags | null {
  if (!countryOfOrigin) return null

  const country = countryOfOrigin.toLowerCase()
  if (country === 'jp' || country === 'japan' || country === 'ja') {
    return tags.japanese
  } else if (country === 'cn' || country === 'china' || country === 'zh' || country === 'hk') {
    return tags.chinese
  } else if (country === 'us' || country === 'uk' || country === 'gb' || country === 'ca' || country === 'au' ||
           country === 'united states' || country === 'united kingdom' || country === 'canada' ||
           country === 'australia' || country === 'nz' || country === 'new zealand' ||
           country === 'en' || country === 'english') {
    return tags.western
  }
  return null
}

function mapGenreToTag(genre: string | null | undefined): tags | null {
  if (!genre) return null

  const normalized = genre.toLowerCase().trim()
  
  const genreMap: Record<string, tags> = {
    'action': tags.action,
    'comedy': tags.comedy,
    'drama': tags.drama,
    'horror': tags.horror,
    'thriller': tags.thriller,
    'sci-fi': tags.sciFi,
    'science fiction': tags.sciFi,
    'scifi': tags.sciFi,
    'romance': tags.romance,
    'fantasy': tags.fantasy,
    'adventure': tags.adventure,
    'animation': tags.animation,
    'animated': tags.animation,
    'documentary': tags.documentary,
    'crime': tags.crime,
    'mystery': tags.mystery,
    'family': tags.family,
    'musical': tags.musical,
    'war': tags.war,
    'historical': tags.historical,
    'history': tags.historical,
    'wuxia': tags.wuxia,
    'xianxia': tags.xianxia,
    'josei': tags.josei,
    'shoujo': tags.shoujo,
    'shounen': tags.shounen,
    'shonen': tags.shounen,
    'seinen': tags.seinen,
    'isekai': tags.isekai,
    'slice-of-life': tags.sliceOfLife,
    'slice of life': tags.sliceOfLife,
    'sol': tags.sliceOfLife,
    'sports': tags.sports,
    'sport': tags.sports,
    'mecha': tags.mecha,
    'mech': tags.mecha,
    'school': tags.school,
    'psychological': tags.psychological,
    'supernatural': tags.supernatural,
    'regression': tags.regression,
    'cultivation': tags.cultivation,
  }

  return genreMap[normalized] || null
}

function parseAnilist(data: any): Item[] {
  if (!data?.data?.Page?.media) return []

  return data.data.Page.media.map((media: any) => {
    const countryTag = mapCountryToTag(media.countryOfOrigin)
    const tagArray = countryTag ? [countryTag] : []

    if (media.genres) {
      for (const genre of media.genres) {
        const mappedTag = mapGenreToTag(genre)
        if (mappedTag && !tagArray.includes(mappedTag)) {
          tagArray.push(mappedTag)
        }
      }
    }

    if (media.tags) {
      for (const tag of media.tags) {
        const mappedTag = mapGenreToTag(tag.name)
        if (mappedTag && !tagArray.includes(mappedTag)) {
          tagArray.push(mappedTag)
        }
      }
    }

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
    const countryTag = mapCountryToTag(movie.origin_country?.[0] || movie.production_countries?.[0]?.iso_3166_1)
    const tagArray = countryTag ? [countryTag] : []

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
      if (details.genres) {
        for (const genre of details.genres) {
          const mappedTag = mapGenreToTag(genre.name)
          if (mappedTag && !baseItem.tags.includes(mappedTag)) {
            baseItem.tags.push(mappedTag)
          }
        }
      }
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
    const countryTag = mapCountryToTag(series.origin_country?.[0] || series.production_countries?.[0]?.iso_3166_1)
    const tagArray = countryTag ? [countryTag] : []

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
      if (details.genres) {
        for (const genre of details.genres) {
          const mappedTag = mapGenreToTag(genre.name)
          if (mappedTag && !baseItem.tags.includes(mappedTag)) {
            baseItem.tags.push(mappedTag)
          }
        }
      }
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
    const countryTag = mapCountryToTag(book.volumeInfo?.country || book.saleInfo?.country)
    const tagArray = countryTag ? [countryTag] : []

    if (book.volumeInfo?.categories) {
      for (const category of book.volumeInfo.categories) {
        const mappedTag = mapGenreToTag(category)
        if (mappedTag && !tagArray.includes(mappedTag)) {
          tagArray.push(mappedTag)
        }
      }
    }

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

export async function search(searchInput: string): Promise<Item[]> {
  try {
    const [anilistData, tmdbMovieData, tmdbSeriesData, googleBooksData] = await Promise.allSettled([
      anilistSearch(searchInput),
      tmdbMovieSearch(searchInput),
      tmdbSeriesSearch(searchInput),
      googlebooksSearch(searchInput)
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

    return items
  } catch (error) {
    console.error('Search error:', error)
    return []
  }
}

