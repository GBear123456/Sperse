/** Core imports */
import { Component, OnInit } from '@angular/core';

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
export class WizardHomeInfoStepComponent implements OnInit {
    zipRegex = AppConsts.regexPatterns.zipUsPattern;

    constructor(
        public ls: AppLocalizationService,
        public inputStatusesService: InputStatusesService,
        public offersWizardService: OffersWizardService,
        private maskPipe: MaskPipe
    ) {}

    ngOnInit() {}

    onInput(e, maxLength: number, mask?: string) {
        const inputElement = e.event.target;
        if (inputElement.value.length > maxLength)
            inputElement.value = inputElement.value.slice(0, maxLength);
        if (mask)
            inputElement.value = this.maskPipe.transform(inputElement.value, mask);
    }

}
