import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { ClientDetailsComponent } from './client-details.component';
import { RequiredDocumentsComponent } from './required-documents/required-documents.component';
import { ContactInformationComponent } from './contact-information/contact-information.component';
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
                  {path: 'documents', component: RequiredDocumentsComponent },
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
