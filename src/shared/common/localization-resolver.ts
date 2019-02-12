import { LocalizationServiceProxy } from '@shared/service-proxies/service-proxies';
import { Resolve, Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, CanActivateChild } from '../../../node_modules/@angular/router';
import { Observable, of } from '../../../node_modules/rxjs';
import { Injectable } from '../../../node_modules/@angular/core';
import { take, mergeMap } from '../../../node_modules/rxjs/operators';
import { AppConsts } from '@shared/AppConsts';

@Injectable()
export class LocalizationResolver implements CanActivateChild {
    constructor(
        private _LocalizationServiceProxy: LocalizationServiceProxy,
        private router: Router) { }

    canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
        let sourcename = route.data.localizationSource || AppConsts.localization.defaultLocalizationSourceName;
        let source = abp.localization.values[sourcename];
        if (!source) {
            return this._LocalizationServiceProxy.loadLocalizationSource(sourcename).pipe(
                take(1),
                mergeMap(result => {
                    if (result) {
                        abp.localization.sources.push(result);
                        abp.localization.values[result.name] = <any>result.values;
                    }
                    return of(true);
                })
            );
        }
        return of(true);
    }
}
