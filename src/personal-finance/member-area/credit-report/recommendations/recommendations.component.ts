import { Component, OnInit, Input, Injector } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppConsts } from '@shared/AppConsts';

@Component({
  selector: 'app-recommendations',
  templateUrl: './recommendations.component.html',
  styleUrls: ['./recommendations.component.less']
})
export class RecommendationsComponent extends AppComponentBase implements OnInit {
  @Input() creditReport;

  constructor(
    injector: Injector
  ) {
    super(injector);
    this.localizationSourceName = AppConsts.localization.CreditReportLocalizationSourceName;
  }

  ngOnInit() {
  }

}
