import * as ngCommon from '@angular/common';
import { NgModule } from '@angular/core';

import { LayoutModule } from './shared/layout/layout.module';
import { AppCommonModule } from './shared/common/app-common.module';
import { AppRoutingModule } from './app-routing.module';

import { AppComponent } from './app.component';
import { AppService } from './app.service';

import { ImpersonationService } from '@admin/users/impersonation.service';
import { AppConsts } from '@shared/AppConsts';

@NgModule({
    declarations: [
        AppComponent
    ],
    imports: [
        LayoutModule,
        AppCommonModule.forRoot(),
        ngCommon.CommonModule,
        AppRoutingModule
    ],
    providers: [
        AppService,
        ImpersonationService
    ]
})
export class AppModule {}