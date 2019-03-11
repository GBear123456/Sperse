import { Injectable, Injector } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { from, of } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { AppConsts } from '../src/shared/AppConsts';
import { PackageChooserWidgetComponent } from './package-chooser-widget/src/app/package-chooser-widget-component';
import { AppPreBootstrap } from '../src/AppPreBootstrap';
import { createCustomElement } from '@angular/elements';
import { environment } from '../src/environments/environment';
import { LocalizationServiceProxy } from '@shared/service-proxies/service-proxies';
import { filter } from '@node_modules/rxjs/operators';

@Injectable()
export class WidgetsService {
    initialize(injector: Injector, httpClient: HttpClient, localizationSrc?: string) {
        return () => {
            return from(abp.ajax({
                    url: environment.appBaseHref + 'assets/' + environment.appConfig,
                    method: 'GET'
                })).pipe(
                    map((config: any) => config.remoteServiceBaseUrl),
                    tap(remoteUrl => {
                        AppConsts.remoteServiceBaseUrl = remoteUrl;
                        AppConsts.appBaseHref = environment.appBaseHref;
                    }),
                    switchMap((remoteUrl) => {
                        return localizationSrc
                            ? new LocalizationServiceProxy(httpClient, remoteUrl).loadLocalizationSource('CRM')
                                .pipe(
                                    filter(res => !!res),
                                    tap(result => {
                                        abp.localization.sources.push(result);
                                        abp.localization.values[result.name] = <any>result.values;
                                    })
                                )
                            : of(null);
                    }),
                    tap(() => {
                        AppPreBootstrap.getUserConfiguration(() => {
                            const packageChooserElement = createCustomElement(PackageChooserWidgetComponent, { injector: injector });
                            customElements.define('package-chooser-widget', packageChooserElement);
                        }, false);
                    })
                ).toPromise();
        };
    }
}
