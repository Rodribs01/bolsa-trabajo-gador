export interface Education {
  id: number;
  title: string;
  institution: string;
  graduationYear: number;
  nationalTitleNumber: string | null;
}

export interface Experience {
  id: number;
  company: string;
  position: string;
  location: string | null;
  startDate: string;
  endDate: string | null;
  years: number;
  description: string | null;
}

export interface ApplicantSkill {
  id: number;
  skillId: number;
  name: string;
  level: string;
}

export interface ApplicantLanguage {
  id: number;
  languageId: number;
  name: string;
  level: string;
}

export interface ApplicantProfile {
  id: number;
  ci: string;
  ciIssuedIn: string;
  firstNames: string;
  lastNames: string;
  email: string;
  phone: string;
  birthDate: string | null;
  address: string | null;
  municipalityId: number | null;
  municipality: string | null;
  professionId: number | null;
  profession: string | null;
  photo: string | null;
  hasCv: boolean;
  summary: string | null;
  completionPercentage: number;
  educations: Education[];
  experiences: Experience[];
  skills: ApplicantSkill[];
  languages: ApplicantLanguage[];
}

export interface ProfileData {
  firstNames: string;
  lastNames: string;
  phone: string;
  birthDate: string | null;
  address: string | null;
  municipalityId: number | null;
  professionId: number | null;
  summary: string | null;
}

export interface EducationData {
  title: string;
  institution: string;
  graduationYear: number;
  nationalTitleNumber: string | null;
}

export interface ExperienceData {
  company: string;
  position: string;
  location: string | null;
  startDate: string;
  endDate: string | null;
  description: string | null;
}

export interface SkillOption {
  id: number;
  name: string;
  category: string;
}
