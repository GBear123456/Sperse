/** Core imports */
import { NgModule } from '@angular/core';
import * as ngCommon from '@angular/common';
import { FormsModule } from '@angular/forms';

/** Third party imports */
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule, MatStepperModule, MatInputModule,
    MatDialogModule, MatTabsModule, MatSidenavModule, } from '@angular/material';
import { DxFileUploaderModule, DxDataGridModule, DxValidatorModule, DxTooltipModule, DxContextMenuModule,
    DxListModule, DxValidationSummaryModule, DxTextBoxModule, DxButtonModule, DxSelectBoxModule,
    DxTextAreaModule, DxValidationGroupModule, DxNumberBoxModule, DxScrollViewModule
} from 'devextreme-angular';
import { FileUploadModule } from 'ng2-file-upload';
import { ModalModule, PopoverModule, TabsModule, TooltipModule } from 'ngx-bootstrap';
import { AutoCompleteModule, EditorModule, FileUploadModule as PrimeNgFileUploadModule, InputMaskModule, PaginatorModule } from 'primeng/primeng';
import { TableModule } from 'primeng/table';

/** Application imports */
import { CommonModule } from '@shared/common/common.module';
import { AppCommonModule } from '@app/shared/common/app-common.module';
import { UtilsModule } from '@shared/utils/utils.module';
import { AddMemberModalComponent } from 'app/admin/organization-units/add-member-modal.component';
import { AdminRoutingModule } from './admin-routing.module';
import { AuditLogDetailModalComponent } from './audit-logs/audit-log-detail-modal.component';
import { AuditLogsComponent } from './audit-logs/audit-logs.component';
import { EntityChangeDetailModalComponent } from './audit-logs/entity-change-detail-modal.component';
import { HostDashboardComponent } from './dashboard/host-dashboard.component';
import { CreateOrEditEditionModalComponent } from './editions/create-or-edit-edition-modal.component';
import { EditionsComponent } from './editions/editions.component';
import { CreateOrEditLanguageModalComponent } from './languages/create-or-edit-language-modal.component';
import { EditTextModalComponent } from './languages/edit-text-modal.component';
import { LanguageTextsComponent } from './languages/language-texts.component';
import { LanguagesComponent } from './languages/languages.component';
import { MaintenanceComponent } from './maintenance/maintenance.component';
import { CreateOrEditUnitModalComponent } from './organization-units/create-or-edit-unit-modal.component';
import { OrganizationTreeComponent } from './organization-units/organization-tree.component';
import { OrganizationUnitMembersComponent } from './organization-units/organization-unit-members.component';
import { OrganizationUnitsComponent } from './organization-units/organization-units.component';
import { CreateOrEditRoleModalComponent } from './roles/create-or-edit-role-modal.component';
import { RolesComponent } from './roles/roles.component';
import { HostSettingsComponent } from './settings/host-settings.component';
import { TenantSettingsComponent } from './settings/tenant-settings.component';
import { EditionComboComponent } from './shared/edition-combo.component';
import { FeatureTreeComponent } from './shared/feature-tree.component';
import { OrganizationUnitsTreeComponent } from './shared/organization-unit-tree.component';
import { PermissionComboComponent } from './shared/permission-combo.component';
import { PermissionTreeComponent } from './shared/permission-tree.component';
import { RoleComboComponent } from './shared/role-combo.component';
import { InvoiceComponent } from './subscription-management/invoice/invoice.component';
import { SubscriptionManagementComponent } from './subscription-management/subscription-management.component';
import { CreateTenantModalComponent } from './tenants/create-tenant-modal.component';
import { EditTenantModalComponent } from './tenants/edit-tenant-modal.component';
import { TenantFeaturesModalComponent } from './tenants/tenant-features-modal.component';
import { TenantsComponent } from './tenants/tenants.component';
import { UiCustomizationComponent } from './ui-customization/ui-customization.component';
import { CreateOrEditUserModalComponent } from './users/create-or-edit-user-modal.component';
import { EditUserPermissionsModalComponent } from './users/edit-user-permissions-modal.component';
import { ImpersonationService } from './users/impersonation.service';
import { UsersComponent } from './users/users.component';
import { JobsComponent } from './jobs/jobs.component';
import { SystemSettingsComponent } from './settings/system-settings.component';
import { UploadSSLCertificateModalComponent } from './settings/modals/upload-ssl-cert-modal.component';
import { AddOrEditSSLBindingModal } from './settings/modals/add-or-edit-ssl-binding-modal.component';
import { CreateUserDialogComponent } from './users/create-user-dialog/create-user-dialog.component';
import { PaymentInfoModule } from '@shared/common/widgets/payment-info/payment-info.module';
import { ContactsModule } from '../crm/contacts/contacts.module';
import { ModulesEditionsSelectComponent } from '@admin/tenants/modules-edtions-select.component.ts/modules-editions-select.component';

@NgModule({
    imports: [
        FormsModule,
        ngCommon.CommonModule,
        CommonModule,
        AppCommonModule,
        AdminRoutingModule,
        FileUploadModule,
        ModalModule.forRoot(),
        TabsModule.forRoot(),
        TooltipModule.forRoot(),
        PopoverModule.forRoot(),
        ContactsModule,

        DxScrollViewModule,
        DxValidationGroupModule,
        DxValidationSummaryModule,
        DxFileUploaderModule,
        DxDataGridModule,
        DxValidatorModule,
        DxSelectBoxModule,
        DxTextBoxModule,
        DxButtonModule,
        DxTooltipModule,
        DxTextAreaModule,
        DxNumberBoxModule,
        DxContextMenuModule,
        DxListModule,

        MatTabsModule,
        MatInputModule,
        MatSidenavModule,
        MatDialogModule,
        MatFormFieldModule,
        MatProgressBarModule,
        MatStepperModule,

        UtilsModule,
        TableModule,
        PaginatorModule,
        PrimeNgFileUploadModule,
        AutoCompleteModule,
        EditorModule,
        InputMaskModule,
        PaymentInfoModule
    ],
    declarations: [
        UsersComponent,
        PermissionComboComponent,
        RoleComboComponent,
        CreateOrEditUserModalComponent,
        EditUserPermissionsModalComponent,
        PermissionTreeComponent,
        OrganizationUnitsTreeComponent,
        RolesComponent,
        CreateOrEditRoleModalComponent,
        AuditLogsComponent,
        AuditLogDetailModalComponent,
        EntityChangeDetailModalComponent,
        HostSettingsComponent,
        MaintenanceComponent,
        JobsComponent,
        LanguagesComponent,
        LanguageTextsComponent,
        CreateOrEditLanguageModalComponent,
        CreateOrEditLanguageModalComponent,
        EditTextModalComponent,
        OrganizationUnitsComponent,
        OrganizationTreeComponent,
        OrganizationUnitMembersComponent,
        CreateOrEditUnitModalComponent,
        TenantSettingsComponent,
        SystemSettingsComponent,
        UploadSSLCertificateModalComponent,
        AddOrEditSSLBindingModal,
        HostDashboardComponent,
        InvoiceComponent,
        SubscriptionManagementComponent,
        AddMemberModalComponent,
        UiCustomizationComponent,
        EditionsComponent,
        CreateOrEditEditionModalComponent,
        FeatureTreeComponent,
        EditionComboComponent,
        TenantsComponent,
        CreateTenantModalComponent,
        EditTenantModalComponent,
        ModulesEditionsSelectComponent,
        TenantFeaturesModalComponent,
        CreateUserDialogComponent
    ],
    entryComponents: [
        CreateUserDialogComponent
    ],
    exports: [
        AddMemberModalComponent
    ],
    providers: [
        ImpersonationService
    ]
})

export class AdminModule { }
