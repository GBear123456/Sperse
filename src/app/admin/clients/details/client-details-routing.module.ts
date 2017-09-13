import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { ClientDetailsComponent } from './client-details.component';
import { RequiredDocumentsComponent } from './required-documents/required-documents.component';
import { ContactInformationComponent } from './contact-information/contact-information.component';

@NgModule({
    imports: [
        RouterModule.forChild([
            {
                path: 'clients/:id',
                component: ClientDetailsComponent,
                children: [
                  {path: '', redirectTo: 'contact-information', pathMatch: 'full' },
                  {path: 'contact-information', component: ContactInformationComponent },
                  {path: 'documents', component: RequiredDocumentsComponent }
                ]
            }
        ])
    ],
    exports: [
        RouterModule
    ]
})
export class ClientDetailsRoutingModule { }
