import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApplicantProfile,
  EducationData,
  ExperienceData,
  ProfileData,
} from '../models/applicant.model';

@Injectable({ providedIn: 'root' })
export class ApplicantService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/applicants/me`;

  getProfile(): Observable<ApplicantProfile> {
    return this.http.get<ApplicantProfile>(this.url);
  }

  updateProfile(data: ProfileData): Observable<ApplicantProfile> {
    return this.http.put<ApplicantProfile>(this.url, data);
  }

  uploadPhoto(file: File): Observable<unknown> {
    const data = new FormData();
    data.append('photo', file);
    return this.http.post(`${this.url}/photo`, data);
  }

  uploadCv(file: File): Observable<unknown> {
    const data = new FormData();
    data.append('cv', file);
    return this.http.post(`${this.url}/cv`, data);
  }

  getCv(): Observable<Blob> {
    return this.http.get(`${this.url}/cv`, { responseType: 'blob' });
  }

  addEducation(data: EducationData): Observable<unknown> {
    return this.http.post(`${this.url}/educations`, data);
  }

  updateEducation(id: number, data: EducationData): Observable<unknown> {
    return this.http.put(`${this.url}/educations/${id}`, data);
  }

  deleteEducation(id: number): Observable<unknown> {
    return this.http.delete(`${this.url}/educations/${id}`);
  }

  addExperience(data: ExperienceData): Observable<unknown> {
    return this.http.post(`${this.url}/experiences`, data);
  }

  updateExperience(id: number, data: ExperienceData): Observable<unknown> {
    return this.http.put(`${this.url}/experiences/${id}`, data);
  }

  deleteExperience(id: number): Observable<unknown> {
    return this.http.delete(`${this.url}/experiences/${id}`);
  }

  addSkill(skillId: number, level: string): Observable<unknown> {
    return this.http.post(`${this.url}/skills`, { skillId: skillId, level: level });
  }

  updateSkill(id: number, level: string): Observable<unknown> {
    return this.http.patch(`${this.url}/skills/${id}`, { level: level });
  }

  deleteSkill(id: number): Observable<unknown> {
    return this.http.delete(`${this.url}/skills/${id}`);
  }

  addLanguage(languageId: number, level: string): Observable<unknown> {
    return this.http.post(`${this.url}/languages`, { languageId: languageId, level: level });
  }

  updateLanguage(id: number, level: string): Observable<unknown> {
    return this.http.patch(`${this.url}/languages/${id}`, { level: level });
  }

  deleteLanguage(id: number): Observable<unknown> {
    return this.http.delete(`${this.url}/languages/${id}`);
  }
}
