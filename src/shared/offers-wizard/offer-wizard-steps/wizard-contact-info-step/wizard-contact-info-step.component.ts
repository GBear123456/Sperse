import { Component } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { InputStatusesService } from '@shared/utils/input-statuses.service';
import { OffersWizardService } from '@shared/offers-wizard/offers-wizard.service';

@Component({
    selector: 'app-wizard-contact-info-step',
    templateUrl: './wizard-contact-info-step.component.html',
    styleUrls: ['./wizard-contact-info-step.component.less']
})
export class WizardContactInfoStepComponent {
    phone: string = this.offersWizardService.submitApplicationProfileInput.personalInformation.phone;
    phoneMobile: string = this.offersWizardService.submitApplicationProfileInput.personalInformation.phoneMobile;

    constructor(
        public ls: AppLocalizationService,
        public inputStatusesService: InputStatusesService,
        public offersWizardService: OffersWizardService
    ) {}

    mobileChange(e, propertyName: string) {
        this.offersWizardService.submitApplicationProfileInput.personalInformation[propertyName] = this.offersWizardService.clearPhoneMask(e.value);
    }

}
