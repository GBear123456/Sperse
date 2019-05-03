import { LocalizationServiceProxy } from '@shared/service-proxies/service-proxies';
import { ActivatedRouteSnapshot, RouterStateSnapshot, CanActivateChild } from '../../../node_modules/@angular/router';
import { Observable, of } from '../../../node_modules/rxjs';
import { Injectable } from '../../../node_modules/@angular/core';
import { take, mergeMap } from '../../../node_modules/rxjs/operators';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { TenantLoginInfoDtoCustomLayoutType } from '@shared/service-proxies/service-proxies';
import { AppConsts } from '@shared/AppConsts';

@Injectable()
export class LocalizationResolver implements CanActivateChild {
    constructor(
        private session: AppSessionService,
        private _LocalizationServiceProxy: LocalizationServiceProxy
    ) {}

    canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
        let defaultLocalization = AppConsts.localization.defaultLocalizationSourceName;
        if (this.session.tenant && this.session.tenant.customLayoutType === TenantLoginInfoDtoCustomLayoutType.LendSpace)
            defaultLocalization = 'PFM';

        return this.checkLoadLocalization(route.data.localizationSource || defaultLocalization);
    }

    checkLoadLocalization(sourcename) {
        return abp.localization.values[sourcename] ? of(true) :
            this._LocalizationServiceProxy.loadLocalizationSource(sourcename).pipe(
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
}
