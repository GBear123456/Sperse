import {
    ChangeDetectionStrategy,
    Component,
    ElementRef, EventEmitter,
    Injector,
    Input,
    OnChanges,
    Output,
    SimpleChanges,
    ViewChild
} from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { BankTransferSettingsDto } from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '../../../localization/app-localization.service';
import { AdAutoLoginHostDirective } from '../../../../../../account/auto-login/auto-login.component';

@Component({
    selector: 'bank-transfer',
    templateUrl: './bank-transfer.component.html',
    styleUrls: ['./bank-transfer.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BankTransferComponent implements OnChanges {
    @Input() titleText = this.ls.l('BankTransferTitleText');
    @Input() bankTransferSettings: BankTransferSettingsDto;
    @Output() onSubmit: EventEmitter<null> = new EventEmitter<null>();
    @ViewChild('bankTransferSettingsContainer', { static: true }) bankTransferSettingsContainer: ElementRef;

    requireInstructionEnabled = false;

    constructor(
        public ls: AppLocalizationService
    ) {}

    ngOnChanges(changes: SimpleChanges) {
        if (changes.bankTransferSettings) {
            /** Show spinner while data loading */
            changes.bankTransferSettings.firstChange ?
                abp.ui.setBusy(this.bankTransferSettingsContainer.nativeElement) :
                abp.ui.clearBusy(this.bankTransferSettingsContainer.nativeElement);
        }
    }

    submit() {
        this.onSubmit.next();
    }

}
