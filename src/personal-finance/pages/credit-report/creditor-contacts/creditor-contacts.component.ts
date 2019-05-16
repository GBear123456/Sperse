import { Component, Input, Injector } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';

@Component({
  selector: 'app-creditor-contacts',
  templateUrl: './creditor-contacts.component.html',
  styleUrls: ['./creditor-contacts.component.less']
})
export class CreditorContactsComponent extends AppComponentBase {
  @Input() creditReport;

  constructor(
    injector: Injector
  ) {
    super(injector);
  }

}
