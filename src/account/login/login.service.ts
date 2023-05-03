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
import { TokenService } from 'abp-ng2-module';
import { LogService } from 'abp-ng2-module';
import { MessageService } from 'abp-ng2-module';
import { UtilsService } from 'abp-ng2-module';
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
    SignUpMemberRequest,
    OAuth2ExchangeCodeAuthenticateModel
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
    static readonly LINKEDIN: string = 'LinkedIn';
    static readonly DISCORD: string = 'Discord';

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
    lastOAuth2Result: ExternalAuthenticateResultModel;

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

    completeSourceEvent() {
        if (window.opener)
            setTimeout(() => {
                window.opener.postMessage('complete', '*');
            }, 1000);
    }

    authenticate(finallyCallback?: () => void,
        redirectUrl?: string,
        autoDetectTenancy: boolean = true,
        setCookiesOnly: boolean = false,
        onSuccessCallback = (result: AuthenticateResultModel) => { }
    ): void {
        finallyCallback = finallyCallback || (() => { });
        this.authService.stopTokenCheck();

        //We may switch to localStorage instead of cookies
        this.authenticateModel.twoFactorRememberClientToken = this.utilsService.getCookieValue(LoginService.twoFactorRememberClientTokenName);
        this.authenticateModel.singleSignIn = UrlHelper.getSingleSignIn();
        this.authenticateModel.returnUrl = UrlHelper.getReturnUrl();
        this.authenticateModel.autoDetectTenancy = autoDetectTenancy;

        this.tokenAuthService
            .authenticate(this.authenticateModel)
            .pipe(finalize(finallyCallback)).subscribe((result: AuthenticateResultModel) => {
                onSuccessCallback(result);
                this.processAuthenticateResult(result, redirectUrl, setCookiesOnly);
                this.authService.startTokenCheck();
            }, (error: any) => {
                this.messageService.error(
                    (error && error.message) ||
                    abp.localization.localize('InvalidUserNameOrPassword', 'Platform')
                );
                abp.multiTenancy.setTenantIdCookie();
            });
    }

    externalAuthenticateByResult(result: ExternalAuthenticateResultModel,
        finallyCallback?: () => void,
        setCookiesOnly: boolean = false,
        onSuccessCallback = (result: AuthenticateResultModel) => { }
    ) {
        if (!result)
            return;

        finallyCallback = finallyCallback || (() => { });
        this.authService.stopTokenCheck();

        const model = this.externalLoginModal = new ExternalAuthenticateModel();
        model.authProvider = result.authProvider;
        model.providerAccessCode = result.providerAccessCode;
        model.providerKey = '-';
        model.singleSignIn = UrlHelper.getSingleSignIn();
        model.returnUrl = UrlHelper.getReturnUrl();
        model.autoDetectTenancy = false;
        model.isAutoDetected = true;

        this.tokenAuthService.externalAuthenticate(model)
            .pipe(finalize(finallyCallback))
            .subscribe((result: ExternalAuthenticateResultModel) => {
                if (result.waitingForActivation) {
                    this.messageService.info('You have successfully registered. Waiting for activation!');
                    return;
                }
                onSuccessCallback(result);
                this.processAuthenticateResult(result, result.returnUrl || AppConsts.appBaseUrl, setCookiesOnly);
            });
    }

    sendPasswordResetCode(
        finallyCallback = () => { },
        autoDetectTenancy: boolean = true,
        redirectToLogin: boolean = true,
        onSuccessCallback = () => { }
    ): void {
        abp.auth.clearToken();
        this.resetPasswordModel.autoDetectTenancy = autoDetectTenancy;
        this.accountService
            .sendPasswordResetCode(this.resetPasswordModel)
            .pipe(finalize(finallyCallback))
            .subscribe((result: SendPasswordResetCodeOutput) => {
                onSuccessCallback();
                if (this.resetPasswordModel.autoDetectTenancy) {
                    this.resetPasswordResult = result;
                } else {
                    this.resetPasswordResult = null;
                }

                if (result.detectedTenancies.length > 1) {
                    this.router.navigate(['account/select-tenant'],
                        { queryParams: { extlogin: !redirectToLogin } }
                    );
                } else if (redirectToLogin) {
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
            switch (provider.name) {
                case ExternalLoginProvider.LINKEDIN:
                    this.linkedInInitLogin(provider);
                    break;
                case ExternalLoginProvider.FACEBOOK:
                    this.facebookLogin();
                    break;
                case ExternalLoginProvider.GOOGLE:
                    gapi.auth2.getAuthInstance().signIn().then(() => {
                        this.googleLoginStatusChangeCallback(gapi.auth2.getAuthInstance().isSignedIn.get());
                    });
                    break;
                case ExternalLoginProvider.MICROSOFT:
                    WL.login({
                        scope: ['wl.signin', 'wl.basic', 'wl.emails']
                    });
                    break;
                case ExternalLoginProvider.DISCORD:
                    this.discordInitLogin(provider);
                    break;
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

    linkedInInitLogin(provider: ExternalLoginProvider) {
        window.location.href = 'https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=' + provider.clientId +
            '&redirect_uri=' + this.getRedirectUrl(provider.name) +
            '&state=foobar&scope=r_liteprofile%20r_emailaddress';
    }

    clearOAuth2Params(): Promise<boolean> {
        return this.router.navigate([], {
            queryParams: {
                'code': null,
                'state': null,
                'provider': null
            },
            queryParamsHandling: 'merge'
        });
    }

    oAuth2Login(
        providerName: string,
        code: string,
        state: string,
        setCookiesOnly: boolean = false,
        redirectToSignUp: boolean = false,
        onSuccessCallback = (result: AuthenticateResultModel) => { }
    ) {
        abp.ui.setBusy();

        if (abp.session.tenantId)
            abp.multiTenancy.setTenantIdCookie(abp.session.tenantId);

        this.externalLoginProviders$.subscribe(providers => {
            if (!providerName) {
                providerName = ExternalLoginProvider.LINKEDIN;
            }

            let name = providerName.toLowerCase(),
                provider = providers.find(x => x.name.toLowerCase() == name);
            if (!provider)
                return;

            //todo check state
            this.clearOAuth2Params()
                .then(() => {
                    const model = new OAuth2ExchangeCodeAuthenticateModel();
                    model.authProvider = provider.name;
                    model.providerAccessCode = '-';
                    model.providerKey = '-';
                    model.singleSignIn = UrlHelper.getSingleSignIn();
                    model.returnUrl = UrlHelper.getReturnUrl();
                    model.autoDetectTenancy = !abp.session.tenantId;;

                    model.exchangeCode = code;
                    model.loginReturnUrl = this.getRedirectUrl(providerName);

                    this.tokenAuthService.oAuth2ExchangeCodeAuthenticate(model)
                        .pipe(finalize(() => abp.ui.clearBusy()))
                        .subscribe((result: ExternalAuthenticateResultModel) => {
                            this.lastOAuth2Result = result;

                            if (result.userNotFound) {
                                if (redirectToSignUp) {
                                    this.router.navigate(['account/signup'], {
                                        queryParams: {
                                            extlogin: setCookiesOnly,
                                            code: code,
                                            state: state,
                                            provider: provider.name
                                        }
                                    });
                                } else {
                                    this.messageService.error('User is not found');
                                }
                            } else {
                                onSuccessCallback(result);
                                this.processAuthenticateResult(result,
                                    result.returnUrl || AppConsts.appBaseUrl, setCookiesOnly);
                            }
                        });
                });
        });
    }

    discordInitLogin(provider: ExternalLoginProvider, includeGuilds: boolean = false) {
        let scopes = ['email', 'identify'];
        if (includeGuilds)
            scopes.push('guilds');
        let scopesString = scopes.join('%20');
        window.location.href = 'https://discord.com/oauth2/authorize?response_type=code&client_id=' + provider.clientId +
            `&redirect_uri=${this.getRedirectUrl(provider.name)}&state=${new Date().getTime()}&scope=${scopesString}&prompt=none`;
    }

    getRedirectUrl(providerName: string) {
        let providerNameLower = providerName.toLowerCase();
        switch (providerNameLower) {
            case 'linkedin':
                return window.location.href;
            default:
                return `${AppConsts.appBaseUrl}${location.pathname}?provider=${providerNameLower}`;
        }
    }

    init(): void {
        this.initExternalLoginProviders();
    }

    processAuthenticateResult(authenticateResult, redirectUrl?: string, setCookiesOnly = false) {
        this.authenticateResult = authenticateResult;

        if (authenticateResult.shouldResetPassword) {
            // Password reset

            let tenantId = authenticateResult.detectedTenancies[0].id;
            this.router.navigate(['account/reset-password'], {
                queryParams: {
                    userId: authenticateResult.userId,
                    tenantId: tenantId,
                    resetCode: authenticateResult.passwordResetCode,
                    extlogin: setCookiesOnly
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

            if (setCookiesOnly) {
                this.completeSourceEvent();
                this.authService.setLoginCookies(
                    authenticateResult.accessToken,
                    authenticateResult.encryptedAccessToken,
                    authenticateResult.expireInSeconds,
                    this.authenticateModel.rememberClient,
                    authenticateResult.twoFactorRememberClientToken,
                    redirectUrl
                );
            } else
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
                    this.externalLoginModal.autoDetectTenancy = true;
                    this.tokenAuthService.externalAuthenticate(this.externalLoginModal)
                        .pipe(finalize(() => abp.ui.clearBusy()))
                        .subscribe((result: ExternalAuthenticateResultModel) => {
                            this.processAuthenticateResult(result, result.returnUrl || AppConsts.appBaseUrl);
                        });
                }
            });
        } else if (!!authenticateResult.detectedTenancies && authenticateResult.detectedTenancies.length > 1) {
            //Select tenant
            this.router.navigate(['account/select-tenant'],
                { queryParams: { extlogin: setCookiesOnly } }
            );
        } else {
            // Unexpected result!

            this.logService.warn('Unexpected authenticateResult!');
            if (!setCookiesOnly)
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
                delete params.tenantId;
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
        if (abp.session.tenantId)
            abp.multiTenancy.setTenantIdCookie(abp.session.tenantId);

        this.externalLoginProviders$ = this.tokenAuthService
            .getExternalAuthenticationProviders()
            .pipe(
                publishReplay(),
                refCount(),
                map((providers: ExternalLoginProviderInfoModel[]) => providers.filter(p => !!p.clientId).map(p => new ExternalLoginProvider(p)))
            );
    }

    ensureExternalLoginProviderInitialized(loginProvider: ExternalLoginProvider, callback: () => void) {
        if (loginProvider.initialized || loginProvider.name === ExternalLoginProvider.LINKEDIN || loginProvider.name == ExternalLoginProvider.DISCORD) {
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
            model.autoDetectTenancy = !abp.session.tenantId;

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
            model.autoDetectTenancy = !abp.session.tenantId;

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
        model.autoDetectTenancy = !abp.session.tenantId;

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
