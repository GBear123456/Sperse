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
    styleUrls: ['./wizard-home-info-step.component.less'],
    providers: [MaskPipe]
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

    onInput(e) {
        const inputElement = e.event.target;
        if (inputElement.value.length > this.maxLength)
            inputElement.value = inputElement.value.slice(0, this.maxLength);
        inputElement.value = this.maskPipe.transform(inputElement.value, AppConsts.masks.zipCodeLong);
    }

    postalCodeChange(e) {
        this.offersWizardService.submitApplicationProfileInput.personalInformation.postalCode = e.value.replace('-', '');
    }

}
