import { Injectable } from '@angular/core';
import { AddressComponent } from 'ngx-google-places-autocomplete/objects/addressComponent';

@Injectable()
export class GooglePlaceService {

    static getFieldValue(components: AddressComponent[], field, value): string {
        for (const attr of components)
            for (const type of attr.types)
                if (field === type)
                    return (<any>attr)[value];
    }

    static getStreetNumber(components: AddressComponent[]) {
        return GooglePlaceService.getFieldValue(components, 'street_number', 'long_name');
    }

    static getStreet(components: AddressComponent[]): string {
        return GooglePlaceService.normalize(GooglePlaceService.getFieldValue(components, 'route', 'long_name'));
    }

    static getCity(components: AddressComponent[]): string {
        const city = GooglePlaceService.getFieldValue(components, 'locality', 'long_name')
            || GooglePlaceService.getFieldValue(components, 'postal_town', 'short_name');
        return city && GooglePlaceService.normalize(city);
    }

    static getNeighborhood(components: AddressComponent[]): string {
        const neighborhood = GooglePlaceService.getFieldValue(components, 'neighborhood', 'short_name')
            || GooglePlaceService.getFieldValue(components, 'sublocality', 'short_name');
        return neighborhood && GooglePlaceService.normalize(neighborhood);
    }

    static getStateCode(components: AddressComponent[]): string {
        const stateCode = GooglePlaceService.getFieldValue(components, 'administrative_area_level_1', 'short_name');
        return stateCode && this.normalize(stateCode);
    }

    static getStateName(components: AddressComponent[]): string {
        const stateName = GooglePlaceService.getFieldValue(components, 'administrative_area_level_1', 'long_name');
        return stateName && GooglePlaceService.normalize(stateName);
    }

    static getCountryCode(components: AddressComponent[]): string {
        return GooglePlaceService.normalize(GooglePlaceService.getFieldValue(components, 'country', 'short_name'));
    }

    static getCountryName(components: AddressComponent[]): string {
        return GooglePlaceService.getFieldValue(components, 'country', 'long_name');
    }

    static getZipCode(components: AddressComponent[]): string {
        return GooglePlaceService.getFieldValue(components, 'postal_code', 'long_name');
    }

    static normalize(value: string): string {
        return value && value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }
}
