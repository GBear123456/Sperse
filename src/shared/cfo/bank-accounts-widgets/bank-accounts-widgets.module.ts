import { NgModule } from '@angular/core';
import * as ngCommon from '@angular/common';
import { CommonModule } from '@shared/common/common.module';
import {
    DxDataGridModule,
    DxScrollViewModule,
    DxTabsModule,
    DxSelectBoxModule,
    DxContextMenuModule,
    DxPopupModule
} from 'devextreme-angular';
import { BankAccountsWidgetComponent } from '@shared/cfo/bank-accounts-widgets/bank-accounts-widget.component';

@NgModule({
    imports: [
        CommonModule,
        ngCommon.CommonModule,
        DxTabsModule,
        DxScrollViewModule,
        DxDataGridModule,
        DxSelectBoxModule,
        DxContextMenuModule,
        DxPopupModule
    ],
    declarations: [
        BankAccountsWidgetComponent
    ],
    exports: [
        BankAccountsWidgetComponent
    ]
})
export class BankAccountsWidgetsModule {
}
