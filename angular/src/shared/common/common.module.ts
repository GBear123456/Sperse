import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AbpModule } from '@abp/abp.module';

import { AppSessionService } from './session/app-session.service';

@NgModule({
    imports: [
        BrowserModule,
        AbpModule
    ],
    providers: [
        AppSessionService
    ]
})
export class CommonModule { }