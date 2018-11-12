import { Component, OnInit, Input, Injector } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';

@Component({
  selector: 'app-consumer-statements',
  templateUrl: './consumer-statements.component.html',
  styleUrls: ['./consumer-statements.component.less']
})
export class ConsumerStatementsComponent extends AppComponentBase implements OnInit {
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
