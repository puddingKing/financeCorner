export interface TrendPoint {
  time: string;
  price: number;
  volume: number;
  amount: number;
}

export interface IndexTrend {
  name: string;
  code: string;
  date: string;
  preClose: number;
  open: number;
  close: number;
  changePct: number;
  points: TrendPoint[];
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  time: string;
}

export interface NewsResponse {
  page: number;
  limit: number;
  items: NewsItem[];
}

export type PctDirection = 'up' | 'down' | 'flat';
