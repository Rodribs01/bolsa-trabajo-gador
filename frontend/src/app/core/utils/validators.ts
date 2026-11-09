import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,72}$/;
export const CI_PATTERN = /^\d{5,10}(-?[0-9A-Za-z]{1,2})?$/;
export const PHONE_PATTERN = /^[67]\d{7}$/;
export const CI_ISSUED_IN = ['OR', 'LP', 'CB', 'SC', 'PT', 'TJ', 'CH', 'BE', 'PD'];

export function passwordsMatch(passwordField: string, confirmField: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const password = group.get(passwordField)?.value;
    const confirm = group.get(confirmField)?.value;
    if (confirm && password !== confirm) {
      return { passwordsDoNotMatch: true };
    }
    return null;
  };
}
