import { Pipe, PipeTransform } from '@angular/core';
import { DecimalPipe } from '@angular/common';

@Pipe({
    name: 'customNumber'
})
/**
 * Supports getting of integers and decimals without rounding with '0.2-2' to get 2 decimals and '1.0-0' to get integers
 * See spec for usage examples
 */
export class CustomNumberPipe extends DecimalPipe implements PipeTransform {
    transform(value: any, digitsInfo?: string): string | null {
        if (value && digitsInfo) {
            const [minIntegerDigits, minFractionDigits, maxFractionDigits] = digitsInfo.split(/[.-]+/).map(digit => +digit);
            value = +value;
            if (minFractionDigits === 0 && maxFractionDigits === 0) {
                return ((value < 0 ? -1 : 1) * Math.floor(Math.abs(value))).toString();
            } else if (minIntegerDigits === 0) {
                const valueArr = value.toString().split('.');
                const actualFractionDigits = valueArr[1] ? valueArr[1].length : 0;
                let amountOfZeroes = 0;
                let fractionDigits = minFractionDigits;
                if (minFractionDigits < actualFractionDigits && actualFractionDigits < maxFractionDigits) {
                    fractionDigits = actualFractionDigits;
                } else {
                    fractionDigits = maxFractionDigits;
                    if (minFractionDigits > actualFractionDigits) {
                        amountOfZeroes = minFractionDigits - actualFractionDigits;
                    }
                }
                return (valueArr[1] ? valueArr[1].slice(0, fractionDigits) : '') + '0'.repeat(amountOfZeroes);
            }
        }
        return super.transform(value, digitsInfo);
    }
}
