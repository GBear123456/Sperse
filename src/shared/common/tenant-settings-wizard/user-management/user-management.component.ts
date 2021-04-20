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
import { ContactsService } from '@app/crm/contacts/contacts.service';

@Component({
    selector: 'user-management',
    templateUrl: 'user-management.component.html',
    styleUrls: ['../shared/styles/common.less', 'user-management.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserManagementComponent implements ITenantSettingsStepComponent {
    @Input() tenantSettings: TenantUserManagementSettingsEditDto;
    @Input() hostSettings: HostUserManagementSettingsEditDto;

    EmailTemplateType = EmailTemplateType;

    constructor(
        private hostSettingsServiceProxy: HostSettingsServiceProxy,
        private tenantSettingsServiceProxy: TenantSettingsServiceProxy,
        private contactsService: ContactsService,
        public ls: AppLocalizationService,
        public dialog: MatDialog
    ) { }

    save(): Observable<void> {
        return this.tenantSettings
            ? this.tenantSettingsServiceProxy.updateUserManagementSettings(this.tenantSettings)
            : this.hostSettingsServiceProxy.updateUserManagementSettings(this.hostSettings);
    }
}