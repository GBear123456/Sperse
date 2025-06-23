import * as ngCommon from '@angular/common';
import { NgModule } from '@angular/core';

import { LayoutModule } from './shared/layout/layout.module';
import { AppCommonModule } from './shared/common/app-common.module';
import { MobileRoutingModule } from './mobile-routing.module';

import { AppComponent } from './mobile.component';
import { AppService } from './mobile.service';
import { CommonModule } from '@shared/common/common.module';

@NgModule({
    declarations: [
        AppComponent
    ],
    imports: [
        LayoutModule,
        AppCommonModule.forRoot(),
        ngCommon.CommonModule,
        MobileRoutingModule,
        CommonModule
    ],
    providers: [
        AppService
    ]
})
export class MobileModule {}
