import { Component } from '@angular/core';
import { OffersWizardService } from '@shared/offers-wizard/offers-wizard.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { InputStatusesService } from '@shared/utils/input-statuses.service';

@Component({
    selector: 'app-wizard-personal-info-step',
    templateUrl: './wizard-personal-info-step.component.html',
    styleUrls: ['./wizard-personal-info-step.component.less']
})
export class WizardPersonalInfoStepComponent {

    constructor(
        public ls: AppLocalizationService,
        public inputStatusesService: InputStatusesService,
        public offersWizardService: OffersWizardService
    ) {}
}
