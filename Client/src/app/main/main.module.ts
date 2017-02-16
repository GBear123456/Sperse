import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MainRoutingModule } from './main-routing.module'
import { MainComponent } from './main.component'
import { DashboardComponent } from './dashboard/dashboard.component';

import { ModalModule, TabsModule, TooltipModule } from 'ng2-bootstrap';
import { AppCommonModule } from '@app/shared/common/app-common.module';
import { UtilsModule } from '@shared/utils/utils.module';

@NgModule({
    imports: [
        CommonModule,
        MainRoutingModule,
        BrowserModule,
        FormsModule,
        ModalModule,
        TabsModule,
        TooltipModule,
        AppCommonModule,
        UtilsModule
    ],
    declarations: [
        MainComponent,
        DashboardComponent
    ]
})
export class MainModule { }