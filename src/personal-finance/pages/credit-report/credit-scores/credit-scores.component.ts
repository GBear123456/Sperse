import { Component, OnInit, Injector, Input } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import { CreditReportDto, CreditScoreRank } from '@shared/service-proxies/service-proxies';

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
  }

  ngOnInit() {
  }

    getScoreColor(score: CreditScoreRank) : string {
      switch (score) {
          case CreditScoreRank.Excellent:
              return '#48dc8e';
          case CreditScoreRank.Good:
              return '#e8da51';
          case CreditScoreRank.Fair:
              return '#f5a623';
          case CreditScoreRank.Poor:
          default:
              return '#e0533b';
      }
  }
}
