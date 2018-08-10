import { Component, Injector, OnInit} from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';

@Component({
  selector: 'app-credit-cards-form',
  templateUrl: 'register-form.component.html',
  styleUrls: ['register-form.component.less']
})

export class CreditCardRegFromComponent extends AppComponentBase implements OnInit {
  constructor(
    injector: Injector
  ) {
    super(injector);
  }

  ngOnInit() { }
}
