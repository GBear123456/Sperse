import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'zipCodeFormatter'
})
export class ZipCodeFormatterPipe implements PipeTransform {

    transform(value: string, args?: any): string {
        let result = value;
        /** Calculate amount of symbols */
        const amountOfSymbols = value.length;

        if (amountOfSymbols <= 10) {
            /** If hyphen is absent */
            const is9Digit = value.indexOf('-') !== -1;

            if (is9Digit) {
                /** Amount of numbers before hyphen */
                const numbersBeforeHyphen = value.substr(0, value.indexOf('-'));

                /** Amount of numbers after hyphen */
                const numbersAfterHyphen = value.substr(value.indexOf('-') + 1, value.length);

                result = this.fillEmptyZeroes(numbersBeforeHyphen, 5) + '-' + this.fillEmptyZeroes(numbersAfterHyphen, 4);
            } else if (amountOfSymbols > 5) {
                result = value.substr(0, 5) + '-' + this.fillEmptyZeroes(value.substr(5, 4), 4);
            } else if (amountOfSymbols) {
                result = this.fillEmptyZeroes(value, 5);
            }
        }

        return result;
    }

    private fillEmptyZeroes(value: string, necessaryLength: number): string {
        return value.length === necessaryLength ? value : '0'.repeat(necessaryLength - value.length) + value;
    }
}
