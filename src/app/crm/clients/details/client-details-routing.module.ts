import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { ClientDetailsComponent } from './client-details.component';
import { DocumentsComponent } from './documents/documents.component';
import { ContactInformationComponent } from './contact-information/contact-information.component';
import { LeadInformationComponent } from './lead-information/lead-information.component';
import { QuestionnaireComponent } from './questionnaire/questionnaire.component';
import { ApplicationStatusComponent } from './application-status/application-status.component';
import { ReferralHistoryComponent } from './referral-history/referral-history.component';
import { PaymentInformationComponent } from './payment-information/payment-information.component';
import { ActivityLogsComponent } from './activity-logs/activity-logs.component';
import { NotesComponent } from './notes/notes.component';

export class ClientDetailsChildRoutes {
    static leadChildRoutes = [
        {path: '', redirectTo: 'contact-information', pathMatch: 'full' },
        {path: 'contact-information', component: ContactInformationComponent },
        {path: 'lead-information', component: LeadInformationComponent },
        {path: 'questionnaire', component: QuestionnaireComponent },
        {path: 'documents', component: DocumentsComponent, data: {rightPanelOpened: false} },
        {path: 'referral-history', component: ReferralHistoryComponent },
        {path: 'activity-logs', component: ActivityLogsComponent },
        {path: 'notes', component: NotesComponent }
    ];

    static clientChildRoutes = ClientDetailsChildRoutes.leadChildRoutes.concat([
        {path: 'application-status', component: ApplicationStatusComponent },
        {path: 'payment-information', component: PaymentInformationComponent }
    ])
}

@NgModule({
    imports: [
        RouterModule.forChild([
            {
                path: 'client/:clientId',
                component: ClientDetailsComponent,
                children: ClientDetailsChildRoutes.clientChildRoutes
            },
            {
                path: 'client/:clientId/lead/:leadId',
                component: ClientDetailsComponent,
                children: ClientDetailsChildRoutes.leadChildRoutes
            }
        ])
    ],
    exports: [
        RouterModule
    ]
})
export class ClientDetailsRoutingModule { }