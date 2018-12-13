import { AppAuthService } from '@shared/common/auth/app-auth.service';
import { TokenService } from '@abp/auth/token.service';
import { LogService } from '@abp/log/log.service';
import { MessageService } from '@abp/message/message.service';
import { UtilsService } from '@abp/utils/utils.service';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AppConsts } from '@shared/AppConsts';
import { UrlHelper } from '@shared/helpers/UrlHelper';
import {
    AuthenticateModel,
    AuthenticateResultModel,
    ExternalAuthenticateModel,
    ExternalAuthenticateResultModel,
    ExternalLoginProviderInfoModel,
    TokenAuthServiceProxy,
    TenantHostType,
    SendPasswordResetCodeInput,
    AccountServiceProxy,
    SendPasswordResetCodeOutput,
    SignUpMemberResponse,
    ApplicationServiceProxy,
    SignUpMemberRequest
} from '@shared/service-proxies/service-proxies';
import * as _ from 'lodash';
import { finalize, map, publishReplay, refCount } from 'rxjs/operators';
import { Observable } from 'rxjs';

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

    resetPasswordModel: SendPasswordResetCodeInput;
    resetPasswordResult: SendPasswordResetCodeOutput;
    
    externalLoginProviders$: Observable<ExternalLoginProvider[]>;
    signUpData: SignUpMemberRequest = new SignUpMemberRequest();

    constructor(
        private _tokenAuthService: TokenAuthServiceProxy,
        private _router: Router,
        private _utilsService: UtilsService,
        private _messageService: MessageService,
        private _tokenService: TokenService,
        private _logService: LogService,
        private _accountService: AccountServiceProxy,
        private _authService: AppAuthService,
        private _applicationServiceProxy: ApplicationServiceProxy
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
        this._authService.stopTokenCheck();

        //We may switch to localStorage instead of cookies
        this.authenticateModel.twoFactorRememberClientToken = this._utilsService.getCookieValue(LoginService.twoFactorRememberClientTokenName);
        this.authenticateModel.singleSignIn = UrlHelper.getSingleSignIn();
        this.authenticateModel.returnUrl = UrlHelper.getReturnUrl();
        this.authenticateModel.autoDetectTenancy = autoDetectTenancy;

        this._tokenAuthService
            .authenticate(this.authenticateModel)
            .pipe(finalize(finallyCallback))
            .subscribe((result: AuthenticateResultModel) => {
                this.processAuthenticateResult(result, redirectUrl);
                this._authService.startTokenCheck();
            });
    }

    sendPasswordResetCode(finallyCallback?: () => void, autoDetectTenancy: boolean = true): void {
        finallyCallback = finallyCallback || (() => { });

        this.resetPasswordModel.autoDetectTenancy = autoDetectTenancy;
        this.resetPasswordModel.tenantHostType = <any>TenantHostType.PlatformApp;
        this._accountService
            .sendPasswordResetCode(this.resetPasswordModel)
            .pipe(finalize(finallyCallback))
            .subscribe((result: SendPasswordResetCodeOutput) => {
                if (this.resetPasswordModel.autoDetectTenancy) {
                    this.resetPasswordResult = result;
                } else {
                    this.resetPasswordResult = null;
                }

                if (result.detectedTenancies.length > 1) {
                    this._router.navigate(['account/select-tenant']);
                } else {
                    this._messageService.success(
                        abp.localization.localize('PasswordResetMailSentMessage', 'Platform'),
                        abp.localization.localize('MailSent', 'Platform')
                    ).done(() => { this._router.navigate(['account/login']); });
                }
            });
    }

    externalAuthenticate(provider: ExternalLoginProvider): void {
        this.ensureExternalLoginProviderInitialized(provider, () => {
            this._authService.stopTokenCheck();
            if (provider.name === ExternalLoginProvider.FACEBOOK) {
                FB.login(response => {
                    this.facebookLoginStatusChangeCallback(response);
                }, { scope: 'email' });
            } else if (provider.name === ExternalLoginProvider.GOOGLE) {
                gapi.auth2.getAuthInstance().signIn().then(() => {
                    this.googleLoginStatusChangeCallback(gapi.auth2.getAuthInstance().isSignedIn.get());
                });
            } else if (provider.name === ExternalLoginProvider.MICROSOFT) {
                WL.login({
                    scope: ['wl.signin', 'wl.basic', 'wl.emails']
                });
            }
            this._authService.startTokenCheck();
        });
    }

    init(): void {
        this.initExternalLoginProviders();
    }

    private processAuthenticateResult(authenticateResult, redirectUrl?: string) {
        this.authenticateResult = authenticateResult;

        if (authenticateResult.shouldResetPassword) {
            // Password reset

            let tenantId = authenticateResult.detectedTenancies[0].id;
            this._router.navigate(['account/reset-password'], {
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

            this._router.navigate(['account/send-code']);

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

        } else if (authenticateResult.userNotFound && abp.features.isEnabled('PFM.Applications')) {
            // show confirmation msg about creating user
            abp.message.confirm(
                '',
                `You will sign up to LendSpace with the ${authenticateResult.email} email.`,
                (result) => {
                    if (result) {
                        this.signUpData = {
                            ...this.signUpData,
                            firstName: authenticateResult.firstName,
                            lastName: authenticateResult.lastName,
                            email: authenticateResult.email,
                            isUSCitizen: true
                        } as SignUpMemberRequest;
                        this.signUpMember(this.signUpData);
                    }
                });
        } else if (authenticateResult.detectedTenancies.length > 1) {
            //Select tenant
            this._router.navigate(['account/select-tenant']);
        } else {
            // Unexpected result!

            this._logService.warn('Unexpected authenticateResult!');
            this._router.navigate(['account/login']);

        }
    }

    signUpMember(data: SignUpMemberRequest) {
        abp.ui.setBusy();
        this._applicationServiceProxy.signUpMember(data)
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
        let tokenExpireDate = rememberMe ? (new Date(new Date().getTime() + 1000 * expireInSeconds)) : undefined;

        this._tokenService.setToken(
            accessToken,
            tokenExpireDate
        );

        this._utilsService.setCookieValue(
            AppConsts.authorization.encrptedAuthTokenName,
            encryptedAccessToken,
            tokenExpireDate,
            abp.appPath
        );

        if (twoFactorRememberClientToken) {
            this._utilsService.setCookieValue(
                LoginService.twoFactorRememberClientTokenName,
                twoFactorRememberClientToken,
                new Date(new Date().getTime() + 365 * 86400000), // 1 year
                abp.appPath
            );
        }

        abp.multiTenancy.setTenantIdCookie();

        redirectUrl = redirectUrl || sessionStorage.getItem('redirectUrl');
        if (redirectUrl) {
            sessionStorage.removeItem('redirectUrl');
            location.href = redirectUrl;
        } else {
            let initialUrl = UrlHelper.initialUrl;

            if (initialUrl.indexOf('/account') > 0) {
                initialUrl = AppConsts.appBaseUrl;
            }

            location.href = initialUrl;
        }
    }

    private clear(): void {
        this.authenticateModel = new AuthenticateModel();
        this.authenticateModel.rememberClient = false;
        this.authenticateResult = null;
        this.resetPasswordModel = null;
        this.resetPasswordResult = null;
    }

    private initExternalLoginProviders() {
        this.externalLoginProviders$ = this._tokenAuthService
            .getExternalAuthenticationProviders()
            .pipe(
                publishReplay(),
                refCount(),
                map((providers: ExternalLoginProviderInfoModel[]) => _.map(providers, p => new ExternalLoginProvider(p))));
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

                FB.getLoginStatus(response => {
                    this.facebookLoginStatusChangeCallback(response);
                    if (response.status !== 'connected') {
                        callback();
                    }
                });
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
            const model = new ExternalAuthenticateModel();
            model.authProvider = ExternalLoginProvider.FACEBOOK;
            model.providerAccessCode = resp.authResponse.accessToken;
            model.providerKey = resp.authResponse.userID;
            model.singleSignIn = UrlHelper.getSingleSignIn();
            model.returnUrl = UrlHelper.getReturnUrl();

            this._tokenAuthService.externalAuthenticate(model)
                .subscribe((result: ExternalAuthenticateResultModel) => {
                    if (result.waitingForActivation) {
                        this._messageService.info('You have successfully registered. Waiting for activation!');
                        return;
                    }
                    this.processAuthenticateResult(result, result.returnUrl);
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

            this._tokenAuthService.externalAuthenticate(model)
                .subscribe((result: ExternalAuthenticateResultModel) => {
                    if (result.waitingForActivation) {
                        this._messageService.info('You have successfully registered. Waiting for activation!');
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
        this._logService.debug(WL.getSession());
        const model = new ExternalAuthenticateModel();
        model.authProvider = ExternalLoginProvider.MICROSOFT;
        model.providerAccessCode = WL.getSession().access_token;
        model.providerKey = WL.getSession().id; // How to get id?
        model.singleSignIn = UrlHelper.getSingleSignIn();
        model.returnUrl = UrlHelper.getReturnUrl();

        this._tokenAuthService.externalAuthenticate(model)
            .subscribe((result: ExternalAuthenticateResultModel) => {
                if (result.waitingForActivation) {
                    this._messageService.info('You have successfully registered. Waiting for activation!');
                    return;
                }

                this.login(result.accessToken, result.encryptedAccessToken, result.expireInSeconds, false, '', result.returnUrl);
            });
    }
}
