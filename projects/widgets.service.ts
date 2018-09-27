import { Injectable, Injector } from '@angular/core';
import { map, tap } from 'rxjs/operators';
import { AppConsts } from '../src/shared/AppConsts';
import { PackageChooserWidgetComponent } from './package-chooser-widget/src/app/package-chooser-widget-component';
import { AppPreBootstrap } from '../src/AppPreBootstrap';
import { createCustomElement } from '@angular/elements';
import { HttpClient } from '@angular/common/http';
import { environment } from '../src/environments/environment';

@Injectable()
export class WidgetsService {
    initialize(injector: Injector, http: HttpClient) {
        return () => {
            return http.get(environment.appBaseUrl + '/assets/' + environment.appConfig).pipe(
                map((config: any) => config.remoteServiceBaseUrl),
                tap(remoteUrl => {
                    AppConsts.remoteServiceBaseUrl = remoteUrl;
                    AppPreBootstrap.getUserConfiguration(() => {
                        const packageChooserElement = createCustomElement(PackageChooserWidgetComponent, { injector: injector });
                        customElements.define('package-chooser-widget', packageChooserElement);
                    }, false);
                })
            ).toPromise();
        };
    }
}
