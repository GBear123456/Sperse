/** Core imports */
import { Component, ChangeDetectionStrategy, Injector } from '@angular/core';

/** Third party imports */
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

/** Application imports */
import {
  LinkedInExternalLoginProviderSettingsDto,
  TenantSettingsServiceProxy,
} from '@shared/service-proxies/service-proxies';
import { SettingsComponentBase } from './../settings-base.component';

@Component({
  selector: 'linkedin-settings',
  templateUrl: './linkedin-settings.component.html',
  styleUrls: ['./linkedin-settings.component.less', '../settings-base.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [TenantSettingsServiceProxy],
})
export class LinkedInSettingsComponent extends SettingsComponentBase {
  linkedInSettings: LinkedInExternalLoginProviderSettingsDto;

  constructor(_injector: Injector, private tenantSettingsService: TenantSettingsServiceProxy) {
    super(_injector);
  }

  ngOnInit(): void {
    this.startLoading();
    this.tenantSettingsService
      .getLinkedInSettings()
      .pipe(finalize(() => this.finishLoading()))
      .subscribe(res => {
        this.linkedInSettings = res;
        this.changeDetection.detectChanges();
      });
  }

  isValid(): boolean {
    let isAppIdSet = !!this.linkedInSettings.settings.appId;
    let isAppSecret = !!this.linkedInSettings.settings.appSecret;

    let isValid = (!isAppIdSet && !isAppSecret) || (isAppIdSet && isAppSecret);

    if (!isValid) {
      let fieldName = isAppIdSet ? 'AppSecret' : 'AppId';
      this.notify.error(this.l('RequiredField', this.l(fieldName)));
    }

    return isValid;
  }

  getSaveObs(): Observable<any> {
    return this.tenantSettingsService.updateLinkedInSettings(this.linkedInSettings);
  }
}
