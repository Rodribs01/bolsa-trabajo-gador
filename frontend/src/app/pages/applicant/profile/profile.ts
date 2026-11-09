import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApplicantProfile } from '../../../core/models/applicant.model';
import { ApplicantService } from '../../../core/services/applicant.service';
import { getErrorMessage } from '../../../core/utils/error-message';
import {
  COMPLETION_THRESHOLD,
  canApply,
  hasPersonalData,
} from '../../../core/utils/profile-completion';
import { CvSection } from './cv-section/cv-section';
import { EducationSection } from './education-section/education-section';
import { ExperienceSection } from './experience-section/experience-section';
import { LanguagesSection } from './languages-section/languages-section';
import { PersonalData } from './personal-data/personal-data';
import { SkillsSection } from './skills-section/skills-section';

interface ProfileTab {
  key: string;
  label: string;
}

@Component({
  selector: 'app-applicant-profile',
  imports: [
    RouterLink,
    PersonalData,
    EducationSection,
    ExperienceSection,
    SkillsSection,
    LanguagesSection,
    CvSection,
  ],
  templateUrl: './profile.html',
})
export class Profile implements OnInit {
  private applicantService = inject(ApplicantService);
  private route = inject(ActivatedRoute);

  profile = signal<ApplicantProfile | null>(null);
  loading = signal(true);
  errorMessage = signal('');
  activeTab = signal('personal');
  threshold = COMPLETION_THRESHOLD;

  tabs: ProfileTab[] = [
    { key: 'personal', label: 'Datos personales' },
    { key: 'education', label: 'Formación' },
    { key: 'experience', label: 'Experiencia' },
    { key: 'skills', label: 'Habilidades' },
    { key: 'languages', label: 'Idiomas' },
    { key: 'cv', label: 'CV en PDF' },
  ];

  ngOnInit(): void {
    const tab = this.route.snapshot.queryParamMap.get('tab');
    for (const item of this.tabs) {
      if (item.key === tab) {
        this.activeTab.set(item.key);
      }
    }
    this.loadProfile();
  }

  loadProfile(): void {
    this.applicantService.getProfile().subscribe({
      next: (profile) => {
        this.profile.set(profile);
        this.loading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(getErrorMessage(error));
        this.loading.set(false);
      },
    });
  }

  canApply(profile: ApplicantProfile): boolean {
    return canApply(profile);
  }

  isComplete(profile: ApplicantProfile, tab: string): boolean {
    if (tab === 'personal') {
      return hasPersonalData(profile) && Boolean(profile.photo);
    }
    if (tab === 'education') {
      return profile.educations.length > 0;
    }
    if (tab === 'experience') {
      return profile.experiences.length > 0;
    }
    if (tab === 'skills') {
      return profile.skills.length > 0;
    }
    if (tab === 'languages') {
      return profile.languages.length > 0;
    }
    return profile.hasCv;
  }
}
