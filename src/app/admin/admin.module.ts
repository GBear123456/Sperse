/** Core imports */
import { NgModule } from '@angular/core';
import * as ngCommon from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

/** Third party imports */
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatStepperModule } from '@angular/material/stepper';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSidenavModule } from '@angular/material/sidenav';

import { DxChartModule } from 'devextreme-angular/ui/chart';
import { DxPieChartModule } from 'devextreme-angular/ui/pie-chart';
import { DxFileUploaderModule } from 'devextreme-angular/ui/file-uploader';
import { DxDataGridModule } from 'devextreme-angular/ui/data-grid';
import { DxValidatorModule } from 'devextreme-angular/ui/validator';
import { DxTooltipModule } from 'devextreme-angular/ui/tooltip';
import { DxContextMenuModule } from 'devextreme-angular/ui/context-menu';
import { DxListModule } from 'devextreme-angular/ui/list';
import { DxValidationSummaryModule } from 'devextreme-angular/ui/validation-summary';
import { DxTextBoxModule } from 'devextreme-angular/ui/text-box';
import { DxButtonModule } from 'devextreme-angular/ui/button';
import { DxSelectBoxModule } from 'devextreme-angular/ui/select-box';
import { DxTextAreaModule } from 'devextreme-angular/ui/text-area';
import { DxValidationGroupModule } from 'devextreme-angular/ui/validation-group';
import { DxNumberBoxModule } from 'devextreme-angular/ui/number-box';
import { DxScrollViewModule } from 'devextreme-angular/ui/scroll-view';
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
import { ItemDetailsLayoutModule } from '@shared/common/item-details-layout/item-details-layout.module';

@NgModule({
    imports: [
        FormsModule,
        ReactiveFormsModule,
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
        DxPieChartModule,
        DxChartModule,
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
        PaymentInfoModule,
        ItemDetailsLayoutModule
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
        CreateUserDialogComponent,
        CreateTenantModalComponent,
        EditTenantModalComponent,
        TenantFeaturesModalComponent,
        CreateOrEditEditionModalComponent,
        CreateOrEditLanguageModalComponent,
        CreateOrEditRoleModalComponent
    ],
    exports: [
        AddMemberModalComponent
    ],
    providers: [
        ImpersonationService
    ]
})

export class AdminModule { }
