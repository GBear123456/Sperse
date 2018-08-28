import { Component, OnInit, Injector } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';

@Component({
  selector: 'app-credit-report-form',
  templateUrl: 'register-form.component.html',
  styleUrls: ['register-form.component.less']
})

export class CreditReportRegFromComponent extends AppComponentBase implements OnInit {
  imgList = [
    {img: 'daily-reports-icon.svg', text: 'CreditMonitorAlerts'},
    {img: 'interactive-tools-icon.svg', text: 'EducationalResources'},
    {img: 'TUmonitoring-icon.svg', text: 'TransUnionMonitoring'}
  ];
  constructor(
    injector: Injector
  ) {
    super(injector);
  }

  ngOnInit() {
  }
}
