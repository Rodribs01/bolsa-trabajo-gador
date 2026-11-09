import { environment } from '../../../environments/environment';
import { JobOfferSummary } from '../models/job-offer.model';

export function formatDate(date: string | null): string {
  if (!date) {
    return '';
  }
  const parts = date.slice(0, 10).split('-');
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export function formatMoney(amount: number): string {
  return `Bs. ${Number(amount).toLocaleString('es-BO')}`;
}

export function formatSalary(offer: JobOfferSummary): string {
  if (offer.salaryToNegotiate || offer.minSalary === null || offer.maxSalary === null) {
    return 'A tratar';
  }
  if (Number(offer.minSalary) === Number(offer.maxSalary)) {
    return formatMoney(offer.minSalary);
  }
  return `${formatMoney(offer.minSalary)} - ${formatMoney(offer.maxSalary)}`;
}

export function initials(name: string): string {
  const words = name.trim().split(' ');
  let result = '';
  for (const word of words) {
    if (word && result.length < 2) {
      result += word[0].toUpperCase();
    }
  }
  return result;
}

export function publicFileUrl(folder: string, fileName: string): string {
  return `${environment.filesUrl}/${folder}/${fileName}`;
}

export function todayInBolivia(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/La_Paz' });
}

export function daysUntil(closingDate: string): number {
  const today = new Date(todayInBolivia()).getTime();
  const closing = new Date(closingDate.slice(0, 10)).getTime();
  return Math.round((closing - today) / (24 * 60 * 60 * 1000));
}
