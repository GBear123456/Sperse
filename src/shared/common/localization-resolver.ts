import { UiCustomizationSettingsServiceProxy } from '@shared/service-proxies/service-proxies';
import { Resolve, Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '../../../node_modules/@angular/router';
import { Observable, of } from '../../../node_modules/rxjs';
import { Injectable } from '../../../node_modules/@angular/core';
import { take, mergeMap } from '../../../node_modules/rxjs/operators';
import { AppConsts } from '@shared/AppConsts';

@Injectable()
export class LocalizationResolver implements CanActivate {
    constructor(
        private _UiCustomizationSettingsServiceProxy: UiCustomizationSettingsServiceProxy,
        private router: Router) { }

    canActivate(
        next: ActivatedRouteSnapshot,
        state: RouterStateSnapshot): Observable<boolean>
    {
        let sourcename = next.data.localizationSource || AppConsts.localization.defaultLocalizationSourceName;
        let source = abp.localization.values[sourcename];
        if (!source) {
            return this._UiCustomizationSettingsServiceProxy.loadLocalizationSource(sourcename).pipe(
                take(1),
                mergeMap(result => {
                    if (result && result.source) {
                        abp.localization.sources.push(result.source);
                        abp.localization.values[result.source.name] = <any>result.values;
                    }
                    return of(true);
                })
            );
        }
        return of(true);
    }
}
