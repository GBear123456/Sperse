/** Core imports */
import { NgModule } from '@angular/core';
import * as ngCommon from '@angular/common';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

/** Third party imports */
import { MatSidenavModule, MatProgressBarModule, MatTabsModule, MatDialogModule, MatProgressSpinnerModule, MatSelectModule } from '@angular/material';
import { AppCommonModule } from '@app/shared/common/app-common.module';
import { AbpHttpInterceptor } from '@abp/abpHttpInterceptor';
import { CommonModule } from '@shared/common/common.module';
import { AngularGooglePlaceModule } from 'angular-google-place';
import {
    DxListModule,
    DxTooltipModule,
    DxDataGridModule,
    DxToolbarModule,
    DxTemplateModule,
    DxDateBoxModule,
    DxTextBoxModule,
    DxValidatorModule,
    DxValidationSummaryModule,
    DxValidationGroupModule,
    DxButtonModule,
    DxFileUploaderModule,
    DxSelectBoxModule,
    DxPivotGridModule,
    DxNumberBoxModule,
    DxScrollViewModule,
    DxTextAreaModule,
    DxContextMenuModule,
    DxSliderModule,
    DxRadioGroupModule,
    DxCheckBoxModule
} from 'devextreme-angular';
import { TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/primeng';
import { ModalModule, TabsModule, TooltipModule, PopoverModule } from 'ngx-bootstrap';
import { FileDropModule } from 'ngx-file-drop';
import { FileUploadModule } from 'ng2-file-upload';

/** Application imports */
import { PipelineModule } from '@app/shared/pipeline/pipeline.module';
import { DeleteAndReassignDialogComponent } from '@app/crm/shared/delete-and-reassign-dialog/delete-and-reassign-dialog.component';
import { FiltersModule } from '@shared/filters/filters.module';
import { UtilsModule } from '@shared/utils/utils.module';
import { CRMDashboardWidgetsModule } from '@shared/crm/dashboard-widgets/dashboard-widgets.module';
import { ClientDetailsModule } from './clients/details/client-details.module';
import { CrmRoutingModule } from './crm-routing.module';
import { ClientsComponent } from './clients/clients.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { LeadsStatsComponent } from './dashboard/leads-stats/leads-stats.component';
import { DashboardMenuComponent } from './dashboard/left-menu/left-menu.component';
import { CreateClientDialogComponent } from './shared/create-client-dialog/create-client-dialog.component';
import { LeadsComponent } from './leads/leads.component';
import { OrdersComponent } from './orders/orders.component';
import { ImportLeadsComponent } from './import-leads/import-leads.component';

@NgModule({
    imports: [
      FileDropModule,
      FormsModule,
      ngCommon.CommonModule,
      CommonModule,
      AppCommonModule,
      DxDataGridModule,
      DxToolbarModule,
      DxTemplateModule,
      DxDateBoxModule,
      DxTextBoxModule,
      DxValidatorModule,
      DxValidationGroupModule,
      DxValidationSummaryModule,
      DxButtonModule,
      DxFileUploaderModule,
      DxSelectBoxModule,
      DxPivotGridModule,
      DxNumberBoxModule,
      DxScrollViewModule,
      DxTextAreaModule,
      DxContextMenuModule,
      DxTooltipModule,
      DxListModule,
      DxSliderModule,
      DxRadioGroupModule,
      DxCheckBoxModule,

      MatSidenavModule,
      MatProgressBarModule,
      MatTabsModule,
      MatDialogModule,
      MatProgressSpinnerModule,
      MatSelectModule,
      AngularGooglePlaceModule,

      CRMDashboardWidgetsModule,
      ClientDetailsModule,
      FileUploadModule,
      ModalModule.forRoot(),
      TabsModule.forRoot(),
      TooltipModule.forRoot(),
      PopoverModule.forRoot(),
      CrmRoutingModule,
      UtilsModule,
      FiltersModule,
      PipelineModule,
      TableModule,
      PaginatorModule
    ],
    declarations: [
      ClientsComponent,
      CreateClientDialogComponent,
      LeadsComponent,
      OrdersComponent,
      DashboardComponent,
      DashboardMenuComponent,
      LeadsStatsComponent,
      ImportLeadsComponent,
      DeleteAndReassignDialogComponent
    ],
    providers: [
        { provide: HTTP_INTERCEPTORS, useClass: AbpHttpInterceptor, multi: true },
    ],
    entryComponents: [
        CreateClientDialogComponent,
        DeleteAndReassignDialogComponent
    ]
})
export class CrmModule {
}
