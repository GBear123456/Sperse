import {Component, Injector, OnInit} from '@angular/core';
import {AppComponentBase} from '@shared/common/app-component-base';

@Component({
  selector: 'app-terms-of-service',
  templateUrl: './terms-of-service.component.html',
  styleUrls: ['./terms-of-service.component.less']
})
export class TermsOfServiceComponent extends AppComponentBase implements OnInit {

    constructor(injector: Injector) {
        super(injector);
    }

  ngOnInit() {
  }

}
