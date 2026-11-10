import { ApplicantSkill } from '../models/applicant.model';
import { OfferSkill } from '../models/job-offer.model';

export interface MatchPreview {
  percentage: number;
  requiredMatched: number;
  requiredTotal: number;
  desiredMatched: number;
  desiredTotal: number;
  missing: OfferSkill[];
}

// Misma fórmula que el backend (RF10): peso 2 si la habilidad es obligatoria y 1 si es deseable
export function previewMatch(offerSkills: OfferSkill[], mySkills: ApplicantSkill[]): MatchPreview {
  const myIds: number[] = [];
  for (const skill of mySkills) {
    myIds.push(skill.skillId);
  }

  const preview: MatchPreview = {
    percentage: 0,
    requiredMatched: 0,
    requiredTotal: 0,
    desiredMatched: 0,
    desiredTotal: 0,
    missing: [],
  };
  let totalWeight = 0;
  let matchedWeight = 0;

  for (const skill of offerSkills) {
    const weight = skill.required ? 2 : 1;
    const matched = myIds.includes(skill.id);
    totalWeight += weight;
    if (skill.required) {
      preview.requiredTotal++;
    } else {
      preview.desiredTotal++;
    }
    if (matched) {
      matchedWeight += weight;
      if (skill.required) {
        preview.requiredMatched++;
      } else {
        preview.desiredMatched++;
      }
    } else {
      preview.missing.push(skill);
    }
  }

  if (totalWeight > 0) {
    preview.percentage = Math.round((matchedWeight / totalWeight) * 100);
  }
  return preview;
}
