import { Component, Injector, OnInit} from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';

@Component({
  selector: 'app-loans-form',
  templateUrl: 'register-form.component.html',
  styleUrls: ['register-form.component.less']
})

export class LoansRegFromComponent extends AppComponentBase implements OnInit {
  minimumPrice = 10000;
  maximumPrice = 80000;
  currentSliderValue = 30000;

  constructor(
    injector: Injector
  ) {
    super(injector);
  }

  ngOnInit() { }
}
