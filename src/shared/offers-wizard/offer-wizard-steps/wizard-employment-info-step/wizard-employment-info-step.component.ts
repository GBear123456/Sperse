import { Component } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { InputStatusesService } from '@shared/utils/input-statuses.service';
import { OffersWizardService } from '@shared/offers-wizard/offers-wizard.service';

@Component({
    selector: 'app-wizard-employment-info-step',
    templateUrl: './wizard-employment-info-step.component.html',
    styleUrls: ['./wizard-employment-info-step.component.less']
})
export class WizardEmploymentInfoStepComponent {
    phoneWork: string = this.offersWizardService.submitApplicationProfileInput.employmentInformation.phoneWork;
    constructor(
        public ls: AppLocalizationService,
        public inputStatusesService: InputStatusesService,
        public offersWizardService: OffersWizardService
    ) {}

    mobileChange(e) {
        this.offersWizardService.submitApplicationProfileInput.employmentInformation.phoneWork = this.offersWizardService.clearPhoneMask(e.value);
    }

}
