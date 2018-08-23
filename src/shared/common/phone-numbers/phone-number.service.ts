/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { PhoneNumberUtil } from 'google-libphonenumber';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';

@Injectable()
export class PhoneNumberService {

    isPhoneNumberValid(value: string, defaultCoutryCode: string = AppConsts.defaultCountryCode) {
        if (!value)
            return true;

        let phoneUtil = PhoneNumberUtil.getInstance();
        try {
            var phoneNumber = phoneUtil.parse(value, defaultCoutryCode);
            return phoneUtil.isValidNumber(phoneNumber);
        } catch (ex) {
            return false;
        }
    }
}
