/** Core imports */
import { ModuleWithProviders, NgModule } from '@angular/core';
import * as ngCommon from '@angular/common';

/** Third party imports */
import { RoundProgressModule } from 'angular-svg-round-progressbar';
import { DxCheckBoxModule } from 'devextreme-angular/ui/check-box';
import { DxDataGridModule } from 'devextreme-angular/ui/data-grid';
import { DxScrollViewModule } from 'devextreme-angular/ui/scroll-view';
import { DxTabsModule } from 'devextreme-angular/ui/tabs';
import { DxSelectBoxModule } from 'devextreme-angular/ui/select-box';
import { DxContextMenuModule } from 'devextreme-angular/ui/context-menu';
import { DxPopupModule } from 'devextreme-angular/ui/popup';
import { DxTooltipModule } from 'devextreme-angular/ui/tooltip';
import { DxTextBoxModule } from 'devextreme-angular/ui/text-box';
import { DxButtonModule } from 'devextreme-angular/ui/button';
import { DxSwitchModule } from 'devextreme-angular/ui/switch';
import { DxTagBoxModule } from 'devextreme-angular/ui/tag-box';
import { DxProgressBarModule } from 'devextreme-angular/ui/progress-bar';
import { DxValidatorModule } from 'devextreme-angular/ui/validator';
import { DxValidationSummaryModule } from 'devextreme-angular/ui/validation-summary';
import { DxRadioGroupModule } from 'devextreme-angular/ui/radio-group';
import { DxDropDownBoxModule } from 'devextreme-angular/ui/drop-down-box';
import { DxListModule } from 'devextreme-angular/ui/list';
import { DxTreeViewModule } from 'devextreme-angular/ui/tree-view';

/** Application imports */
import { CommonModule } from '@shared/common/common.module';
import {
    SyncServiceProxy,
    ContactServiceProxy,
    BankAccountsServiceProxy,
    BusinessEntityServiceProxy,
    MyFinancesServiceProxy
} from '@shared/service-proxies/service-proxies';
import { BankAccountsService } from './helpers/bank-accounts.service';
import { BankAccountsComponent } from './bank-accounts.component';
import { BankAccountsWidgetComponent } from './bank-accounts-widgets/bank-accounts-widget.component';
import { BankAccountsQuovoComponent } from './bank-accounts-quovo/bank-accounts-quovo.component';
import { QuovoPfmComponent } from './quovo-pfm/quovo-pfm.component';
import { AddAccountButtonComponent } from './add-account-button/add-account-button.component';
import { QuovoService } from './quovo/QuovoService';
import { AddQuovoAccountButtonComponent } from './quovo/add-quovo-account-button/add-quovo-account-button.component';
import { ImportXeroChartOfAccountsButtonComponent } from './xero/import-xero-chart-of-accounts-button/import-xero-chart-of-accounts-button.component';
import { SelectionFilterComponent } from './selection-filter/selection-filter.component';
import { SynchProgressComponent } from './synch-progress/synch-progress.component';
import { SynchProgressService } from '@shared/cfo/bank-accounts/helpers/synch-progress.service';
import { ChooseXeroAccountComponent } from './xero/import-xero-chart-of-accounts-button/choose-xero-account/choose-xero-account.component';
import { AccountConnectorDialogModule } from '@shared/common/account-connector-dialog/account-connector-dialog.module';
import { SearchInputModule } from '@app/shared/common/search-input/search-input.module';
import { SortButtonModule } from '@app/shared/common/sort-button/sort-button.module';
import { ExpandButtonModule } from '@app/shared/common/expand-button/expand-button.module';
import { BusinessEntitiesChooserComponent } from './business-entities-chooser/business-entities-chooser.component';

@NgModule({
    imports: [
        CommonModule,
        ngCommon.CommonModule,
        RoundProgressModule,
        DxDropDownBoxModule,
        DxTabsModule,
        DxScrollViewModule,
        DxDataGridModule,
        DxSelectBoxModule,
        DxContextMenuModule,
        DxPopupModule,
        DxTooltipModule,
        DxCheckBoxModule,
        DxTextBoxModule,
        DxButtonModule,
        DxSwitchModule,
        DxTagBoxModule,
        DxListModule,
        DxProgressBarModule,
        DxValidatorModule,
        AccountConnectorDialogModule,
        DxValidationSummaryModule,
        DxRadioGroupModule,
        DxTreeViewModule,
        SearchInputModule,
        SortButtonModule,
        ExpandButtonModule
    ],
    declarations: [
        BankAccountsComponent,
        BusinessEntitiesChooserComponent,
        BankAccountsWidgetComponent,
        BankAccountsQuovoComponent,
        QuovoPfmComponent,
        AddAccountButtonComponent,
        ImportXeroChartOfAccountsButtonComponent,
        ChooseXeroAccountComponent,
        AddQuovoAccountButtonComponent,

        SelectionFilterComponent,
        SynchProgressComponent
    ],
    exports: [
        BankAccountsComponent,
        BusinessEntitiesChooserComponent,
        BankAccountsWidgetComponent,
        BankAccountsQuovoComponent,
        QuovoPfmComponent,
        AddAccountButtonComponent,
        ImportXeroChartOfAccountsButtonComponent,
        ChooseXeroAccountComponent,
        AddQuovoAccountButtonComponent,

        SelectionFilterComponent,
        SynchProgressComponent
    ],
    entryComponents: [
        ChooseXeroAccountComponent
    ],
    providers: [
        QuovoService,
        MyFinancesServiceProxy,
        ContactServiceProxy,
        BusinessEntityServiceProxy,
        BankAccountsServiceProxy,
        SyncServiceProxy,
        SynchProgressService
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
