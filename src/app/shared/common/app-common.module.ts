import * as ngCommon from '@angular/common';
import { NgModule, ModuleWithProviders } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModalModule } from 'ngx-bootstrap';

import { UtilsModule } from '@shared/utils/utils.module';
import { AbpModule } from '@abp/abp.module';
import { CommonModule } from '@shared/common/common.module';

import { DxDropDownBoxModule, DxListModule, DxButtonModule, DxToolbarModule } from 'devextreme-angular';

import { ToolBarComponent } from './toolbar/toolbar.component';
import { HeadLineComponent } from './headline/headline.component';
import { TimeZoneComboComponent } from './timing/timezone-combo.component';
import { AppAuthService } from './auth/app-auth.service';
import { JqPluginDirective } from './libs/jq-plugin.directive';
import { CommonLookupModalComponent } from './lookup/common-lookup-modal.component';
import { DateRangePickerComponent } from './timing/date-range-picker.component';
import { DatePickerComponent } from './timing/date-picker.component';
import { AppRouteGuard } from './auth/auth-route-guard';
import { DateTimeService } from './timing/date-time.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

import { DataTableModule } from 'primeng/primeng';
import { PaginatorModule } from 'primeng/primeng';

@NgModule({
    imports: [
        ngCommon.CommonModule,
        FormsModule,
        ModalModule.forRoot(),
        UtilsModule,
        AbpModule,
        CommonModule,
        DataTableModule,
        PaginatorModule,

        DxListModule,
        DxButtonModule, 
        DxToolbarModule,
        DxDropDownBoxModule
    ],
    declarations: [
        TimeZoneComboComponent,
        JqPluginDirective,
        CommonLookupModalComponent,
        DateRangePickerComponent,
        DatePickerComponent,
        ToolBarComponent,
        HeadLineComponent
    ],
    exports: [
        TimeZoneComboComponent,
        JqPluginDirective,
        CommonLookupModalComponent,
        DateRangePickerComponent,
        DatePickerComponent,
        HeadLineComponent,
        ToolBarComponent
    ],
    providers: [
        DateTimeService,
        AppLocalizationService
    ]
})
export class AppCommonModule {
    static forRoot(): ModuleWithProviders {
        return {
            ngModule: AppCommonModule,
            providers: [
                AppAuthService,
                AppRouteGuard
            ]
        };
    }
}
