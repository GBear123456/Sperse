import { Component, Injector, OnInit} from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';

@Component({
  selector: 'app-how-it-work',
  templateUrl: './how-it-work.component.html',
  styleUrls: ['./how-it-work.component.less']
})
export class HowItWorkComponent extends AppComponentBase implements OnInit {

  constructor(
    injector: Injector
  ) {
    super(injector);
  }

  ngOnInit() {
  }

}
