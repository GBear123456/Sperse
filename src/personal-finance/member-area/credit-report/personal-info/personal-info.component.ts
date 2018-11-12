import { Component, OnInit, Input, Injector } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppConsts } from '@shared/AppConsts';

@Component({
  selector: 'app-personal-info',
  templateUrl: './personal-info.component.html',
  styleUrls: ['./personal-info.component.less']
})
export class PersonalInfoComponent extends AppComponentBase implements OnInit {
    @Input() creditReport;

    constructor(
      injector: Injector
    ) {
      super(injector);
      this.localizationSourceName = AppConsts.localization.PFMLocalizationSourceName;
    }

    ngOnInit() {
    }

}
