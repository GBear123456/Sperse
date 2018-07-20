import { Component, OnInit, Injector } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import { KbaInputModel } from './kba.model';

import * as _ from 'underscore';

import { KBAServiceProxy } from '@shared/service-proxies/service-proxies';

@Component({
  selector: 'app-kba-result',
  templateUrl: './kba-result.component.html',
  providers: [ KBAServiceProxy ],
  styleUrls: ['./kba-result.component.less']
})
export class KbaResultComponent extends AppComponentBase implements OnInit {
  model:  KbaInputModel = new KbaInputModel();
  params: any = {};
  showingError: string;

  constructor(
    injector: Injector,
    private _KBAService: KBAServiceProxy
  ) {
    super (injector);
    this.localizationSourceName = AppConsts.localization.CreditReportLocalizationSourceName;
    this.parseParams ();
    this.showingError = decodeURIComponent(this.params.err).replace(/[+]/g, ' ');
  }

  ngOnInit() {
    this.save();
    if (this.model.passed) {
      setTimeout(() => {
        window.parent.location.reload();
      }, 5000);
    };
  }

  parseParams () {
    this.params = _.object(
      _.compact(
        _.map(location.search.slice(1).split('&'),
          function(item) {
            if (item) {
              return item.split('=');
            }
          }
        )
      )
    );
  }

  save(): void {
    this.model.memberId = this.params['MemberId'];
    this.model.err = this.params['err'];
    this.model.passed = (this.params['result'] == '1');
    this._KBAService.processKBAResponse(this.model)
      .subscribe(() => {});
  }
}
