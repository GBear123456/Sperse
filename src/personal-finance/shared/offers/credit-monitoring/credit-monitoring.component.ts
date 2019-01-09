import { Component, OnInit } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
  selector: 'credit-monitoring',
  templateUrl: './credit-monitoring.component.html',
  styleUrls: ['./credit-monitoring.component.less']
})
export class CreditMonitoringComponent implements OnInit {

  constructor(public ls: AppLocalizationService) { }

  ngOnInit() {
  }

}
