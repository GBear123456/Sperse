/** Core imports */
import { Component } from '@angular/core';

/** Third party imports */
import { MaskPipe } from 'ngx-mask';

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { InputStatusesService } from '@shared/utils/input-statuses.service';
import { OffersWizardService } from '@shared/offers-wizard/offers-wizard.service';
import { AppConsts } from '@shared/AppConsts';

@Component({
    selector: 'app-wizard-home-info-step',
    templateUrl: './wizard-home-info-step.component.html',
    styleUrls: ['./wizard-home-info-step.component.less']
})
export class WizardHomeInfoStepComponent {
    zipRegex = AppConsts.regexPatterns.zipUsPattern;
    maxLength = 10;
    postalCode = this.maskPipe.transform(
        this.offersWizardService.submitApplicationProfileInput.personalInformation.postalCode,
        AppConsts.masks.zipCodeLong
    );
    constructor(
        public ls: AppLocalizationService,
        public inputStatusesService: InputStatusesService,
        public offersWizardService: OffersWizardService,
        private maskPipe: MaskPipe
    ) {}

    onPostalCodeInput(e) {
        e.event.target.value = this.offersWizardService.transformPostalCode(e.event.target);
    }

    postalCodeChange(e) {
        this.offersWizardService.submitApplicationProfileInput.personalInformation.postalCode = e.value.replace('-', '');
    }

}
