/** Core imports */
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as ngCommon from '@angular/common';

/** Thirds party imports */
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { AngularGooglePlaceModule } from 'angular-google-place';
import { RoundProgressModule } from 'angular-svg-round-progressbar';

import { DxSelectBoxModule } from 'devextreme-angular/ui/select-box';
import { DxCheckBoxModule } from 'devextreme-angular/ui/check-box';
import { DxNumberBoxModule } from 'devextreme-angular/ui/number-box';
import { DxScrollViewModule } from 'devextreme-angular/ui/scroll-view';
import { DxTreeListModule } from 'devextreme-angular/ui/tree-list';
import { DxListModule } from 'devextreme-angular/ui/list';
import { DxButtonModule } from 'devextreme-angular/ui/button';
import { DxDataGridModule } from 'devextreme-angular/ui/data-grid';
import { DxDateBoxModule } from 'devextreme-angular/ui/date-box';
import { DxTooltipModule } from 'devextreme-angular/ui/tooltip';
import { DxTextBoxModule } from 'devextreme-angular/ui/text-box';
import { DxValidatorModule } from 'devextreme-angular/ui/validator';
import { DxValidationGroupModule } from 'devextreme-angular/ui/validation-group';
import { DxToolbarModule } from 'devextreme-angular/ui/toolbar';
import { DxTextAreaModule } from 'devextreme-angular/ui/text-area';
import { DxContextMenuModule } from 'devextreme-angular/ui/context-menu';
import { DxRadioGroupModule } from 'devextreme-angular/ui/radio-group';
import { DxDropDownBoxModule } from 'devextreme-angular/ui/drop-down-box';
import { DxTreeViewModule } from 'devextreme-angular/ui/tree-view';
import { DxTagBoxModule } from 'devextreme-angular/ui/tag-box';

import { FileDropModule } from 'ngx-file-drop';
import { ImageViewerModule } from 'ng2-image-viewer';
import { VgCoreModule } from 'videogular2/core';
import { VgControlsModule } from 'videogular2/controls';
import { VgOverlayPlayModule } from 'videogular2/overlay-play';
import { VgBufferingModule } from 'videogular2/buffering';
import { NgxMaskModule } from '@node_modules/ngx-mask';
import { CKEditorModule } from 'ckeditor4-angular';

/** Application imports */
import { CommonModule } from '@shared/common/common.module';
import { AppCommonModule } from '@app/shared/common/app-common.module';
import { ContactsService } from './contacts.service';
import { ContactsComponent } from './contacts.component';
import { DetailsHeaderComponent } from './details-header/details-header.component';
import { OperationsWidgetComponent } from './operations-widget.component';
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
import { LoginAttempsComponent } from './login-attemps/login-attemps.component';
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
import { SimilarCustomersDialogComponent } from '@app/crm/shared/similar-customers-dialog/similar-customers-dialog.component';
import { ContactPersonsDialogComponent } from './contact-persons-dialog/contact-persons-dialog.component';
import { UploadDocumentDialogComponent } from './upload-document-dialog/upload-document-dialog.component';
import { UploadDocumentsDialogComponent } from './documents/upload-documents-dialog/upload-documents-dialog.component';
import { DocumentTypesListComponent } from './document-types-list/document-types-list.component';
import { OrganizationUnitsTreeComponent } from './organization-units-tree/organization-units-tree.component';
import { PermissionTreeComponent } from './permission-tree/permission-tree.component';
import { ContactsRoutingModule } from './contacts-routing.module';
import {
    ContactServiceProxy, MemberServiceProxy, OrganizationContactServiceProxy, DocumentServiceProxy,
    PersonOrgRelationServiceProxy, PersonContactServiceProxy, DocumentTypeServiceProxy, ContactCommunicationServiceProxy,
    PartnerServiceProxy, PartnerTypeServiceProxy, NotesServiceProxy, OrderSubscriptionServiceProxy, CustomerServiceProxy
} from '@shared/service-proxies/service-proxies';
import { NameParserService } from '@app/crm/shared/name-parser/name-parser.service';
import { PipelineModule } from '@app/shared/pipeline/pipeline.module';
import { CompanyDialogComponent } from './company-dialog/company-dialog.component';
import { RelationCompaniesDialogComponent } from './relation-companies-dialog/relation-companies-dialog.component';
import { ContactListDialogComponent } from './contact-list-dialog/contact-list-dialog.component';
import { DialogService } from '@app/shared/common/dialogs/dialog.service';
import { ItemDetailsLayoutModule } from '@shared/common/item-details-layout/item-details-layout.module';
import { CreateClientDialogComponent } from '@app/crm/shared/create-client-dialog/create-client-dialog.component';
import { NotSupportedTypeDialogComponent } from '@app/crm/contacts/documents/not-supported-type-dialog/not-supported-type-dialog.component';
import { DocumentsService } from '@app/crm/contacts/documents/documents.service';
import { OrdersComponent } from '@app/crm/contacts/orders/orders.component';
import { InvoicesComponent } from '@app/crm/contacts/invoices/invoices.component';
import { InvoicesService } from '@app/crm/contacts/invoices/invoices.service';
import { PersonalDetailsComponent } from './personal-details/personal-details.component';
import { CRMDashboardWidgetsModule } from '@shared/crm/dashboard-widgets/dashboard-widgets.module';
import { BankCodeLettersModule } from '@app/shared/common/bank-code-letters/bank-code-letters.module';
import { SMSDialogComponent } from '@app/crm/shared/sms-dialog/sms-dialog.component';
import { InvoiceSettingsDialogComponent } from './invoice-settings-dialog/invoice-settings-dialog.component';
import { EmailTemplateDialogComponent } from '@app/crm/shared/email-template-dialog/email-template-dialog.component';

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
        LoginAttempsComponent,
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
        SimilarCustomersDialogComponent,
        NoteAddDialogComponent,
        DocumentsComponent,
        UploadDocumentDialogComponent,
        UploadDocumentsDialogComponent,
        DocumentTypesListComponent,
        OrganizationUnitsTreeComponent,
        PermissionTreeComponent,
        AddContactDialogComponent,
        AddCompanyDialogComponent,
        CompanyDialogComponent,
        RelationCompaniesDialogComponent,
        CreateClientDialogComponent,
        ContactListDialogComponent,
        NotSupportedTypeDialogComponent,
        EmailTemplateDialogComponent,
        InvoiceSettingsDialogComponent,
        HistoryListDialogComponent,
        UserInboxComponent,
        OrdersComponent,
        InvoicesComponent,
        PersonalDetailsComponent,
        SMSDialogComponent
    ],
    imports: [
        FormsModule,
        CommonModule,
        ngCommon.CommonModule,
        AppCommonModule,
        MatProgressBarModule,
        MatTabsModule,
        MatDialogModule,
        MatProgressSpinnerModule,
        MatSelectModule,
        ContactsRoutingModule,
        AngularGooglePlaceModule,
        DxContextMenuModule,
        DxSelectBoxModule,
        DxCheckBoxModule,
        DxButtonModule,
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
        DxTreeListModule,
        DxTreeViewModule,
        DxTagBoxModule,
        RoundProgressModule,
        PipelineModule,
        DxRadioGroupModule,
        FileDropModule,
        ImageViewerModule,
        DxDropDownBoxModule,
        VgCoreModule,
        VgControlsModule,
        VgOverlayPlayModule,
        VgBufferingModule,
        NgxMaskModule.forRoot(),
        ItemDetailsLayoutModule,
        CRMDashboardWidgetsModule,
        BankCodeLettersModule,
        CKEditorModule
    ],
    entryComponents: [
        EditContactDialog,
        EditAddressDialog,
        ResetPasswordDialog,
        CompanyDialogComponent,
        PersonDialogComponent,
        ContactPersonsDialogComponent,
        SimilarCustomersDialogComponent,
        UploadDocumentDialogComponent,
        UploadDocumentsDialogComponent,
        AddContactDialogComponent,
        AddCompanyDialogComponent,
        NoteAddDialogComponent,
        RelationCompaniesDialogComponent,
        CreateClientDialogComponent,
        NotSupportedTypeDialogComponent,
        InvoiceSettingsDialogComponent,
        EmailTemplateDialogComponent,
        HistoryListDialogComponent,
        SMSDialogComponent
    ],
    providers: [
        DialogService,
        ContactsService,
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
        DocumentsService,
        InvoicesService
    ]
})
export class ContactsModule {}
