import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppCommonModule } from '@app/shared/common/app-common.module';
import { CashflowModule } from './cashflow/cashflow.module';
import { CfoRoutingModule } from './cfo-routing.module';
import { BankAccountsComponent } from './bank-accounts/bank-accounts.component';

@NgModule({
    imports: [
        CashflowModule,
        CfoRoutingModule,
        CommonModule,
        AppCommonModule
    ],
    declarations: [
        BankAccountsComponent
    ]
})

export class CfoModule { }
