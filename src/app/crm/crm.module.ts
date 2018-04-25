import { NgModule } from '@angular/core';
import * as ngCommon from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppCommonModule } from '@app/shared/common/app-common.module';
import { CommonModule } from '@shared/common/common.module';

import { ModalModule, TabsModule, TooltipModule, PopoverModule } from 'ngx-bootstrap';

import { FileUploadModule } from '@node_modules/ng2-file-upload';
import { CrmRoutingModule } from './crm-routing.module';
import { FiltersModule } from '@shared/filters/filters.module';
import { PipelineModule } from '@app/shared/pipeline/pipeline.module';
import { ClientDetailsModule } from './clients/details/client-details.module';
import { UtilsModule } from '@shared/utils/utils.module';
import { CRMDashboardWidgetsModule } from '@shared/crm/dashboard-widgets/dashboard-widgets.module';

import { ClientsComponent } from './clients/clients.component';
import { CreateClientDialogComponent } from './shared/create-client-dialog/create-client-dialog.component';
import { LeadsComponent } from './leads/leads.component';
import { OrdersComponent } from './orders/orders.component';
import { EditionsComponent } from './editions/editions.component';
import { CreateOrEditEditionModalComponent } from './editions/create-or-edit-edition-modal.component';
import { TenantsComponent } from './tenants/tenants.component';
import { CreateTenantModalComponent } from './tenants/create-tenant-modal.component';
import { EditTenantModalComponent } from './tenants/edit-tenant-modal.component';
import { TenantFeaturesModalComponent } from './tenants/tenant-features-modal.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { DashboardMenuComponent } from './dashboard/left-menu/left-menu.component';
import { LeadsStatsComponent } from './dashboard/leads-stats/leads-stats.component';

import { EditionComboComponent } from './shared/edition-combo.component';
import { FeatureTreeComponent } from './shared/feature-tree.component';

import { DataTableModule } from 'primeng/primeng';
import { PaginatorModule } from 'primeng/primeng';

import { GooglePlaceModule } from 'ng2-google-place-autocomplete';
import { MatSidenavModule, MatProgressBarModule, MatTabsModule, MatDialogModule,
  MatDialogRef, MatProgressSpinnerModule, MatSelectModule } from '@angular/material';

import {
    DxListModule,
    DxTooltipModule,
    DxDataGridModule,
    DxToolbarModule,
    DxTemplateModule,
    DxDateBoxModule,
    DxTextBoxModule,
    DxValidatorModule,
    DxDropDownBoxModule,
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
    DxSliderModule
} from 'devextreme-angular';

@NgModule({
    imports: [
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

      MatSidenavModule,
      MatProgressBarModule,
      MatTabsModule,
      MatDialogModule,
      MatProgressSpinnerModule,
      MatSelectModule,
      GooglePlaceModule,

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
      DataTableModule,
      PaginatorModule
    ],
    declarations: [
      ClientsComponent,
      CreateClientDialogComponent,
      LeadsComponent,
      OrdersComponent,
      EditionsComponent,
      CreateOrEditEditionModalComponent,
      TenantsComponent,
      CreateTenantModalComponent,
      EditTenantModalComponent,
      TenantFeaturesModalComponent,
      FeatureTreeComponent,
      EditionComboComponent,
      DashboardComponent,
      DashboardMenuComponent,
      LeadsStatsComponent
    ],
    entryComponents: [
        CreateClientDialogComponent
    ]
})
export class CrmModule {
}
