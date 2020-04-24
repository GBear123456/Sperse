/** Core imports */
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

/** Third party imports */

/** Application imports */
import { ExternalServiceProxy, GetBankCodeInput, Dimensions } from '@shared/service-proxies/service-proxies';
import { BankCodeLetter } from '@app/shared/common/bank-code-letters/bank-code-letter.enum';
import { BankCodeService } from '@app/shared/common/bank-code/bank-code.service';
import { NotifyService } from '@abp/notify/notify.service';

@Component({
    selector: 'bank-code-decode',
    templateUrl: './bank-code-decode.component.html',
    styleUrls: ['./bank-code-decode.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [ExternalServiceProxy]
})
export class BankCodeDecodeComponent {
    @Input() content: string;
    @Output() onDecodeStart: EventEmitter<any> = new EventEmitter<any>();
    @Output() onDecodeFinish: EventEmitter<any> = new EventEmitter<any>();
    bankCode: string;

    constructor(
        private notify: NotifyService,
        private externalProxy: ExternalServiceProxy,
        public bankCodeService: BankCodeService
    ) {}

    decode(event) {
        if (this.content) {
            this.onDecodeStart.emit();
            this.externalProxy.getBankCode(new GetBankCodeInput({
                content: this.content.replace(/\<(\/)?(\w)*(\d)?\>/gim, '')
            })).subscribe(res => {
                this.bankCode = this.bankCodeService.getBankCodeByDimensions(res);
                this.onDecodeFinish.emit(res);
            }, error => {
                this.onDecodeFinish.emit(error);
            });
        } else
            return this.notify.warn('Content should be defined');
    }
}