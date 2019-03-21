/** Core imports */
import { Injectable, Injector } from '@angular/core';
import { HttpClient } from '@angular/common/http';

/** Third party imports */
import { createCustomElement } from '@angular/elements';
import { from, forkJoin, of } from 'rxjs';
import { filter, map, switchMap, tap } from 'rxjs/operators';

/** Application imports */
import { AppConsts } from '../src/shared/AppConsts';
import { PackageChooserWidgetComponent } from './package-chooser-widget/src/app/package-chooser-widget-component';
import { AppPreBootstrap } from '../src/AppPreBootstrap';
import { environment } from '../src/environments/environment';
import { LocalizationServiceProxy } from '@shared/service-proxies/service-proxies';

@Injectable()
export class WidgetsService {
    initialize(injector: Injector, httpClient: HttpClient, localizationSources?: string[]) {
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
                        return localizationSources && localizationSources.length
                            ? forkJoin(
                                localizationSources.map(
                                    localizationSource => new LocalizationServiceProxy(httpClient, remoteUrl).loadLocalizationSource(localizationSource)
                                    .pipe(
                                        filter(res => !!res),
                                        tap(result => {
                                            abp.localization.sources.push(result);
                                            abp.localization.values[result.name] = <any>result.values;
                                        })
                                    )
                                )
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
