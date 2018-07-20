import { Component, OnInit, Injector, Input } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import { CreditReportDto, CreditScoreDtoScoreRank } from '@shared/service-proxies/service-proxies';

@Component({
  selector: 'app-credit-scores',
  templateUrl: './credit-scores.component.html',
  styleUrls: ['./credit-scores.component.less']
})
export class CreditScoresComponent extends AppComponentBase implements OnInit {

  @Input() creditReport: CreditReportDto;

  constructor(
    injector: Injector,
  ) {
    super(injector);
    this.localizationSourceName = AppConsts.localization.CreditReportLocalizationSourceName;
  }

  ngOnInit() {
  }

  getScoreColor(score: CreditScoreDtoScoreRank) : string {
      switch (score) {
          case CreditScoreDtoScoreRank.Excellent:
              return '#48dc8e';
          case CreditScoreDtoScoreRank.Good:
              return '#e8da51';
          case CreditScoreDtoScoreRank.Fair:
              return '#f5a623';
          case CreditScoreDtoScoreRank.Poor:
          default:
              return '#e0533b';
      }
  }
}
