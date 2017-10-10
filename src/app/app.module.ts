import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { LayoutModule } from './shared/layout/layout.module';
import { AppCommonModule } from './shared/common/app-common.module';
import { AppRoutingModule } from './app-routing.module';

import { AppComponent } from './app.component';

import { ImpersonationService } from './crm/users/impersonation.service';

@NgModule({
    declarations: [
        AppComponent
    ],
    imports: [
  		LayoutModule,
      AppRoutingModule,
      AppCommonModule.forRoot(),
      BrowserModule
    ],
    providers: [
      ImpersonationService
    ]
})
export class AppModule { }