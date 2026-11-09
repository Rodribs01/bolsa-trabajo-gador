import { ApplicantProfile } from './applicant.model';

export interface NamedItem {
  id: number;
  name: string;
}

export interface Company {
  id: number;
  nit: string;
  businessName: string;
  sector: NamedItem;
  legalRepresentative: string;
  representativeCi: string;
  phone: string;
  corporateEmail: string;
  address: string;
  municipality: NamedItem;
  logo: string | null;
  description: string;
  status: string;
  rejectionReason: string | null;
  validatedAt: string | null;
  createdAt: string;
}

export interface CompanyOffer {
  id: number;
  title: string;
  description: string;
  requiredRequirements: string;
  desiredRequirements: string | null;
  yearsOfExperience: number;
  contractTypeId: number;
  modalityId: number;
  municipalityId: number;
  minSalary: number | null;
  maxSalary: number | null;
  salaryToNegotiate: boolean;
  benefits: string[] | null;
  closingDate: string;
  vacancies: number;
  status: string;
  observation: string | null;
  totalViews: number;
  applicationCount?: number;
  createdAt: string;
  professions?: { professionId: number; profession: NamedItem }[];
  skills?: { skillId: number; required: boolean; skill: NamedItem }[];
}

export interface CompanyOfferPage {
  items: CompanyOffer[];
  total: number;
  page: number;
  limit: number;
  activeCount: number;
  activeLimit: number;
}

export interface OfferData {
  title: string;
  description: string;
  requiredRequirements: string;
  desiredRequirements?: string;
  professionIds: number[];
  yearsOfExperience: number;
  contractTypeId: number;
  modalityId: number;
  municipalityId: number;
  salaryToNegotiate: boolean;
  minSalary?: number;
  maxSalary?: number;
  benefits?: string[];
  closingDate: string;
  vacancies: number;
  skills: { skillId: number; required: boolean }[];
}

export interface OfferApplicationCard {
  id: number;
  status: string;
  matchPercentage: number;
  createdAt: string;
  applicant: {
    firstNames: string;
    lastNames: string;
    photo: string | null;
    profession: string | null;
    municipality: string | null;
    yearsOfExperience: number;
  };
}

export interface OfferApplicationPage {
  items: OfferApplicationCard[];
  total: number;
  page: number;
  limit: number;
  statusCounts: Record<string, number>;
}

export interface OfferSkillMatch {
  skillId: number;
  name: string;
  required: boolean;
  matched: boolean;
}

export interface ApplicationDetail {
  id: number;
  status: string;
  matchPercentage: number;
  createdAt: string;
  seenAt: string | null;
  offer: { id: number; title: string };
  offerSkills: OfferSkillMatch[];
  applicant: ApplicantProfile;
}
