import { Component, OnInit, Injector } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';

@Component({
  selector: 'app-top-bar',
  templateUrl: 'top-bar.component.html',
  styleUrls: ['top-bar.component.less']
})

export class TopBarComponent extends AppComponentBase implements OnInit {
  menuItems = [];

  constructor(
    injector: Injector
  ) {
      super(injector);
      this.addMenuItem({ url: '/credit-reports/loans', title: 'loans', img: '/assets/landing/loans-icon.svg', imgActive: '/assets/landing/loans-active-icon.svg' });
      this.addMenuItem({ url: '/credit-reports/credit-cards', title: 'credit-cards', img: '/assets/landing/credit-card-icon.svg', imgActive: '/assets/landing/credit-cards-active-icon.svg' });

      var crUrl = abp.session.userId ? 'credit-reports/member-area' : '/credit-reports';
      this.addMenuItem({ url: crUrl, title: 'credit-reports', img: '/assets/landing/credit-report-icon.svg', imgActive: '/assets/landing/credit-reports-active-icon.svg' },
                              'CreditReportFeature');
  }

  addMenuItem(item, feature = null): void {
      if (feature && !abp.features.isEnabled(feature)) return;
      this.menuItems.push(item);
  }

  ngOnInit() { }
}
