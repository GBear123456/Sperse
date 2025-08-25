import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomersChartComponent } from './customers-chart.component';

@NgModule({
  declarations: [
    CustomersChartComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    CustomersChartComponent
  ]
})
export class CustomersChartModule { }
