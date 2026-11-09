import { Company, CompanyOffer, NamedItem } from './company.model';

export interface CompanyPage {
  items: Company[];
  total: number;
  page: number;
  limit: number;
}

export interface PendingOffer extends CompanyOffer {
  updatedAt: string;
  contractType: NamedItem;
  modality: NamedItem;
  municipality: NamedItem;
  company: Company;
}

export interface PendingOfferPage {
  items: PendingOffer[];
  total: number;
  page: number;
  limit: number;
}
