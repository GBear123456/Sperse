import { Component, OnInit, Injector } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';

@Component({
  selector: 'app-root',
  templateUrl: './loans.component.html',
  styleUrls: ['loans.component.less']
})
export class LoanComponent extends AppComponentBase implements OnInit {
  constructor(
    injector: Injector
  ) {
    super(injector);
  }

  ngOnInit() {
  }
}





