import { Directive, forwardRef, Attribute, Input } from '@angular/core';
import { Validator, AbstractControl, NG_VALIDATORS } from '@angular/forms';


@Directive({
    selector: '[minPasswordLength],[maxPasswordLength],[useNumbers],[useUpperCaseLetters],[useLowerCaseLetters],[usePunctuations]',
    providers: [
        { provide: NG_VALIDATORS, useExisting: forwardRef(() => PasswordComplexityValidator), multi: true }
    ]
})
export class PasswordComplexityValidator implements Validator {

    @Input('useNumbers') useNumbers: string;
    @Input('useUpperCaseLetters') useUpperCaseLetters: string;
    @Input('useLowerCaseLetters') useLowerCaseLetters: string;
    @Input('usePunctuations') usePunctuations: string;

    validate(control: AbstractControl): { [key: string]: any } {
        let givenPassword = control.value;
        let validationResult = null;

        //use numbers
        let useNumbers = this.useNumbers;
        if (useNumbers && givenPassword && !/[0-9]/.test(givenPassword)) {
            validationResult = validationResult || {};
            validationResult.useNumbers = true;
        }

        //use upperCaseLetters
        let useUpperCaseLetters = this.useUpperCaseLetters;
        if (useUpperCaseLetters && givenPassword && !/[A-Z]/.test(givenPassword)) {
            validationResult = validationResult || {};
            validationResult.useUpperCaseLetters = true;
        }

        //use upperCaseLetters
        let useLowerCaseLetters = this.useLowerCaseLetters;
        if (useLowerCaseLetters && givenPassword && !/[a-z]/.test(givenPassword)) {
            validationResult = validationResult || {};
            validationResult.useLowerCaseLetters = true;
        }

        //use upperCaseLetters
        let usePunctuations = this.usePunctuations;
        if (usePunctuations && givenPassword && !/[!@#\$%\^\&*'"\/{}\[\]?,;|)\(+=._-]+/.test(givenPassword)) {
            validationResult = validationResult || {};
            validationResult.usePunctuations = true;
        }

        return validationResult;
    }
}