import {Component, Injector, OnInit} from '@angular/core';

import { AppComponentBase } from '@shared/common/app-component-base';

@Component({
  selector: 'pfm-finance-page',
  templateUrl: './finance-page.component.html',
  styleUrls: ['./finance-page.component.less']
})
export class FinancePageComponent extends AppComponentBase implements OnInit {

  constructor(injector: Injector) {
      super(injector);
  }

  ngOnInit() {
  }

}
