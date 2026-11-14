export type SearchMatchType = "provider_exact" | "visual";

export type SearchResult = {
  id: string;
  title: string;
  pageUrl: string;
  domain: string;
  source?: string;
  /**
   * "provider_exact" means Google Lens placed this result in its exact_matches
   * collection. VisuFind does not independently verify pixel identity.
   */
  matchType: SearchMatchType;
  exactMatch?: boolean;
};

export type SearchUsage = {
  usedToday: number;
  dailyLimit: number;
  remainingToday: number;
  resetAt: string;
  monthlyCapReached: boolean;
};

export type SearchResponse = {
  results: SearchResult[];
  total: number;
  exactCount: number;
  visualCount: number;
  queryId?: string;
  searchedAt: string;
  usage?: SearchUsage;
};

export type ApiError = { error: string; code?: string; usage?: SearchUsage };
