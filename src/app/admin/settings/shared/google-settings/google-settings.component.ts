/** Core imports */
import { Component, ChangeDetectionStrategy, Injector } from '@angular/core';

/** Third party imports */
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

/** Application imports */
import {
  GoogleExternalLoginProviderSettingsDto,
  TenantSettingsServiceProxy,
} from '@shared/service-proxies/service-proxies';
import { SettingsComponentBase } from './../settings-base.component';

@Component({
  selector: 'google-settings',
  templateUrl: './google-settings.component.html',
  styleUrls: ['./google-settings.component.less', '../settings-base.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [TenantSettingsServiceProxy],
})
export class GoogleSettingsComponent extends SettingsComponentBase {
  googleSettings: GoogleExternalLoginProviderSettingsDto;

  constructor(_injector: Injector, private tenantSettingsService: TenantSettingsServiceProxy) {
    super(_injector);
  }

  ngOnInit(): void {
    this.startLoading();
    this.tenantSettingsService
      .getGoogleSettings()
      .pipe(finalize(() => this.finishLoading()))
      .subscribe(res => {
        this.googleSettings = res;
        this.changeDetection.detectChanges();
      });
  }

  isValid(): boolean {
    let isClientIdSet = !!this.googleSettings.settings.clientId;
    let isClientSecret = !!this.googleSettings.settings.clientSecret;

    let isValid = (!isClientIdSet && !isClientSecret) || (isClientIdSet && isClientSecret);

    if (!isValid) {
      let fieldName = isClientIdSet ? 'ClientSecret' : 'ClientId';
      this.notify.error(this.l('RequiredField', this.l(fieldName)));
    }

    return isValid;
  }

  getSaveObs(): Observable<any> {
    return this.tenantSettingsService.updateGoogleSettings(this.googleSettings);
  }
}
