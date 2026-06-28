import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class CustomValidators {
  /**
   * Phone Number Validator (10 digits)
   */
  static phonePattern(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const valid = /^[0-9]{10}$/.test(control.value);
      return valid ? null : { phoneInvalid: true };
    };
  }

  /**
   * India Pin Code Validator (6 digits)
   */
  static pinPattern(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const valid = /^[0-9]{6}$/.test(control.value);
      return valid ? null : { pinInvalid: true };
    };
  }
}
