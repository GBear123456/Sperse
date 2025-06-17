/** Core imports */
import { Component, ChangeDetectionStrategy, Injector } from '@angular/core';

/** Third party imports */
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

/** Application imports */
import {
  FacebookExternalLoginProviderSettingsDto,
  TenantSettingsServiceProxy,
} from '@shared/service-proxies/service-proxies';
import { SettingsComponentBase } from './../settings-base.component';

@Component({
  selector: 'facebook-settings',
  templateUrl: './facebook-settings.component.html',
  styleUrls: ['./facebook-settings.component.less', '../settings-base.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [TenantSettingsServiceProxy],
})
export class FacebookSettingsComponent extends SettingsComponentBase {
  facebookSettings: FacebookExternalLoginProviderSettingsDto;

  constructor(_injector: Injector, private tenantSettingsService: TenantSettingsServiceProxy) {
    super(_injector);
  }

  ngOnInit(): void {
    this.startLoading();
    this.tenantSettingsService
      .getFacebookSettings()
      .pipe(finalize(() => this.finishLoading()))
      .subscribe(res => {
        this.facebookSettings = res;
        this.changeDetection.detectChanges();
      });
  }

  isValid(): boolean {
    let isAppIdSet = !!this.facebookSettings.settings.appId;
    let isAppSecret = !!this.facebookSettings.settings.appSecret;

    let isValid = (!isAppIdSet && !isAppSecret) || (isAppIdSet && isAppSecret);

    if (!isValid) {
      let fieldName = isAppIdSet ? 'AppSecret' : 'AppId';
      this.notify.error(this.l('RequiredField', this.l(fieldName)));
    }

    return isValid;
  }

  getSaveObs(): Observable<any> {
    return this.tenantSettingsService.updateFacebookSettings(this.facebookSettings);
  }
}
