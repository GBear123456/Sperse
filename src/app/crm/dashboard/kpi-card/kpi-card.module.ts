import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KpiCardComponent } from './kpi-card.component';

@NgModule({
  declarations: [
    KpiCardComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    KpiCardComponent
  ]
})
export class KpiCardModule { }
