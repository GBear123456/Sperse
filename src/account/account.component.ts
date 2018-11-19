import { Component, Injector, OnInit, ViewContainerRef, ViewEncapsulation } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import * as _ from 'lodash';
import * as moment from 'moment';
import { LoginService } from './login/login.service';
import { AppSessionService } from '@shared/common/session/app-session.service';

@Component({
    templateUrl: './account.component.html',
    styleUrls: [
        './account.component.less'
    ],
    encapsulation: ViewEncapsulation.None
})
export class AccountComponent extends AppComponentBase implements OnInit {

    private viewContainerRef: ViewContainerRef;

    tenantName: string = AppConsts.defaultTenantName;
    currentYear: number = moment().year();
    remoteServiceBaseUrl: string = AppConsts.remoteServiceBaseUrl;
    tenantChangeDisabledRoutes: string[] = ['select-edition', 'buy', 'upgrade', 'extend', 'register-tenant'];

    public constructor(
        injector: Injector,
        private _loginService: LoginService,
        private _appSession: AppSessionService,
        viewContainerRef: ViewContainerRef
    ) {
        super(injector);

        // We need this small hack in order to catch application root view container ref for modals
        this.viewContainerRef = viewContainerRef;
    }

    showTenantChange(): boolean {
        if (!this._router.url) {
            return false;
        }

        if (_.filter(this.tenantChangeDisabledRoutes, route => this._router.url.indexOf('/account/' + route) >= 0).length) {
            return false;
        }

        return false;
    }

    ngOnInit(): void {
        this._loginService.init();
        this.setTitle('Login');

        let tenant = this._appSession.tenant;
        if (tenant)
            this.tenantName = tenant.name || tenant.tenancyName;
    }

    goToHome(): void {
        (window as any).location.href = '/';
    }

    getBgUrl(): string {
        return 'url(./assets/metronic/dist/html/' + this.ui.getTheme() + '/assets/demo/' + this.ui.getTheme() +'/media/img/bg/bg-4.jpg)';
    }

    private supportsTenancyNameInUrl() {
        return (AppConsts.appBaseUrlFormat && AppConsts.appBaseUrlFormat.indexOf(AppConsts.tenancyNamePlaceHolderInUrl) >= 0);
    }
}
