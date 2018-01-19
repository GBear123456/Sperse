import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { LayoutModule } from './shared/layout/layout.module';
import { AppCommonModule } from './shared/common/app-common.module';
import { AppRoutingModule } from './mobile-routing.module';

import { AppComponent } from './mobile.component';
import { AppService } from './mobile.service';

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
        AppService
    ]
})
export class MobileModule {}
