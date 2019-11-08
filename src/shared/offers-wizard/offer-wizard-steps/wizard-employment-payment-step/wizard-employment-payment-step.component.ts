import { Component } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { InputStatusesService } from '@shared/utils/input-statuses.service';
import { OffersWizardService } from '@shared/offers-wizard/offers-wizard.service';
import * as moment from 'moment';

@Component({
    selector: 'app-wizard-employment-payment-step',
    templateUrl: './wizard-employment-payment-step.component.html',
    styleUrls: ['./wizard-employment-payment-step.component.less']
})
export class WizardEmploymentPaymentStepComponent {
    minDate = moment().add(1, 'day').toDate();
    constructor(
        public ls: AppLocalizationService,
        public inputStatusesService: InputStatusesService,
        public offersWizardService: OffersWizardService
    ) {}

    get payAfterNextDateMinDate() {
        const payNextDate = this.offersWizardService.submitApplicationProfileInput.employmentInformation.payNextDate;
        return payNextDate
               ? (payNextDate instanceof moment
                  ? payNextDate.add(1, 'day')
                  : new Date(payNextDate).setDate(payNextDate.getDate() + 1)
               )
               : this.minDate;
    }
}
