/** Core imports */
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as ngCommon from '@angular/common';

/** Thirds party imports */
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RoundProgressModule } from 'angular-svg-round-progressbar';

import { DxSelectBoxModule } from 'devextreme-angular/ui/select-box';
import { DxCheckBoxModule } from 'devextreme-angular/ui/check-box';
import { DxNumberBoxModule } from 'devextreme-angular/ui/number-box';
import { DxScrollViewModule } from 'devextreme-angular/ui/scroll-view';
import { DxTreeListModule } from 'devextreme-angular/ui/tree-list';
import { DxListModule } from 'devextreme-angular/ui/list';
import { DxButtonModule } from 'devextreme-angular/ui/button';
import { DxButtonGroupModule } from 'devextreme-angular/ui/button-group';
import { DxDataGridModule } from 'devextreme-angular/ui/data-grid';
import { DxDateBoxModule } from 'devextreme-angular/ui/date-box';
import { DxTabsModule } from 'devextreme-angular/ui/tabs';
import { DxTooltipModule } from 'devextreme-angular/ui/tooltip';
import { DxTextBoxModule } from 'devextreme-angular/ui/text-box';
import { DxValidatorModule } from 'devextreme-angular/ui/validator';
import { DxValidationGroupModule } from 'devextreme-angular/ui/validation-group';
import { DxToolbarModule } from 'devextreme-angular/ui/toolbar';
import { DxTextAreaModule } from 'devextreme-angular/ui/text-area';
import { DxContextMenuModule } from 'devextreme-angular/ui/context-menu';
import { DxRadioGroupModule } from 'devextreme-angular/ui/radio-group';
import { DxDropDownBoxModule } from 'devextreme-angular/ui/drop-down-box';
import { DxSchedulerModule } from 'devextreme-angular/ui/scheduler';
import { DxTreeViewModule } from 'devextreme-angular/ui/tree-view';
import { DxTagBoxModule } from 'devextreme-angular/ui/tag-box';
import { DxFileManagerModule } from 'devextreme-angular';

import { NgxFileDropModule } from 'ngx-file-drop';
import { ImageViewerModule } from 'ng2-image-viewer';
import { VgCoreModule, VgControlsModule, VgOverlayPlayModule, VgBufferingModule } from 'ngx-videogular';
import { NgxMaskModule } from '@node_modules/ngx-mask';
import { CKEditorModule } from 'ckeditor4-angular';

/** Application imports */
import { CommonModule } from '@shared/common/common.module';
import { CrmStoreModule } from '@app/crm/store/crm-store.module';
import { AppCommonModule } from '@app/shared/common/app-common.module';
import { ContactsService } from './contacts.service';
import { ContactsComponent } from './contacts.component';
import { DetailsHeaderComponent } from './details-header/details-header.component';
import { OperationsWidgetComponent } from './operations-widget/operations-widget.component';
import { DocumentsComponent } from './documents/documents.component';
import { NotesComponent } from './notes/notes.component';
import { NoteAddDialogComponent } from './notes/note-add-dialog/note-add-dialog.component';
import { HistoryListDialogComponent } from './orders/history-list-dialog/history-list-dialog.component';
import { AddContactDialogComponent } from './add-contact-dialog/add-contact-dialog.component';
import { AddCompanyDialogComponent } from './add-company-dialog/add-company-dialog.component';
import { EditContactDialog } from './edit-contact-dialog/edit-contact-dialog.component';
import { EditAddressDialog } from './edit-address-dialog/edit-address-dialog.component';
import { SocialsComponent } from './socials/socials.component';
import { ContactsAreaComponent } from './contacts-area/contacts-area.component';
import { AddressesComponent } from './addresses/addresses.component';
import { ClientScoresComponent } from './client-scores/client-scores.component';
import { TotalApprovedComponent } from './total-approved/total-approved.component';
import { CreditLinesComponent } from './credit-lines/credit-lines.component';
import { RequiredDocumentsComponent } from './required-documents/required-documents.component';
import { VerificationChecklistComponent } from './verification-checklist/verification-checklist.component';
import { ContactInformationComponent } from './contact-information/contact-information.component';
import { UserInformationComponent } from './user-information/user-information.component';
import { ResetPasswordDialog } from './user-information/reset-password-dialog/reset-password-dialog.component';
import { LoginAttemptsComponent } from './login-attempts/login-attempts.component';
import { LeadInformationComponent } from './lead-information/lead-information.component';
import { QuestionnaireComponent } from './questionnaire/questionnaire.component';
import { ApplicationStatusComponent } from './application-status/application-status.component';
import { ReferralHistoryComponent } from './referral-history/referral-history.component';
import { PaymentInformationComponent } from './payment-information/payment-information.component';
import { SubscriptionsComponent } from './subscriptions/subscriptions.component';
import { ActivityLogsComponent } from './activity-logs/activity-logs.component';
import { PersonDialogComponent } from './person-dialog/person-dialog.component';
import { PersonInfoComponent } from './person-info/person-info.component';
import { UserInboxComponent } from './user-inbox/user-inbox.component';
import { MergeContactDialogComponent } from './merge-contact-dialog/merge-contact-dialog.component';
import { ContactPersonsDialogComponent } from './contact-persons-dialog/contact-persons-dialog.component';
import { TemplateDocumentsDialogComponent } from './documents/template-documents-dialog/template-documents-dialog.component';
import { DocumentTypesListComponent } from './document-types-list/document-types-list.component';
import { PermissionTreeComponent } from './permission-tree/permission-tree.component';
import { ContactsRoutingModule } from './contacts-routing.module';
import { FeaturesModule } from '@app/shared/features/features.module';
import {
    ContactServiceProxy,
    MemberServiceProxy,
    OrganizationContactServiceProxy,
    DocumentServiceProxy,
    PersonOrgRelationServiceProxy,
    PersonContactServiceProxy,
    DocumentTypeServiceProxy,
    EmailTemplateServiceProxy,
    ContactCommunicationServiceProxy,
    PartnerServiceProxy,
    PartnerTypeServiceProxy,
    NotesServiceProxy,
    OrderSubscriptionServiceProxy,
    CustomerServiceProxy,
    ContactPhotoServiceProxy,
    PropertyServiceProxy,
    ContactUserServiceProxy,
    PreferencesServiceProxy
} from '@shared/service-proxies/service-proxies';
import { NameParserService } from '@shared/common/name-parser/name-parser.service';
import { PipelineModule } from '@app/shared/pipeline/pipeline.module';
import { CompanyDialogComponent } from './company-dialog/company-dialog.component';
import { RelationCompaniesDialogComponent } from './relation-companies-dialog/relation-companies-dialog.component';
import { ContactListDialogComponent } from './contact-list-dialog/contact-list-dialog.component';
import { DialogService } from '@app/shared/common/dialogs/dialog.service';
import { ItemDetailsLayoutModule } from '@shared/common/item-details-layout/item-details-layout.module';
import { NotSupportedTypeDialogComponent } from '@app/crm/contacts/documents/not-supported-type-dialog/not-supported-type-dialog.component';
import { DocumentsService } from '@app/crm/contacts/documents/documents.service';
import { OrdersComponent } from '@app/crm/contacts/orders/orders.component';
import { InvoicesComponent } from '@app/crm/contacts/invoices/invoices.component';
import { MarkAsPaidDialogComponent } from '@app/crm/contacts/invoices/mark-paid-dialog/mark-paid-dialog.component';
import { InvoicesService } from '@app/crm/contacts/invoices/invoices.service';
import { PersonalDetailsComponent } from './personal-details/personal-details.component';
import { PersonalDetailsService } from './personal-details/personal-details.service';
import { PersonalDetailsDialogComponent } from './personal-details/personal-details-dialog/personal-details-dialog.component';
import { BankCodeLettersModule } from '@app/shared/common/bank-code-letters/bank-code-letters.module';
import { SMSDialogComponent } from '@app/crm/shared/sms-dialog/sms-dialog.component';
import { InvoiceSettingsDialogComponent } from './invoice-settings-dialog/invoice-settings-dialog.component';
import { EmailTemplateDialogComponent } from '@app/crm/shared/email-template-dialog/email-template-dialog.component';
import { EmailTemplateSelectorComponent } from '@app/crm/shared/email-template-dialog/email-template-selector/email-template-selector.component';
import { ContactGroupTemplatesComponent } from '@app/crm/shared/email-template-dialog/contact-group-templates/contact-group-templates.component';
import { CrmService } from '@app/crm/crm.service';
import { AddSubscriptionDialogComponent } from './subscriptions/add-subscription-dialog/add-subscription-dialog.component';
import { CancelSubscriptionDialogComponent } from './subscriptions/cancel-subscription-dialog/cancel-subscription-dialog.component';
import { OrderDropdownModule } from '@app/crm/shared/order-dropdown/order-dropfown.module';
import { ActionMenuModule } from '@app/shared/common/action-menu/action-menu.module';
import { SourceContactListModule } from '@shared/common/source-contact-list/source-contact-list.module';
import { StaticListModule } from '@app/shared/common/static-list/static-list.module';
import { CreateEntityModule } from '@shared/common/create-entity-dialog/create-entity.module';
import { CountryPhoneNumberModule } from '@shared/common/phone-numbers/country-phone-number.module';
import { ModalDialogModule } from '@shared/common/dialogs/modal/modal-dialog.module';
import { RatingBarModule } from '@app/shared/common/rating-bar/rating-bar.module';
import { ListsModule } from '@app/shared/common/lists/lists.module';
import { OrgUnitsTreeModule } from '@shared/common/organization-units-tree/organization-units-tree.module';
import { InvoiceGridMenuModule } from '@app/crm/invoices/invoice-grid-menu/invoice-grid-menu.module'
import { CreateInvoiceDialogComponent } from '@app/crm/shared/create-invoice-dialog/create-invoice-dialog.component';
import { LeadRelatedContactsComponent } from './lead-related-contacts/lead-related-contacts.component';
import { ResellerActivityComponent } from './reseller-activity/reseller-activity.component';
import { AddProductDialogComponent, FilterAssignmentsPipe } from './subscriptions/add-subscription-dialog/add-product-dialog/add-product-dialog.component';
import { CreateProductDialogComponent } from './subscriptions/add-subscription-dialog/create-product-dialog/create-product-dialog.component';
import { AddMemberServiceDialogComponent } from './subscriptions/add-subscription-dialog/add-member-service-dialog/add-member-service-dialog.component';
import { CustomerListDialogComponent } from '@app/crm/shared/create-invoice-dialog/customer-list-dialog/customer-list-dialog.component';
import { AffiliateHistoryDialogComponent } from './personal-details/personal-details-dialog/affiliate-history-dialog/affiliate-history-dialog.component';
import { PersonHistoryDialogComponent } from './personal-details/personal-details-dialog/person-history-dialog/person-history-dialog.component';
import { GooglePlaceModule } from '@node_modules/ngx-google-places-autocomplete';
import { PropertyInformationComponent } from '@app/crm/contacts/property-information/property-information.component';
import { CreateActivityDialogComponent } from '@app/crm/activity/create-activity-dialog/create-activity-dialog.component';
import { PaymentsInfoService } from '@app/shared/common/payments-info/payments-info.service';
import { ContactPaymentsInfoService } from './payment-information/payments-info.service';

@NgModule({
    declarations: [
        NotesComponent,
        EditContactDialog,
        EditAddressDialog,
        ContactsComponent,
        ResetPasswordDialog,
        DetailsHeaderComponent,
        ClientScoresComponent,
        SocialsComponent,
        ContactsAreaComponent,
        AddressesComponent,
        ClientScoresComponent,
        TotalApprovedComponent,
        CreditLinesComponent,
        ContactInformationComponent,
        UserInformationComponent,
        LoginAttemptsComponent,
        LeadInformationComponent,
        QuestionnaireComponent,
        RequiredDocumentsComponent,
        ApplicationStatusComponent,
        ReferralHistoryComponent,
        PaymentInformationComponent,
        SubscriptionsComponent,
        ActivityLogsComponent,
        VerificationChecklistComponent,
        OperationsWidgetComponent,
        PersonDialogComponent,
        PersonInfoComponent,
        ContactPersonsDialogComponent,
        NoteAddDialogComponent,
        DocumentsComponent,
        DocumentTypesListComponent,
        PermissionTreeComponent,
        AddContactDialogComponent,
        AddCompanyDialogComponent,
        CompanyDialogComponent,
        RelationCompaniesDialogComponent,
        ContactListDialogComponent,
        NotSupportedTypeDialogComponent,
        EmailTemplateDialogComponent,
        ContactGroupTemplatesComponent,
        EmailTemplateSelectorComponent,
        InvoiceSettingsDialogComponent,
        HistoryListDialogComponent,
        UserInboxComponent,
        OrdersComponent,
        InvoicesComponent,
        PersonalDetailsComponent,
        PersonalDetailsDialogComponent,
        SMSDialogComponent,
        AddSubscriptionDialogComponent,
        CancelSubscriptionDialogComponent,
        MergeContactDialogComponent,
        MarkAsPaidDialogComponent,
        CreateInvoiceDialogComponent,
        LeadRelatedContactsComponent,
        AddProductDialogComponent,
        CreateProductDialogComponent,
        FilterAssignmentsPipe,
        AddMemberServiceDialogComponent,
        TemplateDocumentsDialogComponent,
        AffiliateHistoryDialogComponent,
        PersonHistoryDialogComponent,
        CustomerListDialogComponent,
        PropertyInformationComponent,
        ResellerActivityComponent,
        CreateActivityDialogComponent
    ],
    imports: [
        FormsModule,
        CommonModule,
        ngCommon.CommonModule,
        CrmStoreModule,
        AppCommonModule,
        StaticListModule,
        MatProgressBarModule,
        MatTabsModule,
        MatDialogModule,
        MatProgressSpinnerModule,
        MatSelectModule,
        MatInputModule,
        ContactsRoutingModule,
        DxContextMenuModule,
        DxSelectBoxModule,
        DxCheckBoxModule,
        DxButtonModule,
        DxButtonGroupModule,
        DxTextBoxModule,
        DxValidatorModule,
        DxValidationGroupModule,
        DxNumberBoxModule,
        DxScrollViewModule,
        DxToolbarModule,
        DxDataGridModule,
        DxTextAreaModule,
        DxDateBoxModule,
        DxTooltipModule,
        DxListModule,
        DxFileManagerModule,
        DxTreeListModule,
        DxTreeViewModule,
        DxTagBoxModule,
        DxTabsModule,
        RoundProgressModule,
        PipelineModule,
        DxRadioGroupModule,
        NgxFileDropModule,
        ImageViewerModule,
        DxDropDownBoxModule,
        DxSchedulerModule,
        VgCoreModule,
        VgControlsModule,
        VgOverlayPlayModule,
        VgBufferingModule,
        NgxMaskModule.forRoot(),
        ItemDetailsLayoutModule,
        BankCodeLettersModule,
        CKEditorModule,
        OrderDropdownModule,
        ActionMenuModule,
        SourceContactListModule,
        CreateEntityModule,
        CountryPhoneNumberModule,
        ModalDialogModule,
        RatingBarModule,
        ListsModule,
        OrgUnitsTreeModule,
        MatExpansionModule,
        GooglePlaceModule,
        MatTooltipModule,
        FeaturesModule,
        InvoiceGridMenuModule
    ],
    entryComponents: [
        CreateActivityDialogComponent,
        CreateInvoiceDialogComponent,
        EditContactDialog,
        EditAddressDialog,
        ResetPasswordDialog,
        CompanyDialogComponent,
        PersonDialogComponent,
        ContactPersonsDialogComponent,
        AddContactDialogComponent,
        AddCompanyDialogComponent,
        NoteAddDialogComponent,
        RelationCompaniesDialogComponent,
        NotSupportedTypeDialogComponent,
        InvoiceSettingsDialogComponent,
        EmailTemplateDialogComponent,
        HistoryListDialogComponent,
        PersonalDetailsDialogComponent,
        SMSDialogComponent,
        AddSubscriptionDialogComponent,
        CancelSubscriptionDialogComponent,
        MergeContactDialogComponent,
        MarkAsPaidDialogComponent,
        AddProductDialogComponent,
        CreateProductDialogComponent,
        AddMemberServiceDialogComponent,
        TemplateDocumentsDialogComponent,
        AffiliateHistoryDialogComponent,
        PersonHistoryDialogComponent,
        CustomerListDialogComponent
    ],
    providers: [
        DialogService,
        ContactsService,
        ContactPhotoServiceProxy,
        ContactServiceProxy,
        CustomerServiceProxy,
        PartnerServiceProxy,
        PartnerTypeServiceProxy,
        PersonOrgRelationServiceProxy,
        MemberServiceProxy,
        OrganizationContactServiceProxy,
        PersonContactServiceProxy,
        NameParserService,
        NotesServiceProxy,
        DocumentServiceProxy,
        DocumentTypeServiceProxy,
        OrderSubscriptionServiceProxy,
        ContactCommunicationServiceProxy,
        EmailTemplateServiceProxy,
        PropertyServiceProxy,
        ContactUserServiceProxy,
        PreferencesServiceProxy,
        PersonalDetailsService,
        DocumentsService,
        InvoicesService,
        CrmService,
        { provide: PaymentsInfoService, useClass: ContactPaymentsInfoService }
    ],
    exports: [
        ContactGroupTemplatesComponent,
        EmailTemplateSelectorComponent,
        CreateActivityDialogComponent
    ]
})
export class ContactsModule {}