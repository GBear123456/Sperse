import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {AccountsComponent} from './accounts/accounts.component';
import {CategorizationStatusComponent} from './categorization-status/categorization-status.component';
import {AccountsSynchStatusComponent} from './accounts-synch-status/accounts-synch-status.component';
import {RoundProgressModule} from 'angular-svg-round-progressbar';


@NgModule({
    imports: [
        CommonModule,
        RoundProgressModule
    ],
    declarations: [
        AccountsComponent,
        CategorizationStatusComponent,
        AccountsSynchStatusComponent
    ],
    exports: [
        AccountsComponent,
        CategorizationStatusComponent,
        AccountsSynchStatusComponent
    ]
})
export class DashboardModule {
}
