import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { ClientDetailsComponent } from './client-details.component';
import { DocumentsComponent } from './documents/documents.component';
import { ContactInformationComponent } from './contact-information/contact-information.component';
import { LeadInformationComponent } from './lead-information/lead-information.component';
import { QuestionnaireComponent } from './questionnaire/questionnaire.component';
import { ApplicationStatusComponent } from './application-status/application-status.component';
import { ReferalHistoryComponent } from './referal-history/referal-history.component';
import { PaymentInformationComponent } from './payment-information/payment-information.component';
import { ActivityLogsComponent } from './activity-logs/activity-logs.component';
import { NotesComponent } from './notes/notes.component';

let childRouters = [
    {path: '', redirectTo: 'contact-information', pathMatch: 'full' },
    {path: 'contact-information', component: ContactInformationComponent },
    {path: 'lead-information', component: LeadInformationComponent },
    {path: 'questionnaire', component: QuestionnaireComponent },
    {path: 'documents', component: DocumentsComponent, data: {rightPanelOpened: false} },
    {path: 'referal-history', component: ReferalHistoryComponent },
    {path: 'activity-logs', component: ActivityLogsComponent },
    {path: 'notes', component: NotesComponent }
];

@NgModule({
    imports: [
        RouterModule.forChild([
            {
                path: 'client/:clientId',
                component: ClientDetailsComponent,
                children: childRouters.concat([
                    {path: 'payment-information', component: PaymentInformationComponent },
                    {path: 'application-status', component: ApplicationStatusComponent }
                ])
            },
            {
                path: 'client/:clientId/lead/:leadId',
                component: ClientDetailsComponent,
                children: childRouters
            }
        ])
    ],
    exports: [
        RouterModule
    ]
})
export class ClientDetailsRoutingModule { }