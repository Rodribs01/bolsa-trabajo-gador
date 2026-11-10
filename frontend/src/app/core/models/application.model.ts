import { JobOfferSummary } from './job-offer.model';

export interface MyApplication {
  id: number;
  status: string;
  matchPercentage: number;
  createdAt: string;
  available: boolean;
  offer: JobOfferSummary;
}

export interface MyApplicationPage {
  items: MyApplication[];
  total: number;
  page: number;
  limit: number;
}

export interface ApplyResponse {
  id: number;
  jobOfferId: number;
  status: string;
  matchPercentage: number;
  createdAt: string;
}

export interface Favorite {
  savedAt: string;
  available: boolean;
  offer: JobOfferSummary;
}

export interface FavoritePage {
  items: Favorite[];
  total: number;
  page: number;
  limit: number;
}
