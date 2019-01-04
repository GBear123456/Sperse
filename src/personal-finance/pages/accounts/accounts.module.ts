/** Core imports */
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

/** Third party imports */
import { MatDialogModule, MatStepperModule } from '@angular/material';
import { StickyModule } from 'ng2-sticky-kit';

/** Application imports */
import { AccountsComponent } from '@root/personal-finance/pages/accounts/accounts.component';
import { FinancePageComponent } from '@root/personal-finance/pages/accounts/finance-page/finance-page.component';
import { QuovoService } from '@shared/cfo/bank-accounts/quovo/QuovoService';
import { SynchProgressService } from '@shared/cfo/bank-accounts/helpers/synch-progress.service';
import { SyncServiceProxy } from '@shared/service-proxies/service-proxies';
import { PfmIntroComponent } from '@root/personal-finance/shared/pfm-intro/pfm-intro.component';
import { AccountConnectorDialogModule } from '@shared/common/account-connector-dialog/account-connector-dialog.module';
import { UserOnlyCFOService } from '@root/personal-finance/shared/common/user-only.cfo.service';
import { CFOService } from '@shared/cfo/cfo.service';
import { LayoutModule } from '@root/personal-finance/shared/layout/layout.module';

@NgModule({
    declarations: [
        AccountsComponent,
        FinancePageComponent,
        PfmIntroComponent
    ],
    imports: [
        AccountConnectorDialogModule,
        LayoutModule,
        CommonModule,
        MatStepperModule,
        MatDialogModule,
        StickyModule,
        RouterModule.forChild([
            {
                path: '',
                component: AccountsComponent
            },
            {
                path: ':sectionName',
                component: AccountsComponent,
                data: { wrapperDisabled: true }
            },
        ])
    ],
    providers: [
        QuovoService,
        SyncServiceProxy,
        SynchProgressService,
        {
            provide: CFOService,
            useClass: UserOnlyCFOService
        }
    ],
    entryComponents: [
        PfmIntroComponent
    ]
})
export class AccountsModule {}
