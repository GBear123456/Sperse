/** Core imports */
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { finalize, map, publishReplay, refCount } from 'rxjs/operators';
import toPairs from 'lodash/toPairs';

/** Application imports */
import { AppAuthService } from '@shared/common/auth/app-auth.service';
import { TokenService } from '@abp/auth/token.service';
import { LogService } from '@abp/log/log.service';
import { MessageService } from '@abp/message/message.service';
import { UtilsService } from '@abp/utils/utils.service';
import { AppConsts } from '@shared/AppConsts';
import { UrlHelper } from '@shared/helpers/UrlHelper';
import {
    AuthenticateModel,
    AuthenticateResultModel,
    ExternalAuthenticateModel,
    ExternalAuthenticateResultModel,
    ExternalLoginProviderInfoModel,
    TokenAuthServiceProxy,
    SendPasswordResetCodeInput,
    AccountServiceProxy,
    SendPasswordResetCodeOutput,
    SignUpMemberResponse,
    SignUpMemberRequest
} from '@shared/service-proxies/service-proxies';
import { RegisterConfirmComponent } from '@shared/common/dialogs/register-confirm/register-confirm.component';
import { AppFeatures } from '@shared/AppFeatures';

declare const FB: any; // Facebook API
declare const gapi: any; // Facebook API
declare const WL: any; // Microsoft API

export class ExternalLoginProvider extends ExternalLoginProviderInfoModel {

    static readonly FACEBOOK: string = 'Facebook';
    static readonly GOOGLE: string = 'Google';
    static readonly MICROSOFT: string = 'Microsoft';

    icon: string;
    initialized = false;

    constructor(providerInfo: ExternalLoginProviderInfoModel) {
        super();
        this.name = providerInfo.name;
        this.clientId = providerInfo.clientId;
        this.icon = ExternalLoginProvider.getSocialIcon(this.name);
    }

    private static getSocialIcon(providerName: string): string {
        providerName = providerName.toLowerCase();

        if (providerName === 'google') {
            providerName = 'googleplus';
        }

        return providerName;
    }
}

@Injectable()
export class LoginService {

    static readonly twoFactorRememberClientTokenName = 'TwoFactorRememberClientToken';
    authenticateModel: AuthenticateModel;
    authenticateResult: AuthenticateResultModel;
    externalLoginModal: ExternalAuthenticateModel;
    resetPasswordModel: SendPasswordResetCodeInput;
    resetPasswordResult: SendPasswordResetCodeOutput;
    externalLoginProviders$: Observable<ExternalLoginProvider[]>;

    constructor(
        private tokenAuthService: TokenAuthServiceProxy,
        private router: Router,
        private utilsService: UtilsService,
        private messageService: MessageService,
        private tokenService: TokenService,
        private logService: LogService,
        private accountService: AccountServiceProxy,
        private authService: AppAuthService,
        public dialog: MatDialog
    ) {
        this.clear();
        let model = JSON.parse(sessionStorage.getItem('authenticateModel'));
        if (model) {
            this.authenticateModel = model;
        }

        let result = JSON.parse(sessionStorage.getItem('authenticateResult'));
        if (result) {
            this.authenticateResult = result;
        }

        sessionStorage.removeItem('authenticateModel');
        sessionStorage.removeItem('authenticateResult');
        this.initExternalLoginProviders();
    }

    authenticate(finallyCallback?: () => void, redirectUrl?: string, autoDetectTenancy: boolean = true): void {
        finallyCallback = finallyCallback || (() => { });
        this.authService.stopTokenCheck();

        //We may switch to localStorage instead of cookies
        this.authenticateModel.twoFactorRememberClientToken = this.utilsService.getCookieValue(LoginService.twoFactorRememberClientTokenName);
        this.authenticateModel.singleSignIn = UrlHelper.getSingleSignIn();
        this.authenticateModel.returnUrl = UrlHelper.getReturnUrl();
        this.authenticateModel.autoDetectTenancy = autoDetectTenancy;

        this.tokenAuthService
            .authenticate(this.authenticateModel)
            .pipe(finalize(finallyCallback))
            .subscribe((result: AuthenticateResultModel) => {
                this.processAuthenticateResult(result, redirectUrl);
                this.authService.startTokenCheck();
            }, () => {
                abp.multiTenancy.setTenantIdCookie();
            });
    }

    sendPasswordResetCode(finallyCallback?: () => void, autoDetectTenancy: boolean = true): void {
        finallyCallback = finallyCallback || (() => { });

        this.resetPasswordModel.autoDetectTenancy = autoDetectTenancy;
        this.accountService
            .sendPasswordResetCode(this.resetPasswordModel)
            .pipe(finalize(finallyCallback))
            .subscribe((result: SendPasswordResetCodeOutput) => {
                if (this.resetPasswordModel.autoDetectTenancy) {
                    this.resetPasswordResult = result;
                } else {
                    this.resetPasswordResult = null;
                }

                if (result.detectedTenancies.length > 1) {
                    this.router.navigate(['account/select-tenant']);
                } else {
                    this.messageService.success(
                        abp.localization.localize('PasswordResetMailSentMessage', 'Platform'),
                        abp.localization.localize('MailSent', 'Platform')
                    ).done(() => { this.router.navigate(['account/login']); });
                }
            });
    }

    externalAuthenticate(provider: ExternalLoginProvider): void {
        this.ensureExternalLoginProviderInitialized(provider, () => {
            this.authService.stopTokenCheck();
            if (provider.name === ExternalLoginProvider.FACEBOOK) {
                this.facebookLogin();
            } else if (provider.name === ExternalLoginProvider.GOOGLE) {
                gapi.auth2.getAuthInstance().signIn().then(() => {
                    this.googleLoginStatusChangeCallback(gapi.auth2.getAuthInstance().isSignedIn.get());
                });
            } else if (provider.name === ExternalLoginProvider.MICROSOFT) {
                WL.login({
                    scope: ['wl.signin', 'wl.basic', 'wl.emails']
                });
            }
            this.authService.startTokenCheck();
        });
    }

    facebookLogin() {
        FB.login(
            response => {
                if (response.authResponse.grantedScopes.split(',').includes('email')) {
                    this.facebookLoginStatusChangeCallback(response);
                } else {
                    abp.message.error('Email is required', 'Facebook Login Failed');
                }
            },
            { scope: 'email', return_scopes: true, auth_type: 'rerequest' }
        );
    }

    init(): void {
        this.initExternalLoginProviders();
    }

    private processAuthenticateResult(authenticateResult, redirectUrl?: string) {
        this.authenticateResult = authenticateResult;

        if (authenticateResult.shouldResetPassword) {
            // Password reset

            let tenantId = authenticateResult.detectedTenancies[0].id;
            this.router.navigate(['account/reset-password'], {
                queryParams: {
                    userId: authenticateResult.userId,
                    tenantId: tenantId,
                    resetCode: authenticateResult.passwordResetCode
                }
            });

            this.clear();

        } else if (authenticateResult.requiresTwoFactorVerification) {
            // Two factor authentication
            let tenantId = authenticateResult.detectedTenancies[0].id;
            abp.multiTenancy.setTenantIdCookie(tenantId);

            this.router.navigate(['account/send-code']);

        } else if (authenticateResult.accessToken) {
            // Successfully logged in
            if (authenticateResult.returnUrl && !redirectUrl) {
                redirectUrl = authenticateResult.returnUrl;
            }

            this.login(
                authenticateResult.accessToken,
                authenticateResult.encryptedAccessToken,
                authenticateResult.expireInSeconds,
                this.authenticateModel.rememberClient,
                authenticateResult.twoFactorRememberClientToken,
                redirectUrl
            );

        } else if (authenticateResult.userNotFound && abp.features.isEnabled(AppFeatures.PFMApplications)) {
            // show confirmation msg about creating user
            this.dialog.open(RegisterConfirmComponent, {
                width: '600px',
                id: 'confirm-register',
                panelClass: ['confirm-register'],
                data: {
                    authenticateResult: authenticateResult,
                    routerUrl: this.router.routerState.snapshot.url.split('?')[0].split('/').pop()
                }
            }).afterClosed().subscribe(result => {
                if (result) {
                    abp.ui.setBusy();
                    this.externalLoginModal.autoRegistration = true;
                    this.tokenAuthService.externalAuthenticate(this.externalLoginModal)
                        .pipe(finalize(() => abp.ui.clearBusy()))
                        .subscribe((result: ExternalAuthenticateResultModel) => {
                            this.processAuthenticateResult(result, result.returnUrl || AppConsts.appBaseUrl);
                        });
                }
            });
        } else if (authenticateResult.detectedTenancies.length > 1) {
            //Select tenant
            this.router.navigate(['account/select-tenant']);
        } else {
            // Unexpected result!

            this.logService.warn('Unexpected authenticateResult!');
            this.router.navigate(['account/login']);

        }
    }

    signUpMember(data: SignUpMemberRequest) {
        abp.ui.setBusy();
        this.accountService.signUpMember(data)
            .pipe(finalize(() => {
                abp.ui.clearBusy();
            }))
            .subscribe((res: SignUpMemberResponse) => {
                this.processAuthenticateResult(
                    res.authenticateResult,
                    AppConsts.appBaseUrl
                );
            });
    }

    private login(accessToken: string, encryptedAccessToken: string, expireInSeconds: number, rememberMe?: boolean, twoFactorRememberClientToken?: string, redirectUrl?: string): void {
        this.authService.setLoginCookies(accessToken, encryptedAccessToken, expireInSeconds, rememberMe, twoFactorRememberClientToken, redirectUrl);

        redirectUrl = redirectUrl || sessionStorage.getItem('redirectUrl');
        if (redirectUrl)
            sessionStorage.removeItem('redirectUrl');
        else {
            redirectUrl = UrlHelper.initialUrl;
            if (redirectUrl.indexOf('/account') > 0)
                redirectUrl = AppConsts.appBaseUrl;
            else {
                let params = UrlHelper.getQueryParametersUsingParameters(
                    UrlHelper.getInitialUrlParameters()
                );
                delete params.secureId;
                delete params.redirect;
                delete params.switchAccountToken;

                redirectUrl = redirectUrl.split('?').shift() +
                    '?' + toPairs(params).map(pair => pair.join('='));
            }
        }

        setTimeout(() => location.href = redirectUrl, 300);
    }

    private clear(): void {
        this.authenticateModel = new AuthenticateModel();
        this.authenticateModel.rememberClient = false;
        this.authenticateResult = null;
        this.resetPasswordModel = null;
        this.resetPasswordResult = null;
    }

    private initExternalLoginProviders() {
        this.externalLoginProviders$ = this.tokenAuthService
            .getExternalAuthenticationProviders()
            .pipe(
                publishReplay(),
                refCount(),
                map((providers: ExternalLoginProviderInfoModel[]) => providers.map(p => new ExternalLoginProvider(p)))
            );
    }

    ensureExternalLoginProviderInitialized(loginProvider: ExternalLoginProvider, callback: () => void) {
        if (loginProvider.initialized) {
            callback();
            return;
        }
        if (loginProvider.name === ExternalLoginProvider.FACEBOOK) {
            jQuery.getScript('https://connect.facebook.net/en_US/sdk.js', () => {
                FB.init({
                    appId: loginProvider.clientId,
                    cookie: false,
                    xfbml: true,
                    version: 'v3.2'
                });
                this.facebookLogin();
            });
        } else if (loginProvider.name === ExternalLoginProvider.GOOGLE) {
            jQuery.getScript('https://apis.google.com/js/api.js', () => {
                gapi.load('client:auth2',
                    () => {
                        gapi.client.init({
                            clientId: loginProvider.clientId,
                            scope: 'openid profile email'
                        }).then(() => {
                            callback();
                        });
                    });
            });
        } else if (loginProvider.name === ExternalLoginProvider.MICROSOFT) {
            jQuery.getScript('//js.live.net/v5.0/wl.js', () => {
                WL.Event.subscribe('auth.login', this.microsoftLogin);
                WL.init({
                    client_id: loginProvider.clientId,
                    scope: ['wl.signin', 'wl.basic', 'wl.emails'],
                    redirect_uri: AppConsts.appBaseUrl,
                    response_type: 'token'
                });
            });
        }
    }

    private facebookLoginStatusChangeCallback(resp) {
        if (resp.status === 'connected') {
            const model = this.externalLoginModal = new ExternalAuthenticateModel();
            model.authProvider = ExternalLoginProvider.FACEBOOK;
            model.providerAccessCode = resp.authResponse.accessToken;
            model.providerKey = resp.authResponse.userID;
            model.singleSignIn = UrlHelper.getSingleSignIn();
            model.returnUrl = UrlHelper.getReturnUrl();

            this.tokenAuthService.externalAuthenticate(model)
                .subscribe((result: ExternalAuthenticateResultModel) => {
                    if (result.waitingForActivation) {
                        this.messageService.info('You have successfully registered. Waiting for activation!');
                        return;
                    }
                    this.processAuthenticateResult(result, result.returnUrl || AppConsts.appBaseUrl);
                });
        }
    }

    private googleLoginStatusChangeCallback(isSignedIn) {
        if (isSignedIn) {
            const model = new ExternalAuthenticateModel();
            model.authProvider = ExternalLoginProvider.GOOGLE;
            model.providerAccessCode = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token;
            model.providerKey = gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile().getId();
            model.singleSignIn = UrlHelper.getSingleSignIn();
            model.returnUrl = UrlHelper.getReturnUrl();

            this.tokenAuthService.externalAuthenticate(model)
                .subscribe((result: ExternalAuthenticateResultModel) => {
                    if (result.waitingForActivation) {
                        this.messageService.info('You have successfully registered. Waiting for activation!');
                        return;
                    }

                    this.login(result.accessToken, result.encryptedAccessToken, result.expireInSeconds, false, '', result.returnUrl);
                });
        }
    }

    /**
    * Microsoft login is not completed yet, because of an error thrown by zone.js: https://github.com/angular/zone.js/issues/290
    */
    private microsoftLogin() {
        this.logService.debug(WL.getSession());
        const model = new ExternalAuthenticateModel();
        model.authProvider = ExternalLoginProvider.MICROSOFT;
        model.providerAccessCode = WL.getSession().access_token;
        model.providerKey = WL.getSession().id; // How to get id?
        model.singleSignIn = UrlHelper.getSingleSignIn();
        model.returnUrl = UrlHelper.getReturnUrl();

        this.tokenAuthService.externalAuthenticate(model)
            .subscribe((result: ExternalAuthenticateResultModel) => {
                if (result.waitingForActivation) {
                    this.messageService.info('You have successfully registered. Waiting for activation!');
                    return;
                }

                this.login(result.accessToken, result.encryptedAccessToken, result.expireInSeconds, false, '', result.returnUrl);
            });
    }
}
