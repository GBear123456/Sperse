import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AppCommonModule } from '@app/shared/common/app-common.module';

import { MatSidenavModule, MatProgressBarModule, MatTabsModule, MatDialogModule,
  MatDialogRef, MatProgressSpinnerModule, MatSelectModule } from '@angular/material';

import { DxSelectBoxModule, DxCheckBoxModule, DxNumberBoxModule, DxScrollViewModule, DxButtonModule,
  DxTextBoxModule, DxValidatorModule, DxValidationGroupModule, DxToolbarModule } from 'devextreme-angular';
import { RoundProgressModule } from 'angular-svg-round-progressbar';

import { RouterModule, Routes } from '@angular/router';

import { ClientDetailsComponent } from './client-details.component';
import { DetailsHeaderComponent } from './details-header.component';
import { OperationsWidgetComponent } from './operations-widget.component';

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
import { OrganizationDialogComponent } from './organization-dialog/organization-dialog.component';
import { PersonDialogComponent } from './person-dialog/person-dialog.component';
import { SimilarCustomersDialogComponent } from './similar-customers-dialog/similar-customers-dialog.component';
import { UploadPhotoDialogComponent } from './upload-photo-dialog/upload-photo-dialog.component';
import { ImageCropperComponent } from 'ng2-img-cropper';
import { ContactPersonsDialogComponent } from './contact-persons-dialog/contact-persons-dialog.component';

import { ClientDetailsRoutingModule } from './client-details-routing.module';
import { GooglePlaceModule } from 'ng2-google-place-autocomplete';

import { CustomersServiceProxy, ContactEmailServiceProxy, ContactAddressServiceProxy, CountryServiceProxy,
  ContactPhoneServiceProxy, MemberServiceProxy, ContactLinkServiceProxy, OrganizationContactServiceProxy,
  OrganizationTypeServiceProxy, ContactEmploymentServiceProxy, PersonContactServiceProxy } from '@shared/service-proxies/service-proxies';

import { PhoneFormatPipe } from './phone-format.pipe';
import { NameParserService } from '@app/crm/shared/name-parser/name-parser.service';

@NgModule({
  declarations: [
    PhoneFormatPipe,
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
    RequiredDocumentsComponent,
    VerificationChecklistComponent,
    OperationsWidgetComponent,
    OrganizationDialogComponent,
    PersonDialogComponent,
    ContactPersonsDialogComponent,
    ImageCropperComponent,
    UploadPhotoDialogComponent,
    SimilarCustomersDialogComponent
  ],
  imports: [
    FormsModule,
    CommonModule,
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
    RoundProgressModule,
    DxValidationGroupModule
  ],
  exports: [
    UploadPhotoDialogComponent,
    ClientDetailsComponent,
    ContactInformationComponent,
    RequiredDocumentsComponent,
    PhoneFormatPipe
  ],
  entryComponents: [
    EditContactDialog,
    EditAddressDialog,
    OrganizationDialogComponent,
    PersonDialogComponent,
    ContactPersonsDialogComponent,
    UploadPhotoDialogComponent,
    SimilarCustomersDialogComponent
  ],
  bootstrap: [
    ClientDetailsComponent
  ],
  providers: [
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
