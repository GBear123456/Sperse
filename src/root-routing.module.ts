import { NgModule, ApplicationRef, Injector, Injectable, AfterViewInit, Directive } from '@angular/core';
import { RouterModule, Route, Router, Routes, NavigationEnd, PreloadingStrategy } from '@angular/router';
import { Observable, of } from 'rxjs';
import { RouteGuard } from '@shared/common/auth/route-guard';
import { LocalizationResolver } from '@shared/common/localization-resolver';
import { LayoutType } from '@shared/service-proxies/service-proxies';
import { AccountModule } from './account/account.module';
import { DisableTokenCheckRouteGuard } from '@shared/common/auth/disable-token-check-route-guard';

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
        canActivate: [RouteGuard],
        canActivateChild: [RouteGuard, LocalizationResolver],
        children: [
            {
                path: '',
                redirectTo: 'app',
                pathMatch: 'full'
            },
            {
                path: 'account',
                loadChildren: () => AccountModule, //async () => (await import('account/account.module')).AccountModule
            },
            {
                path: 'code-breaker',
                loadChildren: async () => (await import('bank-code/bank-code.module')).BankCodeModule,
                data: {
                    localizationSource: 'Platform',
                    layoutType: LayoutType.BankCode
                }
            },
            {
                path: 'personal-finance',
                loadChildren: async () => (await import('personal-finance/personal-finance.module')).PersonalFinanceModule,
                data: { feature: 'PFM', localizationSource: 'PFM' }
            },
            {
                path: 'app',
                loadChildren: async () => (await import('app/app.module')).AppModule,
                data: { localizationSource: 'Platform' }
            },
            {
                path: 'shared/bankpass',
                loadChildren: async () => (await import('public/bank-pass-host/bank-pass-host.module')).BankPassHostModule,
                data: { localizationSource: 'Platform' }
            },
            {
                path: 'shared/why-they-buy',
                loadChildren: async () => (await import('public/why-they-buy-host/why-they-buy-host.module')).WhyTheyBuyHostModule,
                data: { localizationSource: 'Platform' }
            }
        ]
    },
    {
        path: 'invoicing',
        canActivate: [DisableTokenCheckRouteGuard, LocalizationResolver],
        loadChildren: async () => (await import('public/invoicing/invoicing.module')).InvoicingModule,
        data: { localizationSource: 'Platform' }
    },
    {
        path: 'receipt',
        canActivate: [DisableTokenCheckRouteGuard, LocalizationResolver],
        loadChildren: async () => (await import('public/invoicing/invoicing.module')).InvoicingModule,
        data: { localizationSource: 'Platform' }
    },
    {
        path: 'p',
        canActivate: [DisableTokenCheckRouteGuard, LocalizationResolver],
        loadChildren: async () => (await import('public/products/public-products.module')).PublicProductsModule,
        data: { localizationSource: 'Platform' }
    },
    {
        path: '**',
        canActivateChild: [LocalizationResolver],
        loadChildren: async () => (await import('shared/not-found/not-found.module')).NotFoundModule,
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
    providers: [LocalizationResolver, DisableTokenCheckRouteGuard]
})
export class RootRoutingModule implements AfterViewInit {
    constructor(
        private injector: Injector,
        private router: Router,
        private applicationRef: ApplicationRef
    ) { }

    ngAfterViewInit() {
        this.router.events.subscribe((event: NavigationEnd) => {
            setTimeout(() => {
                this.injector.get(this.applicationRef.componentTypes[0])
                    .checkSetClasses(abp.session.userId || (event.url.indexOf('/account/') >= 0));
            }, 0);
        });
    }
}