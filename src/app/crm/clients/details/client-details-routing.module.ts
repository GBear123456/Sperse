import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { ClientDetailsComponent } from './client-details.component';
import { RequiredDocumentsComponent } from './required-documents/required-documents.component';
import { ContactInformationComponent } from './contact-information/contact-information.component';
import { LeadInformationComponent } from './lead-information/lead-information.component';
import { QuestionnaireComponent } from './questionnaire/questionnaire.component';
import { ApplicationStatusComponent } from './application-status/application-status.component';
import { ReferalHistoryComponent } from './referal-history/referal-history.component';
import { PaymentInformationComponent } from './payment-information/payment-information.component';
import { ActivityLogsComponent } from './activity-logs/activity-logs.component';
import { NotesComponent } from './notes/notes.component';

@NgModule({
    imports: [
        RouterModule.forChild([
            {
                path: 'client/:clientId',
                component: ClientDetailsComponent,
                children: [
                  {path: '', redirectTo: 'contact-information', pathMatch: 'full' },
                  {path: 'contact-information', component: ContactInformationComponent },
                  {path: 'lead-information', component: LeadInformationComponent },
                  {path: 'questionnaire', component: QuestionnaireComponent },
                  {path: 'required-documents', component: RequiredDocumentsComponent },
                  {path: 'application-status', component: ApplicationStatusComponent },
                  {path: 'referal-history', component: ReferalHistoryComponent },
                  {path: 'payment-information', component: PaymentInformationComponent },
                  {path: 'activity-logs', component: ActivityLogsComponent },
                  {path: 'notes', component: NotesComponent }
                ]
            },
            {
                path: 'client/:clientId/lead/:leadId',
                component: ClientDetailsComponent,
                children: [
                  {path: '', redirectTo: 'contact-information', pathMatch: 'full' },
                  {path: 'contact-information', component: ContactInformationComponent },
                  {path: 'lead-information', component: LeadInformationComponent },
                  {path: 'questionnaire', component: QuestionnaireComponent },
                  {path: 'required-documents', component: RequiredDocumentsComponent },
                  {path: 'application-status', component: ApplicationStatusComponent },
                  {path: 'referal-history', component: ReferalHistoryComponent },
                  {path: 'payment-information', component: PaymentInformationComponent },
                  {path: 'activity-logs', component: ActivityLogsComponent },
                  {path: 'notes', component: NotesComponent }
                ]
            }
        ])
    ],
    exports: [
        RouterModule
    ]
})
export class ClientDetailsRoutingModule { }
