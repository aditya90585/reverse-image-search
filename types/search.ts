export type SearchResult = {
  id: string;
  title: string;
  pageUrl: string;
  domain: string;
  thumbnailUrl?: string;
  imageUrl?: string;
  source?: string;
  exactMatch?: boolean;
  width?: number;
  height?: number;
};

export type SearchResponse = {
  results: SearchResult[];
  total: number;
  queryId?: string;
  searchedAt: string;
};

export type ApiError = { error: string; code?: string };
