import { Pipe, PipeTransform } from '@angular/core';
import * as numberToWords from 'number-to-words';

@Pipe({
    name: 'numberToWords'
})
/**
 * Converts numbers like 11 to text 'eleven', 46 - 'forty six' etc.
 */
export class NumberToWordsPipe implements PipeTransform {
    transform(value: number, withHyphen = false): any {
        const words = numberToWords['toWords'](value);
        return withHyphen ? words : words.replace(/-/g, ' ');
    }
}
