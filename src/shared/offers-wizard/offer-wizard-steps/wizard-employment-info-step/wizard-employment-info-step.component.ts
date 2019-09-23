import { Component } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { InputStatusesService } from '@shared/utils/input-statuses.service';
import { OffersWizardService } from '@shared/offers-wizard/offers-wizard.service';
import { AppConsts } from '@shared/AppConsts';
import { MaskPipe } from 'ngx-mask';

@Component({
    selector: 'app-wizard-employment-info-step',
    templateUrl: './wizard-employment-info-step.component.html',
    styleUrls: ['./wizard-employment-info-step.component.less']
})
export class WizardEmploymentInfoStepComponent {
    employerPostalCode = this.maskPipe.transform(
        this.offersWizardService.submitApplicationProfileInput.employmentInformation.employerPostalCode,
        AppConsts.masks.zipCodeLong
    );
    phoneWork: string = this.offersWizardService.submitApplicationProfileInput.employmentInformation.phoneWork;
    constructor(
        public ls: AppLocalizationService,
        public inputStatusesService: InputStatusesService,
        public offersWizardService: OffersWizardService,
        private maskPipe: MaskPipe
    ) {}

    mobileChange(e) {
        this.offersWizardService.submitApplicationProfileInput.employmentInformation.phoneWork = this.offersWizardService.clearPhoneMask(e.value);
    }

    onPostalCodeInput(e) {
        e.event.target.value = this.offersWizardService.transformPostalCode(e.event.target);
    }

    postalCodeChange(e) {
        this.offersWizardService.submitApplicationProfileInput.employmentInformation.employerPostalCode = e.value.replace('-', '');
    }

}
