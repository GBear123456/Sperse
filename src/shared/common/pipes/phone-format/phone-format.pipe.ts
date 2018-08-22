import { Pipe, PipeTransform } from '@angular/core';
import { parse, formatNumber, ParsedNumber } from 'libphonenumber-js';
import { AppConsts } from '@shared/AppConsts';

@Pipe({
    name: 'phone'
})
export class PhoneFormatPipe implements PipeTransform {
    transform(value: string, parseOptions: any = {}): any {
        let phoneNumber = value;
        if (value) {
            const defaultParseOptions = {
                extended: true,
                defaultCountry: AppConsts.defaultCountry
            };
            const parsedNumber: ParsedNumber = parse(value, {...defaultParseOptions, ...parseOptions});
            if (Object.keys(parsedNumber).length) {
                if (parsedNumber.countryCallingCode === '1') {
                    phoneNumber = `+${parsedNumber.countryCallingCode} ${formatNumber(parsedNumber, 'National')}`;
                } else {
                    phoneNumber = formatNumber(parsedNumber, 'International');
                }
            }
        }
        return phoneNumber;
    }
}
