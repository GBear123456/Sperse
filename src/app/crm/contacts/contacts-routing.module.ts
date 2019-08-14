import { NgModule } from '@angular/core';
import { RouterModule, UrlMatcher } from '@angular/router';

import { ContactsComponent } from './contacts.component';
import { DocumentsComponent } from './documents/documents.component';
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
import { NotesComponent } from './notes/notes.component';
import { OrdersComponent } from './orders/orders.component';
import { InvoicesComponent } from './invoices/invoices.component';
import { PersonalDetailsComponent } from './personal-details/personal-details.component';

import { RP_USER_INFO_ID, RP_LEAD_INFO_ID } from './contacts.const';


@NgModule({
    imports: [
        RouterModule.forChild([{
            path: '',
            data: { localizationSource: 'CRM' },
            children: [
            {
                path: 'user/:userId',
                component: ContactsComponent,
                children: [
                    { path: '', redirectTo: 'contact-information', pathMatch: 'full' },
                    { path: 'contact-information', component: ContactInformationComponent },
                    { path: 'personal-details', component: PersonalDetailsComponent },
                    { path: 'user-information', component: UserInformationComponent, data: { rightPanelId: RP_USER_INFO_ID, rightPanelOpened: true } },
                    { path: 'login-attemps', component: LoginAttempsComponent, data: { rightPanelOpened: false } },
                    { path: 'lead-information', component: LeadInformationComponent, data: { rightPanelId: RP_LEAD_INFO_ID, rightPanelOpened: true } },
                    { path: 'questionnaire', component: QuestionnaireComponent },
                    { path: 'documents', component: DocumentsComponent, data: { rightPanelOpened: false } },
                    { path: 'application-status', component: ApplicationStatusComponent },
                    { path: 'referral-history', component: ReferralHistoryComponent },
                    { path: 'orders', component: OrdersComponent },
                    { path: 'invoices', component: InvoicesComponent },
                    { path: 'subscriptions', component: SubscriptionsComponent },
                    { path: 'payment-information', component: PaymentInformationComponent, data: { rightPanelOpened: false } },
                    { path: 'activity-logs', component: ActivityLogsComponent },
                    { path: 'notes', component: NotesComponent, data: { rightPanelOpened: false } }
                ]
            },
            {
                path: 'contact/:contactId',
                component: ContactsComponent,
                children: [
                    { path: '', redirectTo: 'contact-information', pathMatch: 'full' },
                    { path: 'contact-information', component: ContactInformationComponent },
                    { path: 'personal-details', component: PersonalDetailsComponent },
                    { path: 'user-information', component: UserInformationComponent, data: { rightPanelId: RP_USER_INFO_ID, rightPanelOpened: true } },
                    { path: 'login-attemps', component: LoginAttempsComponent, data: { rightPanelOpened: false } },
                    { path: 'lead-information', component: LeadInformationComponent, data: { rightPanelId: RP_LEAD_INFO_ID, rightPanelOpened: true } },
                    { path: 'questionnaire', component: QuestionnaireComponent },
                    { path: 'documents', component: DocumentsComponent, data: { rightPanelOpened: false } },
                    { path: 'application-status', component: ApplicationStatusComponent },
                    { path: 'referral-history', component: ReferralHistoryComponent },
                    { path: 'orders', component: OrdersComponent },
                    { path: 'invoices', component: InvoicesComponent },
                    { path: 'subscriptions', component: SubscriptionsComponent },
                    { path: 'payment-information', component: PaymentInformationComponent, data: { rightPanelOpened: false } },
                    { path: 'activity-logs', component: ActivityLogsComponent },
                    { path: 'notes', component: NotesComponent, data: { rightPanelOpened: false } }
                ]
            },
            {
                path: 'contact/:contactId/lead/:leadId',
                component: ContactsComponent,
                children: [
                    { path: '', redirectTo: 'contact-information', pathMatch: 'full' },
                    { path: 'contact-information', component: ContactInformationComponent },
                    { path: 'personal-details', component: PersonalDetailsComponent },
                    { path: 'user-information', component: UserInformationComponent, data: { rightPanelId: RP_USER_INFO_ID, rightPanelOpened: true } },
                    { path: 'login-attemps', component: LoginAttempsComponent, data: { rightPanelOpened: false } },
                    { path: 'lead-information', component: LeadInformationComponent, data: { rightPanelId: RP_LEAD_INFO_ID, rightPanelOpened: true } },
                    { path: 'questionnaire', component: QuestionnaireComponent },
                    { path: 'documents', component: DocumentsComponent, data: { rightPanelOpened: false } },
                    { path: 'referral-history', component: ReferralHistoryComponent },
                    { path: 'activity-logs', component: ActivityLogsComponent },
                    { path: 'notes', component: NotesComponent, data: { rightPanelOpened: false } },
                    { path: 'orders', component: OrdersComponent },
                    { path: 'invoices', component: InvoicesComponent },
                    { path: 'subscriptions', component: SubscriptionsComponent },
                    { path: 'payment-information', component: PaymentInformationComponent, data: { rightPanelOpened: false } }
                ]
            },
            {
                path: 'contact/:contactId/company/:companyId',
                component: ContactsComponent,
                children: [
                    { path: '', redirectTo: 'contact-information', pathMatch: 'full' },
                    { path: 'contact-information', component: ContactInformationComponent },
                    { path: 'personal-details', component: PersonalDetailsComponent },
                    { path: 'user-information', component: UserInformationComponent, data: { rightPanelId: RP_USER_INFO_ID, rightPanelOpened: true } },
                    { path: 'login-attemps', component: LoginAttempsComponent, data: { rightPanelOpened: false } },
                    { path: 'lead-information', component: LeadInformationComponent, data: { rightPanelId: RP_LEAD_INFO_ID, rightPanelOpened: true } },
                    { path: 'questionnaire', component: QuestionnaireComponent },
                    { path: 'documents', component: DocumentsComponent, data: { rightPanelOpened: false } },
                    { path: 'application-status', component: ApplicationStatusComponent },
                    { path: 'referral-history', component: ReferralHistoryComponent },
                    { path: 'activity-logs', component: ActivityLogsComponent },
                    { path: 'notes', component: NotesComponent, data: { rightPanelOpened: false } },
                    { path: 'orders', component: OrdersComponent },
                    { path: 'invoices', component: InvoicesComponent },
                    { path: 'subscriptions', component: SubscriptionsComponent },
                    { path: 'payment-information', component: PaymentInformationComponent, data: { rightPanelOpened: false } }
                ]
            },
            {
                path: 'contact/:contactId/lead/:leadId/company/:companyId',
                component: ContactsComponent,
                children: [
                    { path: '', redirectTo: 'contact-information', pathMatch: 'full' },
                    { path: 'contact-information', component: ContactInformationComponent },
                    { path: 'personal-details', component: PersonalDetailsComponent },
                    { path: 'user-information', component: UserInformationComponent, data: { rightPanelId: RP_USER_INFO_ID, rightPanelOpened: true } },
                    { path: 'login-attemps', component: LoginAttempsComponent, data: { rightPanelOpened: false } },
                    { path: 'lead-information', component: LeadInformationComponent, data: { rightPanelId: RP_LEAD_INFO_ID, rightPanelOpened: true } },
                    { path: 'questionnaire', component: QuestionnaireComponent },
                    { path: 'documents', component: DocumentsComponent, data: { rightPanelOpened: false } },
                    { path: 'referral-history', component: ReferralHistoryComponent },
                    { path: 'activity-logs', component: ActivityLogsComponent },
                    { path: 'notes', component: NotesComponent, data: { rightPanelOpened: false } },
                    { path: 'orders', component: OrdersComponent },
                    { path: 'invoices', component: InvoicesComponent },
                    { path: 'subscriptions', component: SubscriptionsComponent },
                    { path: 'payment-information', component: PaymentInformationComponent, data: { rightPanelOpened: false } }
                ]
            }
        ]}])
    ],
    exports: [
        RouterModule
    ]
})
export class ContactsRoutingModule { }