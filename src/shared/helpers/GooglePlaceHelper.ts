import { Injectable } from '@angular/core';
import { AngularGooglePlaceService } from 'angular-google-place';

@Injectable()
export class GooglePlaceHelper {

    constructor(
        private angularGooglePlaceService: AngularGooglePlaceService
    ) {}

    static getFieldValue(components, field, value): string {
        for (const attr of components)
            for (const type of attr.types)
                if (field === type)
                    return (<any>attr)[value];
    }

    static getStateCode(components): string {
        return GooglePlaceHelper.getFieldValue(components, 'administrative_area_level_1', 'short_name');
    }

    static getCountryCode(components): string {
        return GooglePlaceHelper.getFieldValue(components, 'country', 'short_name');
    }

    getState(components): string {
        return this.normalize(this.angularGooglePlaceService.state(components));
    }

    getCity(components): string {
        return this.normalize(this.angularGooglePlaceService.city(components));
    }

    normalize(value: string): string {
        return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }
}
