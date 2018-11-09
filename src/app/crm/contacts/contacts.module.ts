/** Core imports */
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as ngCommon from '@angular/common';
import { CommonModule } from '@shared/common/common.module';
import { AppCommonModule } from '@app/shared/common/app-common.module';

/** Thirds party imports */
import { MatSidenavModule, MatProgressBarModule, MatTabsModule, MatDialogModule, MatProgressSpinnerModule, MatSelectModule } from '@angular/material';
import { AngularGooglePlaceModule } from 'angular-google-place';
import { RoundProgressModule } from 'angular-svg-round-progressbar';
import { DxSelectBoxModule, DxCheckBoxModule, DxNumberBoxModule, DxScrollViewModule, DxTreeListModule,
         DxListModule, DxButtonModule, DxDataGridModule, DxDateBoxModule, DxTooltipModule, DxTextBoxModule,
         DxValidatorModule, DxValidationGroupModule, DxToolbarModule, DxTextAreaModule, DxContextMenuModule,
         DxRadioGroupModule, DxDropDownBoxModule, DxTreeViewModule } from 'devextreme-angular';
import { FileDropModule } from 'ngx-file-drop';
import { ImageViewerModule } from 'ng2-image-viewer';
import { VgCoreModule } from 'videogular2/core';
import { VgControlsModule } from 'videogular2/controls';
import { VgOverlayPlayModule } from 'videogular2/overlay-play';
import { VgBufferingModule } from 'videogular2/buffering';

/** Application imports */
import { ContactsService } from './contacts.service';
import { ContactsComponent } from './contacts.component';
import { DetailsHeaderComponent } from './details-header.component';
import { OperationsWidgetComponent } from './operations-widget.component';
import { DocumentsComponent } from './documents/documents.component';
import { NotesComponent } from './notes/notes.component';
import { NoteAddDialogComponent } from './notes/note-add-dialog/note-add-dialog.component';
import { AddContactDialogComponent } from './add-contact-dialog/add-contact-dialog.component';
import { EditContactDialog } from './edit-contact-dialog/edit-contact-dialog.component';
import { EditAddressDialog } from './edit-address-dialog/edit-address-dialog.component';
import { SocialsComponent } from './socials/socials.component';
import { ContactsAreaComponent } from './contacts-area/contacts-area.component';
import { AddressesComponent } from './addresses/addresses.component';
import { EmploymentComponent } from './employment/employment.component';
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
import { OrganizationDialogComponent } from './organization-dialog/organization-dialog.component';
import { PersonDialogComponent } from './person-dialog/person-dialog.component';
import { PersonInfoComponent } from './person-info/person-info.component';
import { SimilarCustomersDialogComponent } from '@app/crm/shared/similar-customers-dialog/similar-customers-dialog.component';
import { ContactPersonsDialogComponent } from './contact-persons-dialog/contact-persons-dialog.component';
import { UploadDocumentDialogComponent } from './upload-document-dialog/upload-document-dialog.component';
import { UploadDocumentsDialogComponent } from './documents/upload-documents-dialog/upload-documents-dialog.component';
import { DocumentTypesListComponent } from './document-types-list/document-types-list.component';
import { OrganizationUnitsTreeComponent } from './organization-units-tree/organization-units-tree.component';
import { PermissionTreeComponent } from './permission-tree/permission-tree.component';
import { ContactsRoutingModule } from './contacts-routing.module';
import { ContactGroupServiceProxy, MemberServiceProxy, OrganizationContactServiceProxy, DocumentServiceProxy,
    ContactEmploymentServiceProxy, PersonContactServiceProxy, DocumentTypeServiceProxy,
    PartnerServiceProxy, PartnerTypeServiceProxy, NotesServiceProxy, OrderSubscriptionServiceProxy, CustomerServiceProxy } from '@shared/service-proxies/service-proxies';
import { NameParserService } from '@app/crm/shared/name-parser/name-parser.service';
import { PipelineModule } from '@app/shared/pipeline/pipeline.module';
import { LeadCancelDialogComponent } from '@app/shared/pipeline/confirm-cancellation-dialog/confirm-cancellation-dialog.component';

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
    EmploymentComponent,
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
    OrganizationDialogComponent,
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
    AddContactDialogComponent
  ],
  imports: [
    FormsModule,
    CommonModule,
    ngCommon.CommonModule,
    AppCommonModule,
    MatSidenavModule,
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
    RoundProgressModule,
    DxValidationGroupModule,
    PipelineModule,
    DxRadioGroupModule,
    FileDropModule,
    ImageViewerModule,
    DxDropDownBoxModule,
    VgCoreModule,
    VgControlsModule,
    VgOverlayPlayModule,
    VgBufferingModule
  ],
  entryComponents: [
    EditContactDialog,
    EditAddressDialog,
    ResetPasswordDialog,
    OrganizationDialogComponent,
    PersonDialogComponent,
    ContactPersonsDialogComponent,
    SimilarCustomersDialogComponent,
    LeadCancelDialogComponent,
    UploadDocumentDialogComponent,
    UploadDocumentsDialogComponent,
    AddContactDialogComponent,
    NoteAddDialogComponent
  ],
  providers: [
    ContactsService,
    ContactGroupServiceProxy,
    CustomerServiceProxy,
    PartnerServiceProxy,
    PartnerTypeServiceProxy,
    ContactEmploymentServiceProxy,
    MemberServiceProxy,
    OrganizationContactServiceProxy,
    PersonContactServiceProxy,
    NameParserService,
    NotesServiceProxy,
    DocumentServiceProxy,
    DocumentTypeServiceProxy,
    OrderSubscriptionServiceProxy
  ]
})
export class ContactsModule { }
