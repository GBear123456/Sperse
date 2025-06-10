/** Core imports */
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

/** Third party imports */

/** Application imports */
import { AppFeatures } from '@shared/AppFeatures';
import { HtmlHelper } from '@shared/helpers/HtmlHelper';
import { FeatureCheckerService } from 'abp-ng2-module';
import { BankCodeService } from '@app/shared/common/bank-code/bank-code.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { BANKCodeServiceProxy, GetBankCodeInput } from '@shared/service-proxies/service-proxies';
import { NotifyService } from 'abp-ng2-module';

@Component({
    selector: 'bank-code-decode',
    templateUrl: './bank-code-decode.component.html',
    styleUrls: ['./bank-code-decode.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [BANKCodeServiceProxy]
})
export class BankCodeDecodeComponent {
    @Input() content: string;
    @Input() source: string = 'Decode';
    @Output() onDecodeStart: EventEmitter<any> = new EventEmitter<any>();
    @Output() onDecodeFinish: EventEmitter<any> = new EventEmitter<any>();
    bankCodeEnabled = this.features.isEnabled(AppFeatures.CRMBANKCode);
    bankCode: string;

    constructor(
        private notify: NotifyService,
        private bankCodeServiceProxy: BANKCodeServiceProxy,
        public bankCodeService: BankCodeService,
        public features: FeatureCheckerService,
        public ls: AppLocalizationService
    ) {}

    decode(event) {
        if (this.content) {
            this.onDecodeStart.emit();
            this.bankCodeServiceProxy.getBankCode(new GetBankCodeInput({
                content: HtmlHelper.htmlToPlainText(this.content),
                source: this.source
            })).subscribe(res => {
                this.bankCode = res.value;
                this.onDecodeFinish.emit(res);
            }, error => {
                this.onDecodeFinish.emit(error);
            });
        } else
            return this.notify.warn(this.ls.l('RequiredField', this.ls.l('Message')));
    }    
}