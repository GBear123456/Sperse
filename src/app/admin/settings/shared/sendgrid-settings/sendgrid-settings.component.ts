/** Core imports */
import { Component, ChangeDetectionStrategy, Injector } from '@angular/core';

/** Third party imports */
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

/** Application imports */
import {
  SendGridSettingsDto,
  TenantSettingsServiceProxy,
} from '@shared/service-proxies/service-proxies';
import { SettingsComponentBase } from './../settings-base.component';
import { AppConsts } from '@shared/AppConsts';

@Component({
  selector: 'sendgrid-settings',
  templateUrl: './sendgrid-settings.component.html',
  styleUrls: ['./sendgrid-settings.component.less', '../settings-base.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [TenantSettingsServiceProxy],
})
export class SendgridSettingsComponent extends SettingsComponentBase {
  sendGridSettings: SendGridSettingsDto = new SendGridSettingsDto();

  constructor(_injector: Injector, private tenantSettingsService: TenantSettingsServiceProxy) {
    super(_injector);
  }

  ngOnInit(): void {
    this.startLoading();
    this.tenantSettingsService
      .getSendGridSettings()
      .pipe(finalize(() => this.finishLoading()))
      .subscribe(res => {
        this.sendGridSettings = res;
        this.changeDetection.detectChanges();
      });
  }

  getSendGridWebhookUrl(): string {
    let key = this.sendGridSettings.webhookKey || '{webhook_key}';
    return AppConsts.remoteServiceBaseUrl + `/api/SendGrid/ProcessWebHook?key=${key}`;
  }

  getSaveObs(): Observable<any> {
    return this.tenantSettingsService.updateSendGridSettings(this.sendGridSettings);
  }
}
