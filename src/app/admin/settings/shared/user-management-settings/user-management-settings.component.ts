/** Core imports */
import { Component, ChangeDetectionStrategy, Injector, ViewChild } from '@angular/core';

/** Third party imports */
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

/** Application imports */
import {
    HostSettingsServiceProxy,
    HostUserManagementSettingsEditDto,
    TenantSettingsServiceProxy,
    TenantUserManagementSettingsEditDto,
    EmailTemplateType
} from '@shared/service-proxies/service-proxies';
import { SettingsComponentBase } from './../settings-base.component';
import { ContactGroupTemplatesComponent } from '@app/crm/shared/email-template-dialog/contact-group-templates/contact-group-templates.component';

@Component({
    selector: 'user-management-settings',
    templateUrl: './user-management-settings.component.html',
    styleUrls: ['./user-management-settings.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [TenantSettingsServiceProxy, HostSettingsServiceProxy]
})
export class UserManagementSettingsComponent extends SettingsComponentBase {
    @ViewChild(ContactGroupTemplatesComponent) contactGroupTemplates: ContactGroupTemplatesComponent;

    tenantSettings: TenantUserManagementSettingsEditDto;
    hostSettings: HostUserManagementSettingsEditDto;

    EmailTemplateType = EmailTemplateType;
    initialSignUpPageEnabled: boolean;

    constructor(
        _injector: Injector,
        private tenantSettingsService: TenantSettingsServiceProxy,
        private hostSettingsService: HostSettingsServiceProxy
    ) {
        super(_injector);
    }

    ngOnInit(): void {
        this.startLoading();

        if (this.isHost) {
            this.hostSettingsService.getUserManagementSettings()
                .pipe(
                    finalize(() => this.finishLoading())
                )
                .subscribe(res => {
                    this.hostSettings = res;
                    this.changeDetection.detectChanges();
                });
        }
        else {
            this.tenantSettingsService.getUserManagementSettings()
                .pipe(
                    finalize(() => this.finishLoading())
                )
                .subscribe(res => {
                    this.tenantSettings = res;
                    this.initialSignUpPageEnabled = res.isSignUpPageEnabled;
                    this.changeDetection.detectChanges();
                });
        }
    }

    isValid(): boolean {
        return this.contactGroupTemplates.validate();
    }

    getSaveObs(): Observable<any> {
        return this.isHost
            ? this.hostSettingsService.updateUserManagementSettings(this.hostSettings)
            : this.tenantSettingsService.updateUserManagementSettings(this.tenantSettings);
    }

    afterSave() {
        if (this.initialSignUpPageEnabled !== this.tenantSettings.isSignUpPageEnabled
        ) {
            this.message.info(this.l('SettingsChangedRefreshPageNotification', this.l('General'))).done(function () {
                window.location.reload();
            });
        }
    }
}