import { ChangeDetectionStrategy, Component, Input, Output, EventEmitter } from '@angular/core';
import { ConditionsType } from '@shared/AppEnums';
import { ConditionsModalComponent } from '@shared/common/conditions-modal/conditions-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'payment-options-footer',
    styleUrls: [ './payment-options-footer.component.less' ],
    templateUrl: './payment-options-footer.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentOptionsFooterComponent {
    @Input() submitButtonText: string;
    @Input() submitButtonDisabled = false;
    @Output() onSubmit: EventEmitter<null> = new EventEmitter();

    constructor(
        private dialog: MatDialog,
        public ls: AppLocalizationService
    ) {}

    openTermsModal() {
        this.dialog.open(ConditionsModalComponent, { panelClass: 'slider', data: { type: ConditionsType.Terms } });
    }
}
