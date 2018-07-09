import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'phone'
})
export class PhoneFormatPipe implements PipeTransform {
    transform(s, args) {
        let s2 = (''+s).replace(/\D/g, '');
        let m = s2.match(/^(\d{3})(\d{3})(\d{4})$/);
        return (!m) ? s2 : '+1 (' + m[1] + ')-' + m[2] + '-' + m[3];
    }
}
