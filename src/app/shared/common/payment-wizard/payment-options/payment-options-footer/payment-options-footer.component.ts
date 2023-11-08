import { ChangeDetectionStrategy, Component, Input, Output, EventEmitter } from '@angular/core';
import { ConditionsType } from '@shared/AppEnums';
import { ConditionsModalService } from '@shared/common/conditions-modal/conditions-modal.service';
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


    conditions = ConditionsType;

    constructor(
        public conditionsModalService: ConditionsModalService,
        public ls: AppLocalizationService
    ) {}

    openTermsModal() {
        this.conditionsModalService.openModal({
            panelClass: ['slider'],
            data: { type: ConditionsType.Terms }
        });
    }
}
