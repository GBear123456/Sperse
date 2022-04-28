import { Pipe, PipeTransform } from '@angular/core';
import { parse, formatNumber, ParsedNumber, ParseNumberOptions } from 'libphonenumber-js';
import { AppConsts } from '@shared/AppConsts';

@Pipe({
    name: 'phone'
})
export class PhoneFormatPipe implements PipeTransform {
    transform(value: string, parseOptions: any = {}): any {
        let phoneNumber = value;
        if (value) {
            const defaultParseOptions: ParseNumberOptions = {
                extended: true,
                defaultCountry: <any>AppConsts.defaultCountryCode
            };
            let parsedNumber: ParsedNumber;
            try {
                parsedNumber = parse(value, {...defaultParseOptions, ...parseOptions});
            } catch (error) {
                parsedNumber = parse(value);
            }
            if (Object.keys(parsedNumber).length) {
                if (parsedNumber.countryCallingCode === '1') {
                    phoneNumber = `+${parsedNumber.countryCallingCode} ${formatNumber(parsedNumber, 'NATIONAL')}`;
                } else {
                    phoneNumber = formatNumber(parsedNumber, 'INTERNATIONAL');
                }
            }
        }
        return phoneNumber;
    }
}