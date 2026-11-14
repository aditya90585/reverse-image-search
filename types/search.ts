export type SearchMatchType = "provider_exact" | "visual";

export type SearchResult = {
  id: string;
  title: string;
  pageUrl: string;
  domain: string;
  thumbnailUrl?: string;
  imageUrl?: string;
  source?: string;
  /**
   * "provider_exact" means Google Lens placed this result in its exact_matches
   * collection. Trace does not independently verify pixel identity.
   */
  matchType: SearchMatchType;
  exactMatch?: boolean;
  width?: number;
  height?: number;
};

export type SearchResponse = {
  results: SearchResult[];
  total: number;
  exactCount: number;
  visualCount: number;
  queryId?: string;
  searchedAt: string;
};

export type ApiError = { error: string; code?: string };
