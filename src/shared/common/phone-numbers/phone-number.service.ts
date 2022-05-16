/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { CountryService } from '@root/node_modules/ngx-international-phone-number/src/country.service';
import { PhoneNumberUtil } from 'google-libphonenumber';

/** Application imports */
import { Country } from '@shared/AppEnums';
import { AppConsts } from '@shared/AppConsts';

@Injectable()
export class PhoneNumberService {
    constructor(
        private countryPhoneService: CountryService,
    ) {
        this.checkSetDefaultPhoneCodeByCountryCode();
    }

    getDefaultCountryCode() {
        return abp.setting.get('App.TenantManagement.DefaultCountryCode') || Country.USA;
    }

    checkSetDefaultPhoneCodeByCountryCode(countryCode?: string) {
        if (!countryCode)
            countryCode = this.getDefaultCountryCode();

        AppConsts.defaultCountryCode = countryCode;        
        AppConsts.defaultCountryPhoneCode = this.countryPhoneService.getPhoneCodeByCountryCode(countryCode);
    }

    isPhoneNumberValid(value: string, defaultCountryCode: string = AppConsts.defaultCountryCode) {
        if (!value)
            return true;

        let phoneUtil = PhoneNumberUtil.getInstance();
        try {
            return phoneUtil.isValidNumber(
                phoneUtil.parse(value, defaultCountryCode)
            );
        } catch (ex) {
            return false;
        }
    }
}
