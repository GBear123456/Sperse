import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DxPivotGridModule, DxSelectBoxModule } from 'devextreme-angular';

import { CashflowComponent } from './components/main/cashflow.component';
import { OperationsComponent } from './components/operations/operations.component';
import { CashflowTableComponent } from './components/cashflow-table/cashflow-table.component';

/** Services */
import { CashflowService } from './services/cashflow.service';

@NgModule({
  imports: [
    CommonModule,
    DxPivotGridModule,
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
