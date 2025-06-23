import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'address'
})
export class AddressFormatPipe implements PipeTransform {
  transform(data, streetAddress, city, state, zip, country) {
    return [
        streetAddress,
        city,
        state,
        zip,
        country
    ].filter(x => x).join(', ');
  }
}
