import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppCommonModule } from '@app/shared/common/app-common.module';
import { ApiRoutingModule } from './api-routing.module';
import { SwaggerComponent } from './swagger/swagger.component';

@NgModule({
  imports: [
    ApiRoutingModule,
    CommonModule,
    AppCommonModule
  ],
  declarations: [
    SwaggerComponent
  ]
})

export class ApiModule { }