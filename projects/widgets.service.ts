import { Injectable, Injector } from '@angular/core';
import { from } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { AppConsts } from '../src/shared/AppConsts';
import { PackageChooserWidgetComponent } from './package-chooser-widget/src/app/package-chooser-widget-component';
import { AppPreBootstrap } from '../src/AppPreBootstrap';
import { createCustomElement } from '@angular/elements';
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
                    AppPreBootstrap.getUserConfiguration(() => {
                        const packageChooserElement = createCustomElement(PackageChooserWidgetComponent, { injector: injector });
                        customElements.define('package-chooser-widget', packageChooserElement);
                    }, false);
                })
            ).toPromise();
        };
    }
}
