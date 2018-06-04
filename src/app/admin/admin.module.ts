import { NgModule } from '@angular/core';
import * as ngCommon from '@angular/common';
import { CommonModule } from '@shared/common/common.module';
import { FormsModule } from '@angular/forms';
import { AppCommonModule } from '@app/shared/common/app-common.module';
import { AdminRoutingModule } from './admin-routing.module';

import { ModalModule, TabsModule, TooltipModule, PopoverModule } from 'ngx-bootstrap';
import { FileUploadModule } from '@node_modules/ng2-file-upload';

import { UtilsModule } from '@shared/utils/utils.module';
import { DxFileUploaderModule, DxDataGridModule, DxValidatorModule, DxTooltipModule,
  DxListModule, DxValidationSummaryModule, DxTextBoxModule, DxButtonModule, DxSelectBoxModule
} from 'devextreme-angular';

import { UsersComponent } from './users/users.component';
import { PermissionComboComponent } from './shared/permission-combo.component';
import { RoleComboComponent } from './shared/role-combo.component';
import { CreateOrEditUserModalComponent } from './users/create-or-edit-user-modal.component';
import { EditUserPermissionsModalComponent } from './users/edit-user-permissions-modal.component';
import { PermissionTreeComponent } from './shared/permission-tree.component';
import { OrganizationUnitsTreeComponent } from './shared/organization-unit-tree.component';

import { RolesComponent } from './roles/roles.component';
import { CreateOrEditRoleModalComponent } from './roles/create-or-edit-role-modal.component';

import { EditionsComponent } from './editions/editions.component';
import { CreateOrEditEditionModalComponent } from './editions/create-or-edit-edition-modal.component';

import { EditionComboComponent } from './shared/edition-combo.component';
import { FeatureTreeComponent } from './shared/feature-tree.component';
import { AuditLogsComponent } from './audit-logs/audit-logs.component';
import { AuditLogDetailModalComponent } from './audit-logs/audit-log-detail-modal.component';

import { HostSettingsComponent } from './settings/host-settings.component';
import { MaintenanceComponent } from './maintenance/maintenance.component';
import { JobsComponent } from './jobs/jobs.component';
import { ImpersonationService } from './users/impersonation.service';
import { LanguagesComponent } from './languages/languages.component';
import { LanguageTextsComponent } from './languages/language-texts.component';
import { CreateOrEditLanguageModalComponent } from './languages/create-or-edit-language-modal.component';
import { EditTextModalComponent } from './languages/edit-text-modal.component';
import { OrganizationUnitsComponent } from './organization-units/organization-units.component';
import { OrganizationTreeComponent } from './organization-units/organization-tree.component';
import { OrganizationUnitMembersComponent } from './organization-units/organization-unit-members.component';
import { CreateOrEditUnitModalComponent } from './organization-units/create-or-edit-unit-modal.component';
import { TenantSettingsComponent } from './settings/tenant-settings.component';
import { SystemSettingsComponent } from './settings/system-settings.component';
import { UploadSSLCertificateModalComponent } from './settings/modals/upload-ssl-cert-modal.component';
import { AddOrEditSSLBindingModal } from './settings/modals/add-or-edit-ssl-binding-modal.component';
import { HostDashboardComponent } from './dashboard/host-dashboard.component';
import { InvoiceComponent } from './subscription-management/invoice/invoice.component';
import { SubscriptionManagementComponent } from './subscription-management/subscription-management.component';
import { DataTableModule } from 'primeng/primeng';
import { PaginatorModule } from 'primeng/primeng';
import { EditorModule } from 'primeng/primeng';
import { AddMemberModalComponent } from 'app/admin/organization-units/add-member-modal.component';
import { FileUploadModule as PrimeNgFileUploadModule } from 'primeng/primeng';
import { AutoCompleteModule } from 'primeng/primeng';
import { InputMaskModule } from 'primeng/primeng';
import { UiCustomizationComponent } from './ui-customization/ui-customization.component';
import { TenantsComponent } from './tenants/tenants.component';
import { CreateTenantModalComponent } from './tenants/create-tenant-modal.component';
import { EditTenantModalComponent } from './tenants/edit-tenant-modal.component';
import { TenantFeaturesModalComponent } from './tenants/tenant-features-modal.component';

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
        DxValidationSummaryModule,
        DxFileUploaderModule,
        DxDataGridModule,
        DxValidatorModule,
        DxSelectBoxModule,
        DxTextBoxModule,
        DxButtonModule,
        DxTooltipModule,
        DxListModule,
        UtilsModule,
        DataTableModule,
        PaginatorModule,
        PrimeNgFileUploadModule,
        AutoCompleteModule,
        EditorModule,
        InputMaskModule
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
        TenantFeaturesModalComponent
    ],
    exports: [
        AddMemberModalComponent
    ]
})

export class AdminModule { }
