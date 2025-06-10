import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ContactsComponent } from './contacts.component';
import { DocumentsComponent } from './documents/documents.component';
import { ContactInformationComponent } from './contact-information/contact-information.component';
import { UserInformationComponent } from './user-information/user-information.component';
import { UserInboxComponent } from './user-inbox/user-inbox.component';
import { LoginAttemptsComponent } from './login-attempts/login-attempts.component';
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
import { LeadRelatedContactsComponent } from './lead-related-contacts/lead-related-contacts.component';
import { PropertyInformationComponent } from '@app/crm/contacts/property-information/property-information.component';
import { ResellerActivityComponent } from './reseller-activity/reseller-activity.component';

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
                    { path: 'user-inbox', component: UserInboxComponent },
                    { path: 'user-information', component: UserInformationComponent },
                    { path: 'login-attempts', component: LoginAttemptsComponent },
                    { path: 'lead-information', component: LeadInformationComponent },
                    { path: 'lead-related-contacts', component: LeadRelatedContactsComponent },
                    { path: 'questionnaire', component: QuestionnaireComponent },
                    { path: 'documents', component: DocumentsComponent },
                    { path: 'application-status', component: ApplicationStatusComponent },
                    { path: 'referral-history', component: ReferralHistoryComponent },
                    { path: 'reseller-activity', component: ResellerActivityComponent },
                    { path: 'orders', component: OrdersComponent },
                    { path: 'invoices', component: InvoicesComponent },
                    { path: 'subscriptions', component: SubscriptionsComponent },
                    { path: 'payment-information', component: PaymentInformationComponent },
                    { path: 'activity-logs', component: ActivityLogsComponent },
                    { path: 'notes', component: NotesComponent }
                ]
            },
            {
                path: 'contact/:contactId',
                component: ContactsComponent,
                children: [
                    { path: '', redirectTo: 'contact-information', pathMatch: 'full' },
                    { path: 'property-information', component: PropertyInformationComponent },
                    { path: 'property-documents', component: DocumentsComponent, data: { 'property': true }},
                    { path: 'contact-information', component: ContactInformationComponent },
                    { path: 'personal-details', component: PersonalDetailsComponent },
                    { path: 'user-inbox', component: UserInboxComponent },
                    { path: 'user-information', component: UserInformationComponent },
                    { path: 'login-attempts', component: LoginAttemptsComponent },
                    { path: 'lead-information', component: LeadInformationComponent },
                    { path: 'lead-related-contacts', component: LeadRelatedContactsComponent },
                    { path: 'questionnaire', component: QuestionnaireComponent },
                    { path: 'documents', component: DocumentsComponent },
                    { path: 'application-status', component: ApplicationStatusComponent },
                    { path: 'referral-history', component: ReferralHistoryComponent },
                    { path: 'reseller-activity', component: ResellerActivityComponent },
                    { path: 'orders', component: OrdersComponent },
                    { path: 'invoices', component: InvoicesComponent },
                    { path: 'subscriptions', component: SubscriptionsComponent },
                    { path: 'payment-information', component: PaymentInformationComponent },
                    { path: 'activity-logs', component: ActivityLogsComponent },
                    { path: 'notes', component: NotesComponent }
                ]
            },
            {
                path: 'contact/:contactId/lead/:leadId',
                component: ContactsComponent,
                children: [
                    { path: '', redirectTo: 'contact-information', pathMatch: 'full' },
                    { path: 'property-information', component: PropertyInformationComponent },
                    { path: 'property-documents', component: DocumentsComponent, data: { 'property': true }},
                    { path: 'contact-information', component: ContactInformationComponent },
                    { path: 'personal-details', component: PersonalDetailsComponent },
                    { path: 'user-inbox', component: UserInboxComponent },
                    { path: 'user-information', component: UserInformationComponent },
                    { path: 'login-attempts', component: LoginAttemptsComponent },
                    { path: 'lead-information', component: LeadInformationComponent },
                    { path: 'lead-related-contacts', component: LeadRelatedContactsComponent },
                    { path: 'questionnaire', component: QuestionnaireComponent },
                    { path: 'documents', component: DocumentsComponent },
                    { path: 'referral-history', component: ReferralHistoryComponent },
                    { path: 'reseller-activity', component: ResellerActivityComponent },
                    { path: 'activity-logs', component: ActivityLogsComponent },
                    { path: 'notes', component: NotesComponent },
                    { path: 'orders', component: OrdersComponent },
                    { path: 'invoices', component: InvoicesComponent },
                    { path: 'subscriptions', component: SubscriptionsComponent },
                    { path: 'payment-information', component: PaymentInformationComponent }
                ]
            },
            {
                path: 'contact/:contactId/company/:companyId',
                component: ContactsComponent,
                children: [
                    { path: '', redirectTo: 'contact-information', pathMatch: 'full' },
                    { path: 'property-information', component: PropertyInformationComponent },
                    { path: 'property-documents', component: DocumentsComponent, data: { 'property': true }},
                    { path: 'contact-information', component: ContactInformationComponent },
                    { path: 'personal-details', component: PersonalDetailsComponent },
                    { path: 'user-inbox', component: UserInboxComponent },
                    { path: 'user-information', component: UserInformationComponent },
                    { path: 'login-attempts', component: LoginAttemptsComponent },
                    { path: 'lead-information', component: LeadInformationComponent },
                    { path: 'lead-related-contacts', component: LeadRelatedContactsComponent },
                    { path: 'questionnaire', component: QuestionnaireComponent },
                    { path: 'documents', component: DocumentsComponent },
                    { path: 'application-status', component: ApplicationStatusComponent },
                    { path: 'referral-history', component: ReferralHistoryComponent },
                    { path: 'reseller-activity', component: ResellerActivityComponent },
                    { path: 'activity-logs', component: ActivityLogsComponent },
                    { path: 'notes', component: NotesComponent },
                    { path: 'orders', component: OrdersComponent },
                    { path: 'invoices', component: InvoicesComponent },
                    { path: 'subscriptions', component: SubscriptionsComponent },
                    { path: 'payment-information', component: PaymentInformationComponent }
                ]
            },
            {
                path: 'contact/:contactId/lead/:leadId/company/:companyId',
                component: ContactsComponent,
                children: [
                    { path: '', redirectTo: 'contact-information', pathMatch: 'full' },
                    { path: 'property-information', component: PropertyInformationComponent },
                    { path: 'property-documents', component: DocumentsComponent, data: { 'property': true }},
                    { path: 'contact-information', component: ContactInformationComponent },
                    { path: 'personal-details', component: PersonalDetailsComponent },
                    { path: 'user-inbox', component: UserInboxComponent },
                    { path: 'user-information', component: UserInformationComponent },
                    { path: 'login-attempts', component: LoginAttemptsComponent },
                    { path: 'lead-information', component: LeadInformationComponent },
                    { path: 'lead-related-contacts', component: LeadRelatedContactsComponent },
                    { path: 'questionnaire', component: QuestionnaireComponent },
                    { path: 'documents', component: DocumentsComponent },
                    { path: 'referral-history', component: ReferralHistoryComponent },
                    { path: 'reseller-activity', component: ResellerActivityComponent },
                    { path: 'activity-logs', component: ActivityLogsComponent },
                    { path: 'notes', component: NotesComponent },
                    { path: 'orders', component: OrdersComponent },
                    { path: 'invoices', component: InvoicesComponent },
                    { path: 'subscriptions', component: SubscriptionsComponent },
                    { path: 'payment-information', component: PaymentInformationComponent }
                ]
            }
        ]}])
    ],
    exports: [
        RouterModule
    ]
})
export class ContactsRoutingModule { }