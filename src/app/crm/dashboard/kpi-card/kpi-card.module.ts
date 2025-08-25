import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KpiCardComponent } from './kpi-card.component';
import { MatIconModule } from '@angular/material/icon';

@NgModule({
  declarations: [
    KpiCardComponent
  ],
  imports: [
    CommonModule,
    MatIconModule
  ],
  exports: [
    KpiCardComponent
  ]
})
export class KpiCardModule { }
