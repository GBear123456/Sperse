/** angular modules */
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

/** related custom components */
import { CashflowComponent } from './components/main/cashflow.component';
import { OperationsComponent } from './components/operations/operations.component';
import { CashflowTableComponent } from './components/cashflow-table/cashflow-table.component';

/** devextreme modules */
import {
DxPivotGridModule,
DxToolbarModule,
DxButtonModule,
DxSelectBoxModule
} from 'devextreme-angular';

/** custom overrided pivot grid module */
//import { DxPivotGridModule } from '@extended_modules/devextreme-angular';

/** services */
import { CashflowService } from './services/cashflow.service';

@NgModule({
  imports: [
    CommonModule,
    DxPivotGridModule,
    DxSelectBoxModule,
    DxToolbarModule,
    DxButtonModule,
    DxSelectBoxModule
  ],
  exports: [
      CashflowComponent
  ],
  declarations: [
    CashflowComponent,
    OperationsComponent,
    CashflowTableComponent
  ],
  providers: [
    CashflowService
  ]
})

export class CashflowModule { }
