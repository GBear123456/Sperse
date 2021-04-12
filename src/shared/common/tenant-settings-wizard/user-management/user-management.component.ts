import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ITenantSettingsStepComponent } from '@shared/common/tenant-settings-wizard/tenant-settings-step-component.interface';
import { Observable } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import {
    HostSettingsServiceProxy,
    HostUserManagementSettingsEditDto,
    TenantSettingsServiceProxy,
    TenantUserManagementSettingsEditDto,
    EmailTemplateType
} from '@shared/service-proxies/service-proxies';
import { WelcomeEmailDialogComponent } from './weclome-email-dialog/welcome-email-dialog.component';

@Component({
    selector: 'user-management',
    templateUrl: 'user-management.component.html',
    styleUrls: ['../shared/styles/common.less', 'user-management.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserManagementComponent implements ITenantSettingsStepComponent {
    @Input() tenantSettings: TenantUserManagementSettingsEditDto;
    @Input() hostSettings: HostUserManagementSettingsEditDto;
    constructor(
        private hostSettingsServiceProxy: HostSettingsServiceProxy,
        private tenantSettingsServiceProxy: TenantSettingsServiceProxy,
        public ls: AppLocalizationService,
        public dialog: MatDialog
    ) { }

    onWelcomeEmailTemplateClick() {
        let dialogComponent = this.dialog.open(WelcomeEmailDialogComponent, {
            panelClass: 'slider',
            disableClose: true,
            closeOnNavigation: false,
            data: {
                templateId: this.tenantSettings ? this.tenantSettings.welcomeEmailTemplateId : this.hostSettings.welcomeEmailTemplateId,
                title: this.ls.l('Template')
            }
        }).componentInstance;
        dialogComponent.onSave.subscribe((data) => {
            if (data) {
                if (this.tenantSettings)
                    this.tenantSettings.welcomeEmailTemplateId = data.templateId;
                else
                    this.hostSettings.welcomeEmailTemplateId = data.templateId;
            }

            dialogComponent.close();
        });
        return dialogComponent;
    }

    save(): Observable<void> {
        return this.tenantSettings
            ? this.tenantSettingsServiceProxy.updateUserManagementSettings(this.tenantSettings)
            : this.hostSettingsServiceProxy.updateUserManagementSettings(this.hostSettings);
    }
}