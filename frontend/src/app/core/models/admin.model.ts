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

export interface AdminCatalog {
  id: number;
  type: string;
  name: string;
  parentId: number | null;
  parent: { id: number; name: string } | null;
  order: number;
  active: boolean;
}

export interface AdminSkill {
  id: number;
  name: string;
  category: string | null;
  active: boolean;
}

export interface CatalogForm {
  type?: string;
  name: string;
  parentId?: number;
  active?: boolean;
}

export interface SkillForm {
  name: string;
  category: string;
  active?: boolean;
}

export interface AdminSettings {
  activeOffersLimit: number;
  companiesAtLimit: number;
  lastChange: {
    date: string;
    userName: string | null;
    previousValue: string | null;
    newValue: string | null;
  } | null;
}

export interface AuditEntry {
  id: number;
  userId: number | null;
  user: { id: number; name: string; email: string } | null;
  action: string;
  tableName: string;
  recordId: number | null;
  previousData: Record<string, unknown> | null;
  newData: Record<string, unknown> | null;
  ip: string | null;
  createdAt: string;
}

export interface AuditPage {
  items: AuditEntry[];
  total: number;
  page: number;
  limit: number;
}

export interface AuditFilters {
  from: string;
  to: string;
  action: string;
  tableName: string;
  user: string;
}
