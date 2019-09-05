import { Component, Input, Injector, ChangeDetectionStrategy } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';

@Component({
  selector: 'app-creditor-contacts',
  templateUrl: './creditor-contacts.component.html',
  styleUrls: ['./creditor-contacts.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreditorContactsComponent extends AppComponentBase {
  @Input() creditReport;

  constructor(
    injector: Injector
  ) {
    super(injector);
  }

}
