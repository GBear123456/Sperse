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
    PublicReceiverSettingsEditDto,
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

    publicReceiverSettings: PublicReceiverSettingsEditDto;

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
                this.hostSettingsService.getUserManagementSettings(),
                this.hostSettingsService.getPublicReceiverSettings()
            ).pipe(
                finalize(() => this.finishLoading())
            ).subscribe(([settings, publicReceiverSettings]: [HostUserManagementSettingsEditDto, PublicReceiverSettingsEditDto]) => {
                this.hostSettings = settings;
                this.publicReceiverSettings = publicReceiverSettings;
                this.changeDetection.detectChanges();
            });
        }
        else {
            forkJoin(
                this.tenantSettingsService.getUserManagementSettings(),
                this.tenantSettingsService.getPublicReceiverSettings()
            ).pipe(
                finalize(() => this.finishLoading())
            ).subscribe(([settings, publicReceiverSettings]: [TenantUserManagementSettingsEditDto, PublicReceiverSettingsEditDto]) => {
                this.publicReceiverSettings = publicReceiverSettings;
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
            ? forkJoin(
                this.hostSettingsService.updateUserManagementSettings(this.hostSettings),
                this.hostSettingsService.updatePublicReceiverSettings(this.publicReceiverSettings)
            )
            : forkJoin(
                this.tenantSettingsService.updateUserManagementSettings(this.tenantSettings),
                this.tenantSettingsService.updatePublicReceiverSettings(this.publicReceiverSettings)
            );
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