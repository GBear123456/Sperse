/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { PhoneNumberUtil } from 'google-libphonenumber';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';

@Injectable()
export class PhoneNumberService {

    isPhoneNumberValid(value: string, defaultCountryCode: string = AppConsts.defaultCountry) {
        if (!value)
            return true;

        let phoneUtil = PhoneNumberUtil.getInstance();
        try {
            var phoneNumber = phoneUtil.parse(value, defaultCountryCode);
            return phoneUtil.isValidNumber(phoneNumber);
        } catch (ex) {
            return false;
        }
    }
}
