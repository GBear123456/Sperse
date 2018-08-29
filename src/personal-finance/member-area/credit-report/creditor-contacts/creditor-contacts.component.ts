import { Component, OnInit, Input, Injector } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppConsts } from '@shared/AppConsts';

@Component({
  selector: 'app-creditor-contacts',
  templateUrl: './creditor-contacts.component.html',
  styleUrls: ['./creditor-contacts.component.less']
})
export class CreditorContactsComponent extends AppComponentBase implements OnInit {
  @Input() creditReport;

  constructor(
    injector: Injector
  ) {
    super(injector);
    this.localizationSourceName = AppConsts.localization.CreditReportLocalizationSourceName;
  }

  ngOnInit() {
  }

}
