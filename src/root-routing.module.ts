import { NgModule, ApplicationRef, Injector, Injectable, AfterViewInit, Directive } from '@angular/core';
import { RouterModule, Route, Router, Routes, NavigationEnd, PreloadingStrategy } from '@angular/router';
import { Observable, of } from 'rxjs';
import { RouteGuard } from '@shared/common/auth/route-guard';
import { LocalizationResolver } from '@shared/common/localization-resolver';
import { LayoutType } from '@shared/service-proxies/service-proxies';

@Injectable()
export class AppPreloadingStrategy implements PreloadingStrategy {
    preload(route: Route, load: Function): Observable<any> {
        //return abp.session.userId && (!route.data || !route.data.feature || abp.features.isEnabled(route.data.feature)) ? load() : of(null);
        return of(null);
    }
}

const routes: Routes = [
    {
        path: '',
        canActivate: [ RouteGuard ],
        canActivateChild: [ RouteGuard, LocalizationResolver ],
        children: [
            {
                path: '',
                redirectTo: 'app',
                pathMatch: 'full'
            },
            {
                path: 'account',
                loadChildren: () => import('account/account.module').then(m => m.AccountModule), //Lazy load account module
            },
            {
                path: 'code-breaker',
                loadChildren: () => import('bank-code/bank-code.module').then(m => m.BankCodeModule), //Lazy load bank code module
                data: {
                    localizationSource: 'Platform',
                    layoutType: LayoutType.BankCode
                }
            },
            {
                path: 'app',
                loadChildren: () => import('app/app.module').then(m => m.AppModule), //Lazy load desktop module
                data: { localizationSource: 'Platform' }
            },
            {
                path: 'shared/bankpass',
                loadChildren: () => import('public/bank-pass-host/bank-pass-host.module').then(m => m.BankPassHostModule),
                data: { localizationSource: 'Platform' }
            },
            {
                path: 'shared/why-they-buy',
                loadChildren: () => import('public/why-they-buy-host/why-they-buy-host.module').then(m => m.WhyTheyBuyHostModule),
                data: { localizationSource: 'Platform' }
            }
        ]
    },
    {
        path: '**',
        canActivateChild: [ LocalizationResolver ],
        loadChildren: () => import('shared/not-found/not-found.module').then(m => m.NotFoundModule),
    }
];

@NgModule({
    imports: [
        RouterModule.forRoot(routes, {
            preloadingStrategy: AppPreloadingStrategy,
            relativeLinkResolution: 'legacy'
        })
    ],
    exports: [
        RouterModule
    ],
    providers: [LocalizationResolver]
})
export class RootRoutingModule implements AfterViewInit {
    constructor(
        private injector: Injector,
        private router: Router,
        private applicationRef: ApplicationRef
    ) {}

    ngAfterViewInit() {
        this.router.events.subscribe((event: NavigationEnd) => {
                setTimeout(() => {
                    this.injector.get(this.applicationRef.componentTypes[0])
                        .checkSetClasses(abp.session.userId || (event.url.indexOf('/account/') >= 0));
                }, 0);
            }
        );
    }
}