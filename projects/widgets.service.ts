/** Core imports */
import { Injectable, Injector } from '@angular/core';

/** Third party imports */
import { from } from 'rxjs';
import { map, tap, switchMap } from 'rxjs/operators';

/** Application imports */
import { AppConsts } from '../src/shared/AppConsts';
import { AppPreBootstrap } from '../src/AppPreBootstrap';
import { environment } from '../src/environments/environment';

@Injectable()
export class WidgetsService {
    initialize(injector: Injector, callback?) {
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
                switchMap(() => {
                    return AppPreBootstrap.getUserConfiguration(
                        () => callback && callback(),
                        false
                    );
                })
            ).toPromise();
        };
    }
}