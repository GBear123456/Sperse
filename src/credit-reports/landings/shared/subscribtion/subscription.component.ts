import { Component, Injector, OnInit} from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';

@Component({
  selector: 'app-subscribe-form',
  templateUrl: 'subscription.component.html',
  styleUrls: ['subscription.component.less']
})

export class SubscriptionComponent extends AppComponentBase implements OnInit {
  constructor(
    injector: Injector
  ) {
    super(injector);
  }

  ngOnInit() { }
}
