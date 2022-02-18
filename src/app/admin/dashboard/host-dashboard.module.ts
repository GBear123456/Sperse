import { NgModule } from '@angular/core';
import { TreeDragDropService } from 'primeng/api';
import { HostDashboardRoutingModule } from './host-dashboard-routing.module';
import { HostDashboardComponent } from './host-dashboard.component';
import { CustomizableDashboardModule } from '@app/shared/common/customizable-dashboard/customizable-dashboard.module';
import { NgxBootstrapDatePickerConfigService } from '@root/assets/ngx-bootstrap/ngx-bootstrap-datepicker-config.service';
import { DateTimeService } from '@app/shared/common/timing/date-time.service';
import {
    BsDatepickerConfig,
    BsDatepickerModule,
    BsDaterangepickerConfig,
    BsLocaleService,
} from 'ngx-bootstrap/datepicker';

@NgModule({
    declarations: [HostDashboardComponent],
    imports: [
        BsDatepickerModule,
        HostDashboardRoutingModule, 
        CustomizableDashboardModule
    ],
    providers: [
        DateTimeService,
        TreeDragDropService,
        { provide: BsDatepickerConfig, useFactory: NgxBootstrapDatePickerConfigService.getDatepickerConfig },
        { provide: BsDaterangepickerConfig, useFactory: NgxBootstrapDatePickerConfigService.getDaterangepickerConfig },
        { provide: BsLocaleService, useFactory: NgxBootstrapDatePickerConfigService.getDatepickerLocale }
    ]
})
export class HostDashboardModule {}