import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AppCommonModule } from '@app/shared/common/app-common.module';

import { MdSidenavModule, MdProgressBarModule, MdTabsModule, MdDialogModule,
  MdDialogRef, MdProgressSpinnerModule, MdSelectModule } from '@angular/material';

import { DxSelectBoxModule, DxCheckBoxModule, DxNumberBoxModule, DxScrollViewModule, DxButtonModule,
  DxTextBoxModule, DxValidatorModule, DxValidationGroupComponent, DxToolbarModule } from 'devextreme-angular';
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
import { ClientScoresComponent } from './client-scores/client-scores.component';
import { TotalApprovedComponent } from './total-approved/total-approved.component';
import { CreditLinesComponent } from './credit-lines/credit-lines.component';
import { RequiredDocumentsComponent } from './required-documents/required-documents.component';
import { ContactInformationComponent } from './contact-information/contact-information.component';

import { ClientDetailsRoutingModule } from './client-details-routing.module';
import { GooglePlaceModule } from 'ng2-google-place-autocomplete';

import { CustomersServiceProxy, ContactEmailServiceProxy, ContactAddressServiceProxy, CountryServiceProxy,
  ContactPhoneServiceProxy, MemberServiceProxy, ContactLinkServiceProxy } from '@shared/service-proxies/service-proxies';

import { PhoneFormatPipe } from './phone-format.pipe';

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
    ClientScoresComponent,
    TotalApprovedComponent,
    CreditLinesComponent,
    ContactInformationComponent,
    RequiredDocumentsComponent,
    OperationsWidgetComponent,
    DxValidationGroupComponent
  ],
  imports: [
    FormsModule,
    CommonModule,
    AppCommonModule,
    MdSidenavModule,
    MdProgressBarModule,
    MdTabsModule,
    MdDialogModule,
    MdProgressSpinnerModule,
    MdSelectModule,
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
    RoundProgressModule
  ],
  exports: [
    ClientDetailsComponent,
    ContactInformationComponent,
    RequiredDocumentsComponent
  ],
  entryComponents: [
    EditContactDialog,
    EditAddressDialog
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
    MemberServiceProxy
  ]
})
export class ClientDetailsModule { }
