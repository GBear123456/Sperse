import { Injectable } from '@angular/core';
import { AddressComponent, AngularGooglePlaceService } from 'angular-google-place';

@Injectable()
export class GooglePlaceService {

    constructor(
        private angularGooglePlaceService: AngularGooglePlaceService
    ) {}

    static getFieldValue(components: AddressComponent[], field, value): string {
        for (const attr of components)
            for (const type of attr.types)
                if (field === type)
                    return (<any>attr)[value];
    }

    static getStateCode(components: AddressComponent[]): string {
        return GooglePlaceService.getFieldValue(components, 'administrative_area_level_1', 'short_name');
    }

    static getCountryCode(components: AddressComponent[]): string {
        return GooglePlaceService.getFieldValue(components, 'country', 'short_name');
    }

    static getCity(components: AddressComponent[]): string {
        return GooglePlaceService.getFieldValue(components, 'postal_town', 'short_name');
    }

    static getCountryName(components: AddressComponent[]): string {
        return GooglePlaceService.getFieldValue(components, 'country', 'long_name');
    }

    getCountryCode(components: AddressComponent[]): string {
        return this.normalize(GooglePlaceService.getCountryCode(components));
    }

    getStateCode(components: AddressComponent[]): string {
        const stateCode = GooglePlaceService.getStateCode(components);
        return stateCode && this.normalize(stateCode);
    }

    getZipCode(components: AddressComponent[]): string {
        return GooglePlaceService.getFieldValue(components, 'postal_code', 'long_name');
    }

    getStreet(components: AddressComponent[]): string {
        const street = this.angularGooglePlaceService.street(components);
        return street && this.normalize(street);
    }

    getStreetNumber(components: AddressComponent[]) {
        return GooglePlaceService.getFieldValue(components, 'street_number', 'long_name');
    }

    getStateName(components: AddressComponent[]): string {
        const stateName = this.angularGooglePlaceService.state(components);
        return stateName && this.normalize(stateName);
    }

    getCity(components: AddressComponent[]): string {
        const city = this.angularGooglePlaceService.city(components) || GooglePlaceService.getCity(components);
        return city && this.normalize(city);
    }

    normalize(value: string): string {
        return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }
}
