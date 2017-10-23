import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppCommonModule } from '@app/shared/common/app-common.module';
import { ApiRoutingModule } from './api-routing.module';
import { SwaggerComponent } from './swagger/swagger.component';

import { SwangularComponentsModule } from 'swangular-components';

@NgModule({
  imports: [
    ApiRoutingModule,
    CommonModule,
    AppCommonModule,
    SwangularComponentsModule.forRoot()
  ],
  declarations: [
    SwaggerComponent
  ]
})

export class ApiModule { }