import {Component, Injector, OnInit} from '@angular/core';
import {AppComponentBase} from '@shared/common/app-component-base';

@Component({
  selector: 'app-privacy-policy',
  templateUrl: './privacy-policy.component.html',
  styleUrls: ['./privacy-policy.component.less']
})
export class PrivacyPolicyComponent extends AppComponentBase implements OnInit {

    constructor(injector: Injector) {
        super(injector);
    }

  ngOnInit() {
  }

}
