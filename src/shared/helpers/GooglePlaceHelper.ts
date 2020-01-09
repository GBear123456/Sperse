import { Injectable } from '@angular/core';
import { AddressComponent, AngularGooglePlaceService } from 'angular-google-place';

@Injectable()
export class GooglePlaceHelper {

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
        return GooglePlaceHelper.getFieldValue(components, 'administrative_area_level_1', 'short_name');
    }

    static getCountryCode(components: AddressComponent[]): string {
        return GooglePlaceHelper.getFieldValue(components, 'country', 'short_name');
    }

    static getCity(components: AddressComponent[]): string {
        return GooglePlaceHelper.getFieldValue(components, 'postal_town', 'short_name');
    }

    getStateCode(components: AddressComponent[]): string {
        return this.normalize(GooglePlaceHelper.getStateCode(components));
    }

    getState(components: AddressComponent[]): string {
        return this.normalize(this.angularGooglePlaceService.state(components));
    }

    getCity(components: AddressComponent[]): string {
        const city = this.angularGooglePlaceService.city(components) || GooglePlaceHelper.getCity(components);
        return this.normalize(city);
    }

    normalize(value: string): string {
        return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }
}
