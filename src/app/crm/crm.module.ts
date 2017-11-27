import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppCommonModule } from '@app/shared/common/app-common.module';

import { ModalModule, TabsModule, TooltipModule, PopoverModule } from 'ngx-bootstrap';

import { FileUploadModule } from '@node_modules/ng2-file-upload';
import { CrmRoutingModule } from './crm-routing.module';
import { FiltersModule } from '@shared/filters/filters.module';
import { PipelineModule } from '@app/shared/pipeline/pipeline.module';
import { ClientDetailsModule } from './clients/details/client-details.module';
import { UtilsModule } from '@shared/utils/utils.module';

import { ClientsComponent } from './clients/clients.component';
import { CreateOrEditClientModalComponent } from './clients/create-or-edit-client-modal.component';
import { LeadsComponent } from './leads/leads.component';
import { OrdersComponent } from './orders/orders.component';
import { EditionsComponent } from './editions/editions.component';
import { CreateOrEditEditionModalComponent } from './editions/create-or-edit-edition-modal.component';
import { TenantsComponent } from './tenants/tenants.component';
import { CreateTenantModalComponent } from './tenants/create-tenant-modal.component';
import { EditTenantModalComponent } from './tenants/edit-tenant-modal.component';
import { TenantFeaturesModalComponent } from './tenants/tenant-features-modal.component';

import { EditionComboComponent } from './shared/edition-combo.component';
import { FeatureTreeComponent } from './shared/feature-tree.component';

import {
    DxDataGridModule,
    DxToolbarModule,
    DxTemplateModule,
    DxDateBoxModule,
    DxTextBoxModule,
    DxValidatorModule,
    DxValidationSummaryModule,
    DxButtonModule,
    DxFileUploaderModule,
    DxSelectBoxModule
} from 'devextreme-angular';

@NgModule({
    imports: [
      FormsModule,
      CommonModule,
      DxDataGridModule,
      DxToolbarModule,
      DxTemplateModule,
      DxDateBoxModule,
      DxTextBoxModule,
      DxValidatorModule,
      DxValidationSummaryModule,
      DxButtonModule,
      DxFileUploaderModule,
      DxSelectBoxModule,

      ClientDetailsModule,
      FileUploadModule,
      ModalModule.forRoot(),
      TabsModule.forRoot(),
      TooltipModule.forRoot(),
      PopoverModule.forRoot(),
      CrmRoutingModule,
      UtilsModule,
      AppCommonModule,
      FiltersModule,
      PipelineModule
    ],
    declarations: [
      ClientsComponent,
      CreateOrEditClientModalComponent,
      LeadsComponent,
      OrdersComponent,
      EditionsComponent,
      CreateOrEditEditionModalComponent,
      TenantsComponent,
      CreateTenantModalComponent,
      EditTenantModalComponent,
      TenantFeaturesModalComponent,
      FeatureTreeComponent,
      EditionComboComponent
    ]
})
export class CrmModule {
}
