import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'numberAbbr'
})
/**
 * Converts numbers to abbreviations like 1000 -> 1k, 4000000 -> 4m
 */
export class NumberAbbrPipe implements PipeTransform {
    transform(value: number, currencySymbol: string = ''): string {
        const SI_SYMBOL = ['', 'k', 'm', 'g', 't', 'p', 'e'];
        // what tier? (determines SI symbol)
        const tier = Math.log10(value) / 3 | 0;

        // if zero, we don't need a suffix
        if (tier == 0)
            return currencySymbol + value.toString();

        // get suffix and determine scale
        const suffix = SI_SYMBOL[tier];
        const scale = Math.pow(10, tier * 3);

        // scale the number
        const scaled = value / scale;

        // format number and add suffix
        return currencySymbol + scaled.toFixed(0) + suffix;
    }
}
