import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { UserDetailsComponent } from './user-details.component';
import { UserInformationComponent } from './user-information/user-information.component';
import { LoginAttempsComponent } from './login-attemps/login-attemps.component';

@NgModule({
    imports: [
        RouterModule.forChild([
            {
                path: 'user/:userId',
                component: UserDetailsComponent,
                children: [
                    { path: '', redirectTo: 'information', pathMatch: 'full' },
                    { path: 'information', component: UserInformationComponent },
                    { path: 'login-attemps', component: LoginAttempsComponent, data: { rightPanelOpened: false } }
                ]
            }
        ])
    ],
    exports: [
        RouterModule
    ]
})
export class UserDetailsRoutingModule { }
