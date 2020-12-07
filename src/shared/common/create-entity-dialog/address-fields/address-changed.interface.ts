import { ElementRef } from '@angular/core';
import { Address } from 'ngx-google-places-autocomplete/objects/address';

export interface AddressChanged {
    address: Address;
    addressInput: ElementRef;
}