import { AbpSessionService } from '@abp/session/abp-session.service';
import { Component, Injector, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import { SessionServiceProxy, UpdateUserSignInTokenOutput } from '@shared/service-proxies/service-proxies';
import { UrlHelper } from 'shared/helpers/UrlHelper';
import { ExternalLoginProvider, LoginService } from './login.service';

@Component({
    templateUrl: './login.component.html',
    styleUrls: [
        './login.component.less'
    ],
    animations: [accountModuleAnimation()]
})
export class LoginComponent extends AppComponentBase implements OnInit {
    submitting = false;
    isMultiTenancyEnabled: boolean = this.multiTenancy.isEnabled;

    constructor(
        injector: Injector,
        public loginService: LoginService,
        private _router: Router,
        private _sessionService: AbpSessionService,
        private _sessionAppService: SessionServiceProxy
    ) {
        super(injector);
    }

    get multiTenancySideIsTeanant(): boolean {
        return this._sessionService.tenantId > 0;
    }

    get isTenantSelfRegistrationAllowed(): boolean {
        return this.setting.getBoolean('App.TenantManagement.AllowSelfRegistration');
    }

    get isSelfRegistrationAllowed(): boolean {
        if (!this._sessionService.tenantId) {
            return false;
        }

        return this.setting.getBoolean('App.UserManagement.AllowSelfRegistration');
    }

    get isTenantRegistrationAllowed(): boolean {
        return this.setting.getBoolean('App.TenantManagement.AllowSelfRegistration');
    }

    ngOnInit(): void {
        if (this._sessionService.userId > 0 && UrlHelper.getReturnUrl() && UrlHelper.getSingleSignIn()) {
            this._sessionAppService.updateUserSignInToken()
                .subscribe((result: UpdateUserSignInTokenOutput) => {
                    const initialReturnUrl = UrlHelper.getReturnUrl();
                    const returnUrl = initialReturnUrl + (initialReturnUrl.indexOf('?') >= 0 ? '&' : '?') +
                        'accessToken=' + result.signInToken +
                        '&userId=' + result.encodedUserId +
                        '&tenantId=' + result.encodedTenantId;

                    location.href = returnUrl;
                });
        }

        let privacy = $('#privacy');
        privacy.on('show.bs.modal', function() {
            $(this)
                .addClass('modal-scrollfix')
                .find('.modal-body')
                .html('loading...')
                .load(AppConsts.remoteServiceBaseUrl + '/docs/privacy.html', function() {
                    privacy
                        .removeClass('modal-scrollfix')
                        .modal('handleUpdate');
                });
        });

        let terms = $('#terms');
        terms.on('show.bs.modal', function() {
            $(this)
                .addClass('modal-scrollfix')
                .find('.modal-body')
                .html('loading...')
                .load(AppConsts.remoteServiceBaseUrl + '/docs/terms.html', function() {
                    terms
                        .removeClass('modal-scrollfix')
                        .modal('handleUpdate');
                });
        });

        $('.print-this').on('click', function() {
            printElement($('.print-this-section')[0]);
        });

        function printElement(elem) {
            let domClone = elem.cloneNode(true);
            let printSection = document.getElementById('printSection');
            if (!printSection) {
                printSection = document.createElement('div');
                printSection.id = 'printSection';
                document.body.appendChild(printSection);
            }
            printSection.innerHTML = '';
            printSection.appendChild(domClone);
            window.print();
        }
    }

    login(): void {
        this.submitting = true;
        this.loginService.authenticate(() => this.submitting = false);
    }

    externalLogin(provider: ExternalLoginProvider) {
        this.loginService.externalAuthenticate(provider);
    }

    getLoginPlaceholder(): string {
        return abp.session.tenantId ? this.l('UserNameOrEmail') : this.l('EmailAddress');
    }
}
