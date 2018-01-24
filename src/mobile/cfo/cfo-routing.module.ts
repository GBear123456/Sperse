import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Route } from '@angular/router';
import { AccountsComponent } from './accounts/accounts.component';
import { StartComponent } from './start/start.component'

@NgModule({
    imports: [
        RouterModule.forChild([
            { path: '', redirectTo: 'start', pathMatch: 'full' },
            {
                path: '',
                children: [
                    { path: 'start', component: StartComponent, data: { permission: '' } },
                    { path: 'linkaccounts', component: AccountsComponent, data: { permission: '' } }
                ]
            }
        ])
    ],
    exports: [
        RouterModule
    ]
})
export class CfoRoutingModule { }
