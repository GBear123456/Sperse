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
         DxValidatorModule, DxValidationGroupModule, DxToolbarModule, DxTextAreaModule,
         DxRadioGroupModule, DxDropDownBoxModule, DxTreeViewModule } from 'devextreme-angular';
import { FileDropModule } from 'ngx-file-drop';
import { ImageViewerModule } from 'ng2-image-viewer';
import { VgCoreModule } from 'videogular2/core';
import { VgControlsModule } from 'videogular2/controls';
import { VgOverlayPlayModule } from 'videogular2/overlay-play';
import { VgBufferingModule } from 'videogular2/buffering';

/** Application imports */
import { ClientDetailsService } from './client-details.service';
import { ClientDetailsComponent } from './client-details.component';
import { DetailsHeaderComponent } from './details-header.component';
import { OperationsWidgetComponent } from './operations-widget.component';
import { DocumentsComponent } from './documents/documents.component';
import { NotesComponent } from './notes/notes.component';
import { NoteAddComponent } from './notes/note-add/note-add.component';
import { EditContactDialog } from './edit-contact-dialog/edit-contact-dialog.component';
import { EditAddressDialog } from './edit-address-dialog/edit-address-dialog.component';
import { SocialsComponent } from './socials/socials.component';
import { ContactsComponent } from './contacts/contacts.component';
import { AddressesComponent } from './addresses/addresses.component';
import { EmploymentComponent } from './employment/employment.component';
import { ClientScoresComponent } from './client-scores/client-scores.component';
import { TotalApprovedComponent } from './total-approved/total-approved.component';
import { CreditLinesComponent } from './credit-lines/credit-lines.component';
import { RequiredDocumentsComponent } from './required-documents/required-documents.component';
import { VerificationChecklistComponent } from './verification-checklist/verification-checklist.component';
import { ContactInformationComponent } from './contact-information/contact-information.component';
import { UserInformationComponent } from './user-information/user-information.component';
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
import { SimilarCustomersDialogComponent } from '@app/crm/shared/similar-customers-dialog/similar-customers-dialog.component';
import { ContactPersonsDialogComponent } from './contact-persons-dialog/contact-persons-dialog.component';
import { UploadDocumentDialogComponent } from './upload-document-dialog/upload-document-dialog.component';
import { DocumentTypesListComponent } from './document-types-list/document-types-list.component';
import { OrganizationUnitsTreeComponent } from './organization-units-tree/organization-units-tree.component';
import { PermissionTreeComponent } from './permission-tree/permission-tree.component';
import { ClientDetailsRoutingModule } from './client-details-routing.module';
import { ContactGroupServiceProxy, ContactEmailServiceProxy, ContactAddressServiceProxy,
    ContactPhoneServiceProxy, MemberServiceProxy, ContactLinkServiceProxy, OrganizationContactServiceProxy,
    OrganizationTypeServiceProxy, ContactEmploymentServiceProxy, PersonContactServiceProxy,
    PartnerServiceProxy, PartnerTypeServiceProxy } from '@shared/service-proxies/service-proxies';
import { NameParserService } from '@app/crm/shared/name-parser/name-parser.service';
import { PipelineModule } from '@app/shared/pipeline/pipeline.module';
import { LeadCancelDialogComponent } from '@app/shared/pipeline/confirm-cancellation-dialog/confirm-cancellation-dialog.component';
import { AdvancedListComponent } from '@app/crm/shared/advanced-list/advanced-list.component';

@NgModule({
  declarations: [
    NotesComponent,
    EditContactDialog,
    EditAddressDialog,
    ClientDetailsComponent,
    DetailsHeaderComponent,
    ClientScoresComponent,
    SocialsComponent,
    ContactsComponent,
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
    ContactPersonsDialogComponent,
    SimilarCustomersDialogComponent,
    NoteAddComponent,
    AdvancedListComponent,
    DocumentsComponent,
    UploadDocumentDialogComponent,
    DocumentTypesListComponent,
    OrganizationUnitsTreeComponent,
    PermissionTreeComponent
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
    ClientDetailsRoutingModule,
    AngularGooglePlaceModule,
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
  exports: [
    ClientDetailsComponent,
    ContactInformationComponent,
    RequiredDocumentsComponent,
    AdvancedListComponent,
    DocumentTypesListComponent
  ],
  entryComponents: [
    EditContactDialog,
    EditAddressDialog,
    OrganizationDialogComponent,
    PersonDialogComponent,
    ContactPersonsDialogComponent,
    SimilarCustomersDialogComponent,
    NoteAddComponent,
    LeadCancelDialogComponent,
    UploadDocumentDialogComponent
  ],
  bootstrap: [
    ClientDetailsComponent
  ],
  providers: [
    ClientDetailsService,
    ContactAddressServiceProxy,
    ContactEmailServiceProxy,
    ContactPhoneServiceProxy,
    ContactLinkServiceProxy,
    ContactGroupServiceProxy,
    PartnerServiceProxy,
    PartnerTypeServiceProxy,
    ContactEmploymentServiceProxy,
    MemberServiceProxy,
    OrganizationContactServiceProxy,
    OrganizationTypeServiceProxy,
    PersonContactServiceProxy,
    NameParserService
  ]
})
export class ClientDetailsModule { }
