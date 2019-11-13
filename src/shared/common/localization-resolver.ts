/** Core imports */
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, CanActivateChild } from '@angular/router';

/** Third party imports */
import { Observable, of } from 'rxjs';
import { tap, take, mergeMap } from 'rxjs/operators';

/** Application imports */
import { LocalizationServiceProxy } from '@shared/service-proxies/service-proxies';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { LayoutType } from '@shared/service-proxies/service-proxies';
import { AppConsts } from '@shared/AppConsts';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Injectable()
export class LocalizationResolver implements CanActivateChild {
    constructor(
        private session: AppSessionService,
        private localizationServiceProxy: LocalizationServiceProxy,
        private ls: AppLocalizationService
    ) {}

    canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
        let defaultLocalization = AppConsts.localization.defaultLocalizationSourceName;
        if (abp.localization.values[defaultLocalization] && this.session.tenant && this.session.tenant.customLayoutType === LayoutType.LendSpace)
            defaultLocalization = 'PFM';

        return this.checkLoadLocalization(route.data.localizationSource || defaultLocalization).pipe(
            tap(() => {
                if (route.data.localizationSource)
                    this.ls.localizationSourceName = route.data.localizationSource;
            })
        );
    }

    checkLoadLocalization(sourceName) {
        let cultureName = abp.localization.currentLanguage.name,
            source: any = abp.localization.sources.find(item => item.name == sourceName);
        return abp.localization.values[sourceName] ? of(true) :
            this.localizationServiceProxy.getLocalizationSource(
                Number(this.session.tenantId),
                sourceName,
                source ? source.version : undefined,
                cultureName,
                cultureName
            ).pipe(
                    take(1),
                    mergeMap(result => {
                        if (result)
                            abp.localization.values[result.name] = <any>result.values;
                        return of(true);
                    })
                );
    }
}
