/**  Core imports */
import {
    Input,
    Output,
    OnInit,
    Component,
    ViewChild,
    EventEmitter
} from '@angular/core';

/** Third party imports */
import { finalize } from 'rxjs/operators';

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

@Component({
    selector: 'sperser-login-verification',
    templateUrl: './sperser-login-verification.component.html',
    animations: [accountModuleAnimation()]
})
export class SperserLoginVerificationComponent implements OnInit {
    @Input() emailAddress: string;
    @Output() onCodeRefresh: EventEmitter<any> = new EventEmitter();

    public readonly CODE_TIME_LIVE = 5 * 60 * 1000;
    showResetButton: boolean = false;
    accessCodeMaxTriesCount = 3;
    countDownInterval: any;
    countDownTime = 0;

    constructor (
        private authProxy: TokenAuthServiceProxy,
        private loginService: LoginService,
        public ls: AppLocalizationService
    ) {}

    ngOnInit() {
        this.initCountDownTimer();
    }

    initCountDownTimer() {
        this.countDownInterval = setInterval(() => {
            this.countDownTime += 1000;
            if (this.countDownTime >= this.CODE_TIME_LIVE)
                clearInterval(this.countDownInterval);
        }, 1000);
    }

    getCode(): string {
        let value = ''; 
        for (let i = 0; i < 6; i++)
            value += window['code' + i].value.trim();
        return value;
    }    

    onKeyup(event, index) {
        if (event.key.length == 1 && event.target.value || event.key == 'Backspace') {
            let codeValue = this.getCode();
            this.showResetButton = !!codeValue;
            let input = window['code' + (index + (event.target.value ? 1 : -1))];
            if (input)
                input.focus();
            if (codeValue.length == 6)
                this.authenticateByCode(codeValue);
        }
    }

    resetCode(value: string) {
        this.accessCodeMaxTriesCount = 3;
        this.showResetButton = false;
        window['codeForm'].reset();
    }

    authenticateByCode(accessCode: string) {
        abp.ui.setBusy();
        this.authProxy.authenticateByCode(new AuthenticateByCodeModel({
            emailAddress: this.emailAddress,
            code: accessCode
        })).pipe(
            finalize(() => abp.ui.clearBusy())
        ).subscribe((res: AuthenticateResultModel) => {
            this.loginService.processAuthenticateResult(
                res, AppConsts.appBaseUrl);
        }, () => {
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

    pasteCodeValue(event) {
        let paste = event.clipboardData.getData('text');
        paste.replace(/\D/img, '').split('').forEach((val, index) => {
            let elm = window['code' + index];
            if (elm)
                elm.value = val;
        });
        event.preventDefault();
    }

    requestNewCode() {
        this.onCodeRefresh.emit();
        setTimeout(() => {
            this.countDownTime = 0;
            this.initCountDownTimer();
        }, 1000);
    }
}