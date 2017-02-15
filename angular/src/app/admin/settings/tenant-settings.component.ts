import { Component, OnInit, Injector, ViewEncapsulation, ViewChild } from '@angular/core';
import { Http } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { TenantSettingsServiceProxy, HostSettingsServiceProxy, DefaultTimezoneScope, TenantSettingsEditDto, SendTestEmailInput } from '@shared/service-proxies/service-proxies';
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppTimezoneScope } from '@shared/AppEnums';
import { AppSessionService } from '@shared/common/session/app-session.service';

import * as moment from "moment";

@Component({
    templateUrl: "./tenant-settings.component.html",
    animations: [appModuleAnimation()]
})
export class TenantSettingsComponent extends AppComponentBase implements OnInit {


    usingDefaultTimeZone: boolean = false;
    initialTimeZone: string = null;
    testEmailAddress: string = undefined;

    isMultiTenancyEnabled: boolean = this.multiTenancy.isEnabled;
    showTimezoneSelection: boolean = abp.clock.provider.supportsMultipleTimezone;
    activeTabIndex: number = (abp.clock.provider.supportsMultipleTimezone) ? 0 : 1;
    loading: boolean = false;
    settings: TenantSettingsEditDto = undefined;

    defaultTimezoneScope: DefaultTimezoneScope = AppTimezoneScope.Tenant;

    constructor(
        injector: Injector,
        private _tenantSettingsService: TenantSettingsServiceProxy,
        private _appSessionService: AppSessionService
    ) {
        super(injector);
    }


    init(): void {
        this.testEmailAddress = this._appSessionService.user.emailAddress;
        this.getSettings();
    }

    ngOnInit(): void {
        let self = this;
        self.init();
    }

    getSettings(): void {
        this.loading = true;
        this._tenantSettingsService.getAllSettings()
            .finally(() => {
                this.loading = false;
            })
            .subscribe((result) => {
                this.settings = result;
                if (this.settings.general) {
                    this.initialTimeZone = this.settings.general.timezone;
                    this.usingDefaultTimeZone = this.settings.general.timezoneForComparison === abp.setting.values["Abp.Timing.TimeZone"];
                }
            });
    }

    saveAll(): void {
        this._tenantSettingsService.updateAllSettings(this.settings).subscribe(() => {
            this.notify.info(this.l('SavedSuccessfully'));

            if (abp.clock.provider.supportsMultipleTimezone && this.usingDefaultTimeZone && this.initialTimeZone !== this.settings.general.timezone) {
                this.message.info(this.l('TimeZoneSettingChangedRefreshPageNotification')).done(() => {
                    window.location.reload();
                });
            }
        });
    };

    sendTestEmail(): void {
        let self = this;
        let input = new SendTestEmailInput();
        input.emailAddress = self.testEmailAddress;
        self._tenantSettingsService.sendTestEmail(input).subscribe(result => {
            self.notify.info(self.l("TestEmailSentSuccessfully"));
        });
    };
}