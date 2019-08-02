import { Component, OnInit } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { InputStatusesService } from '@shared/utils/input-statuses.service';
import { OffersWizardService } from '@shared/offers-wizard/offers-wizard.service';

@Component({
  selector: 'app-wizard-employment-payment-step',
  templateUrl: './wizard-employment-payment-step.component.html',
  styleUrls: ['./wizard-employment-payment-step.component.less']
})
export class WizardEmploymentPaymentStepComponent implements OnInit {

  constructor(
      public ls: AppLocalizationService,
      public inputStatusesService: InputStatusesService,
      public offersWizardService: OffersWizardService
  ) { }

  ngOnInit() {
  }

}
