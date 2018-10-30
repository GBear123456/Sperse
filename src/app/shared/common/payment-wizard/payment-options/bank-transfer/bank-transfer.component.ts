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
import { BankTransferSettings } from '@shared/service-proxies/service-proxies';

@Component({
    selector: 'bank-transfer',
    templateUrl: './bank-transfer.component.html',
    styleUrls: ['./bank-transfer.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BankTransferComponent extends AppComponentBase implements OnChanges {
    @Input() titleText = this.l('BankTransferTitleText');
    @Input() bankTransferSettings: BankTransferSettings;
    @Output() onSubmit: EventEmitter<null> = new EventEmitter<null>();
    @ViewChild('bankTransferSettingsContainer') bankTransferSettingsContainer: ElementRef;

    constructor(
        injector: Injector
    ) {
        super(injector);
    }

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
