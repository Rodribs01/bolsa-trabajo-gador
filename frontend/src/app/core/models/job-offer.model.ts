export interface OfferCompany {
  id: number;
  businessName: string;
  logo: string | null;
  description: string;
  sector: string;
}

export interface JobOfferSummary {
  id: number;
  title: string;
  closingDate: string;
  publishedAt: string | null;
  minSalary: number | null;
  maxSalary: number | null;
  salaryToNegotiate: boolean;
  contractType: string;
  modality: string;
  municipality: string;
  company: OfferCompany;
}

export interface OfferSkill {
  id: number;
  name: string;
  required: boolean;
}

export interface OfferProfession {
  id: number;
  name: string;
}

export interface JobOfferDetail extends JobOfferSummary {
  description: string;
  requiredRequirements: string;
  desiredRequirements: string | null;
  yearsOfExperience: number;
  benefits: string[] | null;
  vacancies: number;
  professions: OfferProfession[];
  skills: OfferSkill[];
}

export interface JobOfferPage {
  items: JobOfferSummary[];
  total: number;
  page: number;
  limit: number;
}

export interface JobOfferFilters {
  keyword?: string;
  professionId?: string;
  municipalityId?: string;
  modalityId?: string;
  minSalary?: string;
  includeNegotiable?: string;
  sort?: string;
  page?: string;
}
