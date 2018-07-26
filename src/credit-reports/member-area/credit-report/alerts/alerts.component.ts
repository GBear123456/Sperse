import { Component, OnInit, Input, Injector } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppConsts } from '@shared/AppConsts';
import { CreditReportServiceProxy, AlertDto } from '@shared/service-proxies/service-proxies';

@Component({
  selector: 'app-alerts',
  templateUrl: './alerts.component.html',
  styleUrls: ['./alerts.component.less']
})
export class AlertsComponent extends AppComponentBase implements OnInit {
  @Input() creditReport;
  alerts: AlertDto[] = [];

  constructor(
    injector: Injector,
    private _loadAlertsService: CreditReportServiceProxy
  ) {
    super(injector);
    this.localizationSourceName = AppConsts.localization.CreditReportLocalizationSourceName;
  }

  ngOnInit() {
  }

  loadAlerts(): void {
    this._loadAlertsService
      .loadAlerts()
      .subscribe(result => {
        this.alerts = result;
      });
  }

  showMoreAlerts () {
    this.loadAlerts();
  }

}
