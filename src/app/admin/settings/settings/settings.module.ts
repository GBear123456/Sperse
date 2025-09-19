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
import { MatCheckboxModule } from '@node_modules/@angular/material/checkbox';
import { MatSidenavModule } from '@angular/material/sidenav';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatButtonModule} from '@angular/material/button';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import { DxDropDownBoxModule, DxFileManagerModule, DxTagBoxModule } from 'devextreme-angular';
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
import { DxDateBoxModule } from 'devextreme-angular/ui/date-box';
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
import { LucideAngularModule } from 'lucide-angular';
import { NgxFileDropModule } from 'ngx-file-drop';
import { CKEditorModule } from 'ckeditor4-angular';
import { CdkAccordionModule } from '@angular/cdk/accordion';
import { InlineSVGModule } from 'ng-inline-svg-2';

/** Application imports */
import { SettingsRoutingModule } from './settings-routing.module';
import { EditTenantModule } from '@app/admin/tenants/edit-tenant-modal/edit-tenant-modal.module';
import { CountryPhoneNumberModule } from '@shared/common/phone-numbers/country-phone-number.module';
import { CommonModule } from '@shared/common/common.module';
import { AppCommonModule } from '@app/shared/common/app-common.module';
import { UtilsModule } from '@shared/utils/utils.module';
import { FeaturesModule } from '@app/shared/features/features.module';
import { PaymentInfoModule } from '@shared/common/widgets/payment-info/payment-info.module';
import { ContactsModule } from '../../../crm/contacts/contacts.module';
import { ItemDetailsLayoutModule } from '@shared/common/item-details-layout/item-details-layout.module';
import { LoadingSpinnerModule } from '@app/shared/common/loading-spinner/loading-spinner.module';
import { ActionMenuModule } from '@app/shared/common/action-menu/action-menu.module';
import { ModalDialogModule } from '@shared/common/dialogs/modal/modal-dialog.module';
import { CurrencySelectorModule } from '@shared/common/currency-selector/currency-selector.module';
import { TenantSettingsWizardModule } from '@root/shared/common/tenant-settings-wizard/tenant-settings-wizard.module';
import { ZapierModule } from '@shared/common/zapier/zapier.module';
import { SocialDialogModule } from '@shared/social-dialog';
import { LeftMenuService } from '@app/cfo/shared/common/left-menu/left-menu.service';
import { SettingService } from './settings.service'
import { ImpersonationService } from '../../users/impersonation.service';
import { SettingsHeaderComponent } from '../shared/header/settings-header.component';
import { MainMenuItemComponent } from './navigation/main-menu-item/main-menu-item.component';
import { MainMenuPanelComponent } from './navigation/main-menu-panel/main-menu-panel.component';
import { SubMenuItemComponent } from './navigation/sub-menu-item/sub-menu-item.component';
import { SubMenuPanelComponent } from './navigation/sub-menu-panel/sub-menu-panel.component';
import { SettingsNewComponent } from './settings.new.component';
import { SearchBarComponent } from '../shared/dashboard-settings/search-bar/search-bar.component';
import { DashboardSettingComponent } from '../shared/dashboard-settings/dashboard-settings.component';
import { GeneralSettingsComponent } from '../shared/general-settings/general-settings.component';
import { AppearanceSettingsComponent } from '../shared/appearance-settings/appearance-settings.component';
import { DomainSettingsComponent } from '../shared/domain-settings/domain-settings.component';
import { EmailSettingsComponent } from '../shared/email-settings/email-settings.component';
import { StripeSettingsComponent } from '../shared/stripe-settings/stripe-settings.component';
import { PaypalSettingsComponent } from '../shared/paypal-settings/paypal-settings.component';
import { AuthorizeNetSettingsComponent } from '../shared/authorize-net-settings/authorize-net-settings.component';
import { RazorPaySettingsComponent } from '../shared/razorpay-settings/razorpay-settings.component';
import { PayStackSettingsComponent } from '../shared/paystack-settings/paystack-settings.component';
import { OtherProviderSettingsComponent } from '../shared/other-payment-provider-settings/other-payment-provider-settings.component';
import { BankTransferSettingsComponent } from '../shared/bank-transfer-settings/bank-transfer-settings.component';
import { BankSettingsComponent } from '../shared/bank-settings/bank-settings.component';
import { PersonalSettingsComponent } from '../shared/personal-settings/personal-settings.component';
import { AISettingsComponent } from '../shared/ai-settings/ai-settings.component';
import { SmsVerificationModalComponent } from '../shared/personal-settings/sms-verification-modal.component';
import { TrackingToolsSettingsComponent } from '../shared/tracking-tools-settings/tracking-tools-settings.component';
import { TrackingToolSectionComponent } from '../shared/tracking-tools-settings/tracking-tool-section/tracking-tool-section.component';
import { MailchimpSettingsComponent } from '../shared/mailchimp-settings/mailchimp-settings.component';
import { KlaviyoSettingsComponent } from '../shared/klaviyo-settings/klaviyo-settings.component';
import { SendgridSettingsComponent } from '../shared/sendgrid-settings/sendgrid-settings.component';
import { IAgeSettingsComponent } from '../shared/iage-settings/iage-settings.component';
import { OngageSettingsComponent } from '../shared/ongage-settings/ongage-settings.component';
import { YTelSettingsComponent } from '../shared/ytel-settings/ytel-settings.component';
import { TenantManagementSettingsComponent } from '../shared/tenant-management-settings/tenant-management-settings.component';
import { UserManagementSettingsComponent } from '../shared/user-management-settings/user-management-settings.component';
import { SecuritySettingsComponent } from '../shared/security-settings/security-settings.component';
import { BugsnagSettingsComponent } from '../shared/bugsnag-settings/bugsnag-settings.component';
import { FacebookSettingsComponent } from '../shared/facebook-settings/facebook-settings.component';
import { GoogleSettingsComponent } from '../shared/google-settings/google-settings.component';
import { LinkedInSettingsComponent } from '../shared/linkedin-settings/linkedin-settings.component';
import { DiscordSettingsComponent } from '../shared/discord-settings/discord-settings.component';
import { ExternalAuthInfoComponent } from '../shared/helpers/external-auth-info/external-auth-info.component';
// import { MemberPortalSettingsComponent } from './settings/shared/member-portal-settings/member-portal-settings.component';
// import { GmailSettingsComponent } from './settings/shared/gmail-settings/gmail-settings.component';
// import { EpcvipLinkSettingsComponent } from './settings/shared/epcvip-link-settings/epcvip-link-settings.component';
// import { EpcvipEmailSettingsComponent } from './settings/shared/epcvip-email-settings/epcvip-email-settings.component';
// import { RapidSettingsComponent } from './settings/shared/rapid-settings/rapid-settings.component';
// import { SalesTalkSettingsComponent } from './settings/shared/sales-talk-settings/sales-talk-settings.component';
// import { UploadSSLCertificateModalComponent } from './settings/shared/domain-settings/modals/upload-ssl-cert-modal.component';
// import { AddOrEditSSLBindingModalComponent } from './settings/shared/domain-settings/modals/add-or-edit-ssl-binding-modal.component';
import { DocumentsComponent } from '../shared/documents-settings/documents-settings.component';
import { SettingsCardComponent } from '../shared/card/settings-card.component'
import { SettingsItemComponent } from '../shared/general-settings/setting-item/settings-item.component'
import { SettingsUploaderComponent } from '../shared/settings-uploader/settings-uploader.component'
import { InvoiceSettingsComponent } from '../shared/invoice-settings/invoice-settings.component';
import { CommissionsComponent } from "../shared/commissions-settings/commissions-settings.component";
import { OtherSettingsComponent } from '../shared/other-settings/other-settings.component';
import { CreditsSettingsComponent } from '../shared/credits-settings/credits-settings.component';

@NgModule({
    imports: [
        FormsModule,
        ReactiveFormsModule,
        LucideAngularModule,
        ngCommon.CommonModule,
        CommonModule,
        AppCommonModule,
        SettingsRoutingModule,
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
        DxTagBoxModule,
        DxListModule,
        DxColorBoxModule,
        DxTreeViewModule,
        DxSwitchModule,
        DxDateBoxModule,
        DxFileManagerModule,
        DxDropDownBoxModule,

        MatTabsModule,
        MatInputModule,
        MatSidenavModule,
        MatDialogModule,
        MatFormFieldModule,
        MatProgressBarModule,
        MatStepperModule,
        MatButtonModule, 
        MatTooltipModule,
        MatSlideToggleModule,
        MatCheckboxModule,

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
        CurrencySelectorModule,
        TenantSettingsWizardModule,
        CKEditorModule,
        ZapierModule,
        SocialDialogModule,
        NgxFileDropModule,
        CdkAccordionModule,
        InlineSVGModule.forRoot(),
    ],
    declarations: [
        MainMenuItemComponent,
        MainMenuPanelComponent,
        SubMenuItemComponent,
        SubMenuPanelComponent,
        SearchBarComponent,
        SettingsHeaderComponent,
        DashboardSettingComponent,
        SettingsNewComponent,
        GeneralSettingsComponent,
        AppearanceSettingsComponent,
        DomainSettingsComponent,
        EmailSettingsComponent,
        PaypalSettingsComponent,
        AuthorizeNetSettingsComponent,
        RazorPaySettingsComponent,
        PayStackSettingsComponent,
        OtherProviderSettingsComponent,
        StripeSettingsComponent,
        BankTransferSettingsComponent,
        BankSettingsComponent,
        SmsVerificationModalComponent,
        PersonalSettingsComponent,
        DocumentsComponent,
        TrackingToolsSettingsComponent,
        TrackingToolSectionComponent,
        MailchimpSettingsComponent,
        KlaviyoSettingsComponent,
        SendgridSettingsComponent,
        IAgeSettingsComponent,
        OngageSettingsComponent,
        YTelSettingsComponent,
        TenantManagementSettingsComponent,
        UserManagementSettingsComponent,
        SecuritySettingsComponent,
        BugsnagSettingsComponent,
        LinkedInSettingsComponent,
        FacebookSettingsComponent,
        GoogleSettingsComponent,
        DiscordSettingsComponent,
        ExternalAuthInfoComponent,
        SettingsCardComponent,
        SettingsItemComponent,
        SettingsUploaderComponent,
        AISettingsComponent,
        InvoiceSettingsComponent,
        CommissionsComponent,
        OtherSettingsComponent,
        CreditsSettingsComponent
    ],
    exports: [
    ],
    providers: [
        ImpersonationService,
        LeftMenuService,
        SettingService,
    ]
})

export class SettingModule { }