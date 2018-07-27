import { Component, Injector, Input } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';

@Component({
  selector: 'contact-info-panel',
  templateUrl: './contact-info-panel.component.html',
  styleUrls: ['./contact-info-panel.component.less']
})
export class ContactInfoPanelComponent extends AppComponentBase {
  @Input() data: any;

  constructor(
    injector: Injector
  ) {
    super(injector);
  }
}
