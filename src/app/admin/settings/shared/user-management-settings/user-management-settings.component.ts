/** Core imports */
import { Component, ChangeDetectionStrategy, Injector, ViewChild } from '@angular/core';

/** Third party imports */
import { forkJoin, Observable } from 'rxjs';
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

    publicCreateLeadUrl: string;

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
            forkJoin(
                this.hostSettingsService.getUserManagementSettings().pipe(
                    finalize(() => this.finishLoading())
                ),
                this.hostSettingsService.getPublicCreateLeadURL().pipe(
                    finalize(() => this.finishLoading())
                )
            ).subscribe(([settings, publicCreateLeadUrl]: [HostUserManagementSettingsEditDto, string]) => {
                this.hostSettings = settings;
                this.publicCreateLeadUrl = publicCreateLeadUrl;
                this.changeDetection.detectChanges();
            });
        }
        else {
            forkJoin(
                this.tenantSettingsService.getUserManagementSettings().pipe(
                    finalize(() => this.finishLoading())
                ),
                this.tenantSettingsService.getPublicCreateLeadURL().pipe(
                    finalize(() => this.finishLoading())
                )
            ).subscribe(([settings, publicCreateLeadUrl]: [TenantUserManagementSettingsEditDto, string]) => {
                this.publicCreateLeadUrl = publicCreateLeadUrl;
                this.tenantSettings = settings;
                this.initialSignUpPageEnabled = settings.isSignUpPageEnabled;
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