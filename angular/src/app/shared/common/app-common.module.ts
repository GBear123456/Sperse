import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModalModule } from 'ng2-bootstrap';

import { UtilsModule } from '@shared/utils/utils.module';
import { AbpModule } from '@abp/abp.module';
import { CommonModule } from '@shared/common/common.module';

import { AppUrlService } from './nav/app-url.service';
import { TimeZoneComboComponent } from './timing/timezone-combo.component';
import { AppAuthService } from './auth/app-auth.service';
import { JqPluginDirective } from './libs/jq-plugin.directive';
import { CommonLookupModalComponent } from './lookup/common-lookup-modal.component';
import { DateRangePickerComponent } from './timing/date-range-picker.component';
import { AuthRouteGuard } from './auth/auth-route-guard';

@NgModule({
    imports: [
        BrowserModule,
        FormsModule,
        ModalModule.forRoot(),
        UtilsModule,
        AbpModule,
        CommonModule
    ],
    providers: [
        AppUrlService,
        AppAuthService,
        AuthRouteGuard
    ],
    declarations: [
        TimeZoneComboComponent,
        JqPluginDirective,
        CommonLookupModalComponent,
        DateRangePickerComponent
    ],
    exports: [
        TimeZoneComboComponent,
        JqPluginDirective,
        CommonLookupModalComponent,
        DateRangePickerComponent
    ]
})
export class AppCommonModule { }