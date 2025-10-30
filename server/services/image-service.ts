/**
 * Image Service with API Fallback
 * Fetches images from Pexels, Pixabay, and Unsplash with automatic fallback
 */

interface ImageResult {
  id: string;
  url: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  photographer?: string;
  photographerUrl?: string;
  source: 'pexels' | 'pixabay' | 'unsplash';
  alt?: string;
}

interface SearchOptions {
  query: string;
  page?: number;
  perPage?: number;
  orientation?: 'landscape' | 'portrait' | 'square';
}

/**
 * Search Pexels API
 */
async function searchPexels(options: SearchOptions): Promise<ImageResult[]> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    throw new Error('Pexels API key not configured');
  }

  const params = new URLSearchParams({
    query: options.query,
    page: (options.page || 1).toString(),
    per_page: (options.perPage || 12).toString(),
  });

  if (options.orientation) {
    params.append('orientation', options.orientation);
  }

  const response = await fetch(`https://api.pexels.com/v1/search?${params}`, {
    headers: {
      Authorization: apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`Pexels API error: ${response.statusText}`);
  }

  const data = await response.json();

  return data.photos.map((photo: any) => ({
    id: `pexels-${photo.id}`,
    url: photo.src.large2x,
    thumbnailUrl: photo.src.medium,
    width: photo.width,
    height: photo.height,
    photographer: photo.photographer,
    photographerUrl: photo.photographer_url,
    source: 'pexels' as const,
    alt: photo.alt || options.query,
  }));
}

/**
 * Search Pixabay API
 */
async function searchPixabay(options: SearchOptions): Promise<ImageResult[]> {
  const apiKey = process.env.PIXABAY_API_KEY;
  if (!apiKey) {
    throw new Error('Pixabay API key not configured');
  }

  const params = new URLSearchParams({
    key: apiKey,
    q: options.query,
    page: (options.page || 1).toString(),
    per_page: (options.perPage || 12).toString(),
    image_type: 'photo',
    safesearch: 'true',
  });

  if (options.orientation) {
    params.append('orientation', options.orientation);
  }

  const response = await fetch(`https://pixabay.com/api/?${params}`);

  if (!response.ok) {
    throw new Error(`Pixabay API error: ${response.statusText}`);
  }

  const data = await response.json();

  return data.hits.map((photo: any) => ({
    id: `pixabay-${photo.id}`,
    url: photo.largeImageURL,
    thumbnailUrl: photo.webformatURL,
    width: photo.imageWidth,
    height: photo.imageHeight,
    photographer: photo.user,
    photographerUrl: `https://pixabay.com/users/${photo.user}-${photo.user_id}`,
    source: 'pixabay' as const,
    alt: photo.tags || options.query,
  }));
}

/**
 * Search Unsplash API
 */
async function searchUnsplash(options: SearchOptions): Promise<ImageResult[]> {
  const apiKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!apiKey) {
    throw new Error('Unsplash API key not configured');
  }

  const params = new URLSearchParams({
    query: options.query,
    page: (options.page || 1).toString(),
    per_page: (options.perPage || 12).toString(),
  });

  if (options.orientation) {
    params.append('orientation', options.orientation);
  }

  const response = await fetch(`https://api.unsplash.com/search/photos?${params}`, {
    headers: {
      Authorization: `Client-ID ${apiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Unsplash API error: ${response.statusText}`);
  }

  const data = await response.json();

  return data.results.map((photo: any) => ({
    id: `unsplash-${photo.id}`,
    url: photo.urls.regular,
    thumbnailUrl: photo.urls.small,
    width: photo.width,
    height: photo.height,
    photographer: photo.user.name,
    photographerUrl: photo.user.links.html,
    source: 'unsplash' as const,
    alt: photo.alt_description || options.query,
  }));
}

/**
 * Search images with automatic fallback
 * Tries providers in order: Pexels → Pixabay → Unsplash
 */
export async function searchImagesWithFallback(
  options: SearchOptions
): Promise<{
  images: ImageResult[];
  source: string;
  fallbackUsed: boolean;
}> {
  const providers = [
    { name: 'pexels', fn: searchPexels },
    { name: 'pixabay', fn: searchPixabay },
    { name: 'unsplash', fn: searchUnsplash },
  ];

  let lastError: Error | null = null;

  for (const provider of providers) {
    try {
      console.log(`🔍 Trying ${provider.name} API...`);
      const images = await provider.fn(options);
      
      if (images.length > 0) {
        console.log(`✅ Got ${images.length} images from ${provider.name}`);
        return {
          images,
          source: provider.name,
          fallbackUsed: provider.name !== 'pexels',
        };
      }
    } catch (error: any) {
      console.warn(`⚠️ ${provider.name} API failed:`, error.message);
      lastError = error;
      continue; // Try next provider
    }
  }

  // All providers failed
  throw new Error(
    lastError?.message || 'All image providers failed. Please try again later.'
  );
}

/**
 * Get provider status
 */
export async function getImageProvidersStatus(): Promise<{
  pexels: boolean;
  pixabay: boolean;
  unsplash: boolean;
}> {
  return {
    pexels: !!process.env.PEXELS_API_KEY,
    pixabay: !!process.env.PIXABAY_API_KEY,
    unsplash: !!process.env.UNSPLASH_ACCESS_KEY,
  };
}

/**
 * Cache configuration (for future implementation)
 */
export const IMAGE_CACHE_CONFIG = {
  ttl: 3600, // 1 hour
  maxSize: 100, // Max cached queries
  enableEdgeCache: true,
};

