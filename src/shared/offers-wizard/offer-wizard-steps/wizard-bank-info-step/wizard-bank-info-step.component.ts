import { Component } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { InputStatusesService } from '@shared/utils/input-statuses.service';
import { OffersWizardService } from '@shared/offers-wizard/offers-wizard.service';

@Component({
    selector: 'app-wizard-bank-info-step',
    templateUrl: './wizard-bank-info-step.component.html',
    styleUrls: ['./wizard-bank-info-step.component.less']
})
export class WizardBankInfoStepComponent {
    bankPhone: string = this.offersWizardService.submitApplicationProfileInput.bankInformation.bankPhone;
    constructor(
        public ls: AppLocalizationService,
        public inputStatusesService: InputStatusesService,
        public offersWizardService: OffersWizardService
    ) {}

    mobileChange(e) {
        this.offersWizardService.submitApplicationProfileInput.bankInformation.bankPhone = this.offersWizardService.clearPhoneMask(e.value);
    }
}
