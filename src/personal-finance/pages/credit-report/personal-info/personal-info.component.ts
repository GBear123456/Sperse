import { Component, Input, Injector } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';

@Component({
  selector: 'app-personal-info',
  templateUrl: './personal-info.component.html',
  styleUrls: ['./personal-info.component.less']
})
export class PersonalInfoComponent extends AppComponentBase {
    @Input() creditReport;

    constructor(
      injector: Injector
    ) {
      super(injector);
    }
}
