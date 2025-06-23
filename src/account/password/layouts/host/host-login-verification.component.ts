/**  Core imports */
import {
    Input,
    Output,
    ViewChild,
    OnInit,
    AfterViewInit,
    Component,
    EventEmitter
} from '@angular/core';

/** Third party imports */
import { finalize, first } from 'rxjs/operators';
import { CodeInputComponent } from 'angular-code-input';

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import {
    TokenAuthServiceProxy,
    AuthenticateByCodeModel,
    AuthenticateResultModel
} from '@shared/service-proxies/service-proxies';
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { LoginService } from 'account/login/login.service';
import { AppConsts } from '@shared/AppConsts';
import { ActivatedRoute, Params } from '@angular/router';
import { AppSessionService } from '@shared/common/session/app-session.service';

@Component({
    selector: 'host-login-verification',
    templateUrl: './host-login-verification.component.html',
    styleUrls: ['./host-login-verification.component.less'],
    animations: [accountModuleAnimation()]
})
export class HostLoginVerificationComponent implements OnInit, AfterViewInit {
    @Input() emailAddress: string;
    @Output() onCodeRefresh: EventEmitter<any> = new EventEmitter();
    @ViewChild('codeInput', { read: CodeInputComponent, static: false }) codeInput !: CodeInputComponent;

    appBaseUrl = AppConsts.appBaseUrl;
    isLoggedIn: boolean = false;
    isExtLogin: boolean = false;
    public readonly CODE_TIME_LIVE = 5 * 60 * 1000;
    showResetButton: boolean = false;
    accessCodeMaxTriesCount = 3;
    countDownInterval: any;
    countDownTime = 0;

    constructor(
        private authProxy: TokenAuthServiceProxy,
        private activatedRoute: ActivatedRoute,
        private loginService: LoginService,
        private appSession: AppSessionService,
        public ls: AppLocalizationService
    ) {
        this.activatedRoute.queryParams.pipe(first())
            .subscribe((params: Params) => {
                this.isExtLogin = params.extlogin == 'true';
                this.isLoggedIn = !!this.appSession.user;

                if (this.isExtLogin && this.isLoggedIn) {
                    this.loginService.completeSourceEvent();
                }
            });
    }

    ngOnInit(): void {
        this.initCountDownTimer();
    }

    ngAfterViewInit(): void {
        const onPaste_inherit = this.codeInput.onPaste;
        this.codeInput.onPaste = (e: ClipboardEvent, i: number) => {
            e.preventDefault();
            e.stopPropagation();

            const value = e.clipboardData.getData('text').replace(/\D/img, '').trim();
            if (value != e.clipboardData.getData('text')) {
                navigator.clipboard.writeText(value);
                setTimeout(() => {
                    onPaste_inherit.call(this.codeInput, {
                        stopPropagation: () => e.preventDefault(),
                        preventDefault: () => e.stopPropagation(),
                        clipboardData: { getData: () => value }
                    }, i);
                });
            } else {
                onPaste_inherit.call(this.codeInput, e, i);
            }
        };
    }

    initCountDownTimer(): void {
        this.countDownInterval = setInterval(() => {
            this.countDownTime += 1000;
            if (this.countDownTime >= this.CODE_TIME_LIVE)
                clearInterval(this.countDownInterval);
        }, 1000);
    }

    resetCode() {
        this.accessCodeMaxTriesCount = 3;
        this.showResetButton = false;
        this.codeInput.reset();
    }

    authenticateByCode(accessCode: string) {
        abp.ui.setBusy();
        this.authProxy.authenticateByCode(new AuthenticateByCodeModel({
            emailAddress: this.emailAddress,
            code: accessCode
        })).pipe(
            finalize(() => abp.ui.clearBusy())
        ).subscribe((res: AuthenticateResultModel) => {
            this.isLoggedIn = this.isExtLogin;
            if (this.isExtLogin) {
                if (!res.shouldResetPassword)
                    this.loginService.completeSourceEvent();
            }
            this.loginService.processAuthenticateResult(
                res, this.appBaseUrl, this.isExtLogin);
        }, () => {
            this.codeInput.reset();
            this.checkAccessCodeMaxTries();
        });
    }

    checkAccessCodeMaxTries() {
        this.accessCodeMaxTriesCount--;
        if (this.accessCodeMaxTriesCount > 0)
            abp.message.error(this.ls.l('AutoLoginCodeIsIncorrect'));
        else
            abp.message.error(this.ls.l('LoginFailed'));
    }

    requestNewCode() {
        this.onCodeRefresh.emit();
        this.codeInput.reset();
        setTimeout(() => {
            this.countDownTime = 0;
            this.initCountDownTimer();
        }, 1000);
    }

    onCodeCompleted(code: string) {
        this.authenticateByCode(code);
    }
}