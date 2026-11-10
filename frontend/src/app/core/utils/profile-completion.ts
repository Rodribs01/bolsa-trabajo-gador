import { ApplicantProfile } from '../models/applicant.model';

export const COMPLETION_THRESHOLD = 80;

export interface MissingSection {
  label: string;
  points: number;
  tab: string;
  icon: string;
}

// Mismos pesos que el backend (RF02): datos 20, foto 10, formación 20, experiencia 15, habilidades 15, idiomas 5, CV 15
export function hasPersonalData(profile: ApplicantProfile): boolean {
  return Boolean(
    profile.birthDate && profile.address && profile.municipalityId && profile.professionId,
  );
}

export function missingSections(profile: ApplicantProfile): MissingSection[] {
  const missing: MissingSection[] = [];
  if (!hasPersonalData(profile)) {
    missing.push({
      label: 'Completa fecha de nacimiento, dirección, municipio y profesión',
      points: 20,
      tab: 'personal',
      icon: 'bi-person-vcard',
    });
  }
  if (!profile.hasCv) {
    missing.push({
      label: 'Sube tu CV en PDF',
      points: 15,
      tab: 'cv',
      icon: 'bi-file-earmark-pdf',
    });
  }
  if (profile.educations.length === 0) {
    missing.push({
      label: 'Agrega tu formación',
      points: 20,
      tab: 'education',
      icon: 'bi-mortarboard',
    });
  }
  if (profile.experiences.length === 0) {
    missing.push({
      label: 'Agrega tu experiencia',
      points: 15,
      tab: 'experience',
      icon: 'bi-briefcase',
    });
  }
  if (profile.skills.length === 0) {
    missing.push({ label: 'Agrega tus habilidades', points: 15, tab: 'skills', icon: 'bi-stars' });
  }
  if (!profile.photo) {
    missing.push({
      label: 'Agrega una foto de perfil',
      points: 10,
      tab: 'personal',
      icon: 'bi-camera',
    });
  }
  if (profile.languages.length === 0) {
    missing.push({
      label: 'Agrega tus idiomas',
      points: 5,
      tab: 'languages',
      icon: 'bi-translate',
    });
  }
  return missing;
}

// Las bases piden más de 80 %, por eso 80 exacto no alcanza; además el CV es obligatorio
export function canApply(profile: ApplicantProfile): boolean {
  return profile.completionPercentage > COMPLETION_THRESHOLD && profile.hasCv;
}
