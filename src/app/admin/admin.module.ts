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
import { DxSwitchModule } from 'devextreme-angular/ui/switch';
import { DxChartModule } from 'devextreme-angular/ui/chart';
import { DxCheckBoxModule } from 'devextreme-angular/ui/check-box';
import { DxPieChartModule } from 'devextreme-angular/ui/pie-chart';
import { DxFileUploaderModule } from 'devextreme-angular/ui/file-uploader';
import { DxDataGridModule } from 'devextreme-angular/ui/data-grid';
import { DxColorBoxModule } from 'devextreme-angular/ui/color-box';
import { DxValidatorModule } from 'devextreme-angular/ui/validator';
import { DxToolbarModule } from 'devextreme-angular/ui/toolbar';
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
import { DxTreeViewModule } from 'devextreme-angular/ui/tree-view';
import { DxScrollViewModule } from 'devextreme-angular/ui/scroll-view';
import { FileUploadModule } from 'ng2-file-upload';
import { ModalModule } from 'ngx-bootstrap/modal';
import { PopoverModule } from 'ngx-bootstrap/popover';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { EditorModule } from 'primeng/editor';
import { FileUploadModule as PrimeNgFileUploadModule } from 'primeng/fileupload';
import { InputMaskModule } from 'primeng/inputmask';
import { PaginatorModule } from 'primeng/paginator';
import { TableModule } from 'primeng/table';

/** Application imports */
import { EditTenantModule } from '@app/admin/tenants/edit-tenant-modal/edit-tenant-modal.module';
import { CommonModule } from '@shared/common/common.module';
import { AppCommonModule } from '@app/shared/common/app-common.module';
import { UtilsModule } from '@shared/utils/utils.module';
import { CountryPhoneNumberModule } from '@shared/common/phone-numbers/country-phone-number.module';
import { AdminRoutingModule } from './admin-routing.module';
import { AuditLogDetailModalComponent } from './audit-logs/audit-log-detail/audit-log-detail-modal.component';
import { AuditLogsComponent } from './audit-logs/audit-logs.component';
import { CreateOrEditEditionModalComponent } from './editions/create-or-edit-edition-modal/create-or-edit-edition-modal.component';
import { EditionsComponent } from './editions/editions.component';
import { CreateOrEditLanguageModalComponent } from './languages/create-or-edit-language-modal/create-or-edit-language-modal.component';
import { EditTextModalComponent } from './languages/edit-text-modal/edit-text-modal.component';
import { LanguageTextsComponent } from './languages/language-texts/language-texts.component';
import { LanguagesComponent } from './languages/languages.component';
import { MaintenanceComponent } from './maintenance/maintenance.component';
import { CreateOrEditRoleModalComponent } from './roles/create-or-edit-role-modal/create-or-edit-role-modal.component';
import { RolesComponent } from './roles/roles.component';
import { SettingsComponent } from './settings/settings/settings.component';
import { EditionComboComponent } from './shared/edition-combo.component';
import { FeaturesModule } from '@app/shared/features/features.module';
import { PermissionComboComponent } from './shared/permission-combo.component';
import { PermissionTreeComponent } from './shared/permission-tree.component';
import { RoleComboComponent } from './shared/role-combo.component';
import { CreateTenantModalComponent } from './tenants/create-tenant-modal/create-tenant-modal.component';
import { StorageChangeDialog } from './tenants/edit-tenant-modal/storage-change-dialog/storage-change-dialog.component';
import { TenantsComponent } from './tenants/tenants.component';
import { UiCustomizationComponent } from './ui-customization/ui-customization.component';
import { ImpersonationService } from './users/impersonation.service';
import { UsersComponent } from './users/users.component';
import { JobsComponent } from './jobs/jobs.component';
import { GeneralSettingsComponent } from './settings/shared/general-settings/general-settings.component';
import { DomainSettingsComponent } from './settings/shared/domain-settings/domain-settings.component';
import { StripeSettingsComponent } from './settings/shared/stripe-settings/stripe-settings.component';
import { PaypalSettingsComponent } from './settings/shared/paypal-settings/paypal-settings.component';
import { FacebookSettingsComponent } from './settings/shared/facebook-settings/facebook-settings.component';
import { GoogleSettingsComponent } from './settings/shared/google-settings/google-settings.component';
import { LinkedInSettingsComponent } from './settings/shared/linkedin-settings/linkedin-settings.component';
import { DiscordSettingsComponent } from './settings/shared/discord-settings/discord-settings.component';
import { MailchimpSettingsComponent } from './settings/shared/mailchimp-settings/mailchimp-settings.component';
import { ExternalAuthInfoComponent } from './settings/shared/helpers/external-auth-info/external-auth-info.component';
import { YTelSettingsComponent } from './settings/shared/ytel-settings/ytel-settings.component';
import { BugsnagSettingsComponent } from './settings/shared/bugsnag-settings/bugsnag-settings.component';
import { SecuritySettingsComponent } from './settings/shared/security-settings/security-settings.component';
import { EmailSettingsComponent } from './settings/shared/email-settings/email-settings.component';
import { UserManagementSettingsComponent } from './settings/shared/user-management-settings/user-management-settings.component';
import { TenantManagementSettingsComponent } from './settings/shared/tenant-management-settings/tenant-management-settings.component';
import { AppearanceSettingsComponent } from './settings/shared/appearance-settings/appearance-settings.component';
import { MemberPortalSettingsComponent } from './settings/shared/member-portal-settings/member-portal-settings.component';
import { SendgridSettingsComponent } from './settings/shared/sendgrid-settings/sendgrid-settings.component';
import { GmailSettingsComponent } from './settings/shared/gmail-settings/gmail-settings.component';
import { KlaviyoSettingsComponent } from './settings/shared/klaviyo-settings/klaviyo-settings.component';
import { EpcvipLinkSettingsComponent } from './settings/shared/epcvip-link-settings/epcvip-link-settings.component';
import { EpcvipEmailSettingsComponent } from './settings/shared/epcvip-email-settings/epcvip-email-settings.component';
import { IAgeSettingsComponent } from './settings/shared/iage-settings/iage-settings.component';
import { OngageSettingsComponent } from './settings/shared/ongage-settings/ongage-settings.component';
import { RapidSettingsComponent } from './settings/shared/rapid-settings/rapid-settings.component';
import { SalesTalkSettingsComponent } from './settings/shared/sales-talk-settings/sales-talk-settings.component';
import { UploadSSLCertificateModalComponent } from './settings/shared/domain-settings/modals/upload-ssl-cert-modal.component';
import { AddOrEditSSLBindingModalComponent } from './settings/shared/domain-settings/modals/add-or-edit-ssl-binding-modal.component';
import { CreateUserDialogComponent } from './users/create-user-dialog/create-user-dialog.component';
import { PaymentInfoModule } from '@shared/common/widgets/payment-info/payment-info.module';
import { ContactsModule } from '../crm/contacts/contacts.module';
import { OrganizationUnitsTreeComponent } from './shared/organization-units-tree/organization-units-tree.component';
import { ItemDetailsLayoutModule } from '@shared/common/item-details-layout/item-details-layout.module';
import { LoadingSpinnerModule } from '@app/shared/common/loading-spinner/loading-spinner.module';
import { ActionMenuModule } from '@app/shared/common/action-menu/action-menu.module';
import { ModalDialogModule } from '@shared/common/dialogs/modal/modal-dialog.module';
import { LeftMenuService } from '@app/cfo/shared/common/left-menu/left-menu.service';
import { TenantLandingPagesComponent } from './tenant-landing-pages/tenant-landing-pages.component';
import { TenantLandingPageModalComponent } from './tenant-landing-pages/tenant-landing-page-modal/tenant-landing-page-modal.component';
import { CurrencySelectorModule } from '@shared/common/currency-selector/currency-selector.module';

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
        DxCheckBoxModule,
        DxValidatorModule,
        DxSelectBoxModule,
        DxTextBoxModule,
        DxButtonModule,
        DxToolbarModule,
        DxTooltipModule,
        DxTextAreaModule,
        DxNumberBoxModule,
        DxContextMenuModule,
        DxPieChartModule,
        DxChartModule,
        DxListModule,
        DxColorBoxModule,
        DxTreeViewModule,
        DxSwitchModule,

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
        CountryPhoneNumberModule,
        AutoCompleteModule,
        EditorModule,
        InputMaskModule,
        PaymentInfoModule,
        ItemDetailsLayoutModule,
        LoadingSpinnerModule,
        ActionMenuModule,
        ModalDialogModule,
        FeaturesModule,
        EditTenantModule,
        CurrencySelectorModule
    ],
    declarations: [
        UsersComponent,
        PermissionComboComponent,
        RoleComboComponent,
        PermissionTreeComponent,
        OrganizationUnitsTreeComponent,
        RolesComponent,
        CreateOrEditRoleModalComponent,
        AuditLogsComponent,
        AuditLogDetailModalComponent,
        SettingsComponent,
        MaintenanceComponent,
        JobsComponent,
        LanguagesComponent,
        LanguageTextsComponent,
        CreateOrEditLanguageModalComponent,
        EditTextModalComponent,
        GeneralSettingsComponent,
        DomainSettingsComponent,
        StripeSettingsComponent,
        PaypalSettingsComponent,
        FacebookSettingsComponent,
        GoogleSettingsComponent,
        LinkedInSettingsComponent,
        DiscordSettingsComponent,
        MailchimpSettingsComponent,
        ExternalAuthInfoComponent,
        YTelSettingsComponent,
        BugsnagSettingsComponent,
        SecuritySettingsComponent,
        EmailSettingsComponent,
        UserManagementSettingsComponent,
        TenantManagementSettingsComponent,
        AppearanceSettingsComponent,
        MemberPortalSettingsComponent,
        SendgridSettingsComponent,
        GmailSettingsComponent,
        KlaviyoSettingsComponent,
        EpcvipLinkSettingsComponent,
        EpcvipEmailSettingsComponent,
        IAgeSettingsComponent,
        OngageSettingsComponent,
        RapidSettingsComponent,
        SalesTalkSettingsComponent,
        UploadSSLCertificateModalComponent,
        AddOrEditSSLBindingModalComponent,
        UiCustomizationComponent,
        EditionsComponent,
        CreateOrEditEditionModalComponent,
        EditionComboComponent,
        TenantsComponent,
        CreateTenantModalComponent,
        StorageChangeDialog,
        CreateUserDialogComponent,
        TenantLandingPagesComponent,
        TenantLandingPageModalComponent
    ],
    entryComponents: [
        CreateUserDialogComponent,
        CreateTenantModalComponent,
        StorageChangeDialog,
        CreateOrEditEditionModalComponent,
        CreateOrEditLanguageModalComponent,
        CreateOrEditRoleModalComponent,
        AuditLogDetailModalComponent,
        UploadSSLCertificateModalComponent,
        AddOrEditSSLBindingModalComponent
    ],
    exports: [
        StorageChangeDialog
    ],
    providers: [
        ImpersonationService,
        LeftMenuService
    ]
})

export class AdminModule { }