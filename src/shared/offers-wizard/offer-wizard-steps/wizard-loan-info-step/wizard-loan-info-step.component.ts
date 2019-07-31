import { Component, OnInit } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { InputStatusesService } from '@shared/utils/input-statuses.service';
import { OffersWizardService } from '@shared/offers-wizard/offers-wizard.service';

@Component({
  selector: 'app-wizard-loan-info-step',
  templateUrl: './wizard-loan-info-step.component.html',
  styleUrls: ['./wizard-loan-info-step.component.less']
})
export class WizardLoanInfoStepComponent implements OnInit {

  constructor(
      public ls: AppLocalizationService,
      public inputStatusesService: InputStatusesService,
      public offersWizardService: OffersWizardService
  ) { }

  ngOnInit() {
  }

}
