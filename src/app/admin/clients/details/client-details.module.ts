import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { MdSidenavModule, MdProgressBarModule, MdTabsModule, MdDialogModule, 
  MdDialogRef, MdProgressSpinnerModule, MdSelectModule } from '@angular/material';

import { RouterModule, Routes } from '@angular/router';

import { ClientDetailsComponent } from './client-details.component';
import { DetailsHeaderComponent } from './details-header.component';
import { OperationsWidgetComponent } from './operations-widget.component'; 

import { SocialsComponent } from './socials/socials.component';
import { OthersComponent } from './others/others.component';
import { ContactsComponent } from './contacts/contacts.component';
import { AddressesComponent } from './addresses/addresses.component';
import { ClientScoresComponent } from './client-scores/client-scores.component';
import { TotalApprovedComponent } from './total-approved/total-approved.component';
import { CreditLinesComponent } from './credit-lines/credit-lines.component';
import { RequiredDocumentsComponent } from './required-documents/required-documents.component';
import { ContactInformationComponent } from './contact-information/contact-information.component';

import { ClientDetailsRoutingModule } from './client-details-routing.module';

/** Services */

@NgModule({
  declarations: [
    ClientDetailsComponent,
    DetailsHeaderComponent,
    ClientScoresComponent,
    OthersComponent,
    SocialsComponent,
    ContactsComponent,
    AddressesComponent,
    ClientScoresComponent,
    TotalApprovedComponent,
    CreditLinesComponent,
    ContactInformationComponent,
    RequiredDocumentsComponent,
    OperationsWidgetComponent
  ],
  imports: [
    FormsModule,
    CommonModule,
    MdSidenavModule,
    MdProgressBarModule,
    MdTabsModule,
    MdDialogModule,
    MdProgressSpinnerModule,
    MdSelectModule,
    ClientDetailsRoutingModule
  ],
  exports: [
    ClientDetailsComponent,
    ContactInformationComponent,
    RequiredDocumentsComponent
  ],
  bootstrap: [
    ClientDetailsComponent
  ],
  providers: []
})
export class ClientDetailsModule { }
