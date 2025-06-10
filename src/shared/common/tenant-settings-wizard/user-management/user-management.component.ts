import { ChangeDetectionStrategy, Component, Input, Output, ViewChild, EventEmitter } from '@angular/core';
import { ITenantSettingsStepComponent } from '@shared/common/tenant-settings-wizard/tenant-settings-step-component.interface';
import { Observable, throwError } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import {
    HostSettingsServiceProxy,
    HostUserManagementSettingsEditDto,
    TenantSettingsServiceProxy,
    TenantUserManagementSettingsEditDto,
    EmailTemplateType
} from '@shared/service-proxies/service-proxies';
import { ContactGroupTemplatesComponent } from '@app/crm/shared/email-template-dialog/contact-group-templates/contact-group-templates.component';

@Component({
    selector: 'user-management',
    templateUrl: 'user-management.component.html',
    styleUrls: ['../shared/styles/common.less', 'user-management.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserManagementComponent implements ITenantSettingsStepComponent {
    @ViewChild(ContactGroupTemplatesComponent) contactGroupTemplates: ContactGroupTemplatesComponent;

    @Input() tenantSettings: TenantUserManagementSettingsEditDto;
    @Input() hostSettings: HostUserManagementSettingsEditDto;
    @Output() onOptionChanged: EventEmitter<string> = new EventEmitter<string>();

    EmailTemplateType = EmailTemplateType;
    initialSignUpPageEnabled: boolean;

    constructor(
        private hostSettingsServiceProxy: HostSettingsServiceProxy,
        private tenantSettingsServiceProxy: TenantSettingsServiceProxy,
        public ls: AppLocalizationService,
        public dialog: MatDialog
    ) {}

    initSignUpPageEnabled() {
        this.initialSignUpPageEnabled = this.tenantSettings.isSignUpPageEnabled;
    }

    save(): Observable<void> {
        if (!this.contactGroupTemplates.validate()) {
            return throwError('');
        }

        return this.tenantSettings
            ? this.tenantSettingsServiceProxy.updateUserManagementSettings(this.tenantSettings).pipe(tap(() => {
                if (this.initialSignUpPageEnabled != this.tenantSettings.isSignUpPageEnabled)
                    this.onOptionChanged.emit('SignUpPageEnabled');
            })) : this.hostSettingsServiceProxy.updateUserManagementSettings(this.hostSettings);
    }

    isValid(): boolean {
        return this.contactGroupTemplates.validate();
    }
}