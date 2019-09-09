import { Component, Input, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CreditReportServiceProxy, AlertDto } from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'app-alerts',
    templateUrl: './alerts.component.html',
    styleUrls: ['./alerts.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AlertsComponent {
    @Input() creditReport;
    alerts: AlertDto[] = [];

    constructor(
        private _loadAlertsService: CreditReportServiceProxy,
        private _changeDetectorRef: ChangeDetectorRef,
        public ls: AppLocalizationService
    ) {
    }

    loadAlerts(): void {
        this._loadAlertsService
            .loadAlerts()
            .subscribe(result => {
                this.alerts = result;
                this._changeDetectorRef.detectChanges();
            });
    }

    showMoreAlerts() {
        this.loadAlerts();
    }
}
