import { Component, OnInit, Input, Injector } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppConsts } from '@shared/AppConsts';

@Component({
  selector: 'app-score-factors',
  templateUrl: './score-factors.component.html',
  styleUrls: ['./score-factors.component.less']
})
export class ScoreFactorsComponent extends AppComponentBase implements OnInit {
  @Input() creditReport;

  constructor(
    injector: Injector
  ) {
    super(injector);
    this.localizationSourceName = AppConsts.localization.PFMLocalizationSourceName;
  }

  ngOnInit() {
  }

}
