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

export interface ChartItem {
  name: string;
  total: number;
}

export interface DashboardSummary {
  applicants: { total: number; thisMonth: number };
  companies: {
    approved: number;
    approvedThisMonth: number;
    pending: number;
    oldestPendingSince: string | null;
  };
  offers: {
    active: number;
    inReview: number;
    publishedThisMonth: number;
    closedThisMonth: number;
  };
  applications: { total: number; hired: number; hiringRate: number };
  applicationsByMonth: ChartItem[];
  applicantsByProfession: ChartItem[];
  companiesBySector: ChartItem[];
  calculatedAt: string;
}
