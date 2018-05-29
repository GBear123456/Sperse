import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as ngCommon from '@angular/common';
import { CommonModule } from '@shared/common/common.module';
import { AppCommonModule } from '@app/shared/common/app-common.module';

import { MatSidenavModule, MatProgressBarModule, MatTabsModule, MatDialogModule,
    MatDialogRef, MatProgressSpinnerModule, MatSelectModule } from '@angular/material';

import { DxSelectBoxModule, DxCheckBoxModule, DxNumberBoxModule, DxScrollViewModule, DxTreeListModule,
    DxListModule, DxButtonModule, DxDataGridModule, DxDateBoxModule, DxTooltipModule, DxTextBoxModule, 
    DxValidatorModule, DxValidationGroupModule, DxToolbarModule, DxTextAreaModule, DxSliderModule } from 'devextreme-angular';
import { RoundProgressModule } from 'angular-svg-round-progressbar';

import { RouterModule, Routes } from '@angular/router';

import { ClientDetailsService } from './client-details.service';
import { ClientDetailsComponent } from './client-details.component';
import { DetailsHeaderComponent } from './details-header.component';
import { OperationsWidgetComponent } from './operations-widget.component';

import { StaticListComponent } from '../../shared/static-list/static-list.component';
import { TagsListComponent } from '../../shared/tags-list/tags-list.component';
import { ListsListComponent } from '../../shared/lists-list/lists-list.component';
import { UserAssignmentComponent } from '../../shared/user-assignment-list/user-assignment-list.component';
import { RatingComponent } from '../../shared/rating/rating.component';
import { StarsListComponent } from '../../shared/stars-list/stars-list.component';

import { NotesComponent } from './notes/notes.component';
import { NoteAddDialogComponent } from './notes/note-add-dialog/note-add-dialog.component';
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
import { LeadInformationComponent } from './lead-information/lead-information.component';
import { QuestionnaireComponent } from './questionnaire/questionnaire.component';
import { ApplicationStatusComponent } from './application-status/application-status.component';
import { ReferalHistoryComponent } from './referal-history/referal-history.component';
import { PaymentInformationComponent } from './payment-information/payment-information.component';
import { ActivityLogsComponent } from './activity-logs/activity-logs.component';
import { OrganizationDialogComponent } from './organization-dialog/organization-dialog.component';
import { PersonDialogComponent } from './person-dialog/person-dialog.component';
import { SimilarCustomersDialogComponent } from '@app/crm/shared/similar-customers-dialog/similar-customers-dialog.component';
import { UploadPhotoDialogComponent } from '@app/crm/shared/upload-photo-dialog/upload-photo-dialog.component';
import { ImageCropperModule } from 'ng2-img-cropper';
import { ContactPersonsDialogComponent } from './contact-persons-dialog/contact-persons-dialog.component';

import { ClientDetailsRoutingModule } from './client-details-routing.module';
import { GooglePlaceModule } from 'ng2-google-place-autocomplete';

import { CustomersServiceProxy, ContactEmailServiceProxy, ContactAddressServiceProxy, CountryServiceProxy,
    ContactPhoneServiceProxy, MemberServiceProxy, ContactLinkServiceProxy, OrganizationContactServiceProxy,
    OrganizationTypeServiceProxy, ContactEmploymentServiceProxy, PersonContactServiceProxy } from '@shared/service-proxies/service-proxies';

import { NameParserService } from '@app/crm/shared/name-parser/name-parser.service';
import { PipelineModule } from '@app/shared/pipeline/pipeline.module';
import { LeadCancelDialogComponent } from '@app/shared/pipeline/confirm-cancellation-dialog/confirm-cancellation-dialog.component';

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
    LeadInformationComponent,
    QuestionnaireComponent,
    RequiredDocumentsComponent,
    ApplicationStatusComponent,
    ReferalHistoryComponent,
    PaymentInformationComponent,
    ActivityLogsComponent,
    VerificationChecklistComponent,
    OperationsWidgetComponent,
    OrganizationDialogComponent,
    PersonDialogComponent,
    ContactPersonsDialogComponent,
    UploadPhotoDialogComponent,
    SimilarCustomersDialogComponent,
    NoteAddDialogComponent,
    TagsListComponent,
    ListsListComponent,
    UserAssignmentComponent,
    RatingComponent,
    StarsListComponent,
    StaticListComponent,
    StaticListComponent
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
    GooglePlaceModule,
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
    DxSliderModule,
    DxTreeListModule,
    RoundProgressModule,
    DxValidationGroupModule,
    PipelineModule,
    ImageCropperModule
  ],
  exports: [
    UploadPhotoDialogComponent,
    ClientDetailsComponent,
    ContactInformationComponent,
    RequiredDocumentsComponent,
    TagsListComponent,
    ListsListComponent,
    UserAssignmentComponent,
    RatingComponent,
    StarsListComponent,
    StaticListComponent
  ],
  entryComponents: [
    EditContactDialog,
    EditAddressDialog,
    OrganizationDialogComponent,
    PersonDialogComponent,
    ContactPersonsDialogComponent,
    UploadPhotoDialogComponent,
    SimilarCustomersDialogComponent,
    NoteAddDialogComponent,
    LeadCancelDialogComponent
  ],
  bootstrap: [
    ClientDetailsComponent
  ],
  providers: [
    ClientDetailsService,
    CountryServiceProxy,
    ContactAddressServiceProxy,
    ContactEmailServiceProxy,
    ContactPhoneServiceProxy,
    ContactLinkServiceProxy,
    CustomersServiceProxy,
    ContactEmploymentServiceProxy,
    MemberServiceProxy,
    OrganizationContactServiceProxy,
    OrganizationTypeServiceProxy,
    PersonContactServiceProxy,
    NameParserService
  ]
})
export class ClientDetailsModule { }
