import { ModuleWithProviders, NgModule } from '@angular/core';
import * as ngCommon from '@angular/common';
import { CommonModule } from '@shared/common/common.module';
import {
    DxDataGridModule,
    DxScrollViewModule,
    DxTabsModule,
    DxSelectBoxModule,
    DxContextMenuModule,
    DxPopupModule,
    DxTooltipModule,
    DxTextBoxModule,
    DxButtonModule,
    DxSwitchModule,
    DxTagBoxModule,
    DxProgressBarModule,
    DxValidatorModule,
    DxValidationSummaryModule
} from 'devextreme-angular';
import { AppCommonModule } from '@app/shared/common/app-common.module';
import { SyncServiceProxy, ContactServiceProxy, BankAccountsServiceProxy, BusinessEntityServiceProxy } from '@shared/service-proxies/service-proxies';
import { RoundProgressModule } from 'angular-svg-round-progressbar';

import { BankAccountsService } from './helpers/bank-accounts.service';
import { BankAccountsComponent } from './bank-accounts.component';
import { BankAccountsWidgetComponent } from './bank-accounts-widgets/bank-accounts-widget.component';
import { BankAccountsQuovoComponent } from './bank-accounts-quovo/bank-accounts-quovo.component';
import { QuovoPfmComponent } from './quovo-pfm/quovo-pfm.component';
import { AddAccountButtonComponent } from './add-account-button/add-account-button.component';

import { QuovoService } from './quovo/QuovoService';
import { AddQuovoAccountButtonComponent } from './quovo/add-quovo-account-button/add-quovo-account-button.component';
import { XeroLoginButtonComponent } from './xero/xero-login-button/xero-login-button.component';
import { ImportXeroChartOfAccountsButtonComponent } from './xero/import-xero-chart-of-accounts-button/import-xero-chart-of-accounts-button.component';

import { SelectionFilterComponent } from './selection-filter/selection-filter.component';
import { SynchProgressComponent } from './synch-progress/synch-progress.component';

@NgModule({
    imports: [
        CommonModule,
        ngCommon.CommonModule,
        AppCommonModule,
        RoundProgressModule,
        DxTabsModule,
        DxScrollViewModule,
        DxDataGridModule,
        DxSelectBoxModule,
        DxContextMenuModule,
        DxPopupModule,
        DxTooltipModule,
        DxTextBoxModule,
        DxButtonModule,
        DxSwitchModule,
        DxTagBoxModule,
        DxProgressBarModule,
        DxValidatorModule,
        DxValidationSummaryModule
    ],
    declarations: [
        BankAccountsComponent,
        BankAccountsWidgetComponent,
        BankAccountsQuovoComponent,
        QuovoPfmComponent,
        AddAccountButtonComponent,

        XeroLoginButtonComponent,
        ImportXeroChartOfAccountsButtonComponent,
        AddQuovoAccountButtonComponent,

        SelectionFilterComponent,
        SynchProgressComponent
    ],
    exports: [
        BankAccountsComponent,
        BankAccountsWidgetComponent,
        BankAccountsQuovoComponent,
        QuovoPfmComponent,
        AddAccountButtonComponent,

        XeroLoginButtonComponent,
        ImportXeroChartOfAccountsButtonComponent,
        AddQuovoAccountButtonComponent,

        SelectionFilterComponent,
        SynchProgressComponent
    ],
    providers: [
        QuovoService,
        ContactServiceProxy,
        BusinessEntityServiceProxy,
        BankAccountsServiceProxy,
        SyncServiceProxy
    ]
})
export class BankAccountsCommonModule {
    static forRoot(): ModuleWithProviders {
        return {
            ngModule: BankAccountsCommonModule,
            providers: [
                BankAccountsService
            ]
        };
    }
}
