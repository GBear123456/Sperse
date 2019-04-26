/** Core imports */
import { Injectable, Injector } from '@angular/core';

/** Third party imports */
import { createCustomElement } from '@angular/elements';
import { from } from 'rxjs';
import { map, tap } from 'rxjs/operators';

/** Application imports */
import { AppConsts } from '../src/shared/AppConsts';
import { PackageChooserWidgetComponent } from './package-chooser-widget/src/app/package-chooser-widget-component';
import { AppPreBootstrap } from '../src/AppPreBootstrap';
import { environment } from '../src/environments/environment';

@Injectable()
export class WidgetsService {
    initialize(injector: Injector) {
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
