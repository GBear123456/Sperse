/** Core imports */
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import * as ngCommon from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

/** Third party modules */
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialogModule } from '@angular/material/dialog';
import { DxMenuModule } from 'devextreme-angular/ui/menu';
import { DxButtonModule } from 'devextreme-angular/ui/button';
import { DxTooltipModule } from 'devextreme-angular/ui/tooltip';
import { DxDropDownBoxModule } from 'devextreme-angular/ui/drop-down-box';
import { DxSelectBoxModule } from 'devextreme-angular/ui/select-box';
import { DxListModule } from 'devextreme-angular/ui/list';
import { DxScrollViewModule } from 'devextreme-angular/ui/scroll-view';
import { DxNavBarModule } from 'devextreme-angular/ui/nav-bar';
import { DxTextBoxModule } from 'devextreme-angular/ui/text-box';
import { DxAccordionModule } from 'devextreme-angular/ui/accordion';
import { ModalModule } from 'ngx-bootstrap/modal';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { PopoverModule } from 'ngx-bootstrap/popover';
import { FileUploadModule as PrimeNgFileUploadModule } from 'primeng/fileupload';
import { TableModule } from 'primeng/table';
import { ProgressBarModule } from 'primeng/progressbar';
import { PaginatorModule } from 'primeng/paginator';
import { SharedModule } from '../shared.module';

/** Application imports */
import { LayoutCommonModule } from './layout-common.module';
import { PlatformSelectComponent } from './platform-select/platform-select.component';
import { HeaderComponent } from './header/header.component';
import { SideBarComponent } from './side-bar/side-bar.component';
import { TopBarComponent } from './top-bar/top-bar.component';
import { LeftBarComponent } from './left-bar/left-bar.component';
import { FiltersModule } from '@shared/filters/filters.module';
import { UtilsModule } from '@shared/utils/utils.module';
import { LayoutService } from '@app/shared/layout/layout.service';
import { UserManagementModule } from '@shared/common/layout/user-management-list/user-management.module';
import { InplaceEditModule } from '@app/shared/common/inplace-edit/inplace-edit.module';

/** @todo Used for chart bar and dropdown. Reimplement in future */
import 'assets/metronic/src/js/framework/base/util.js';
import 'assets/metronic/src/js/framework/base/app.js';
import 'assets/metronic/src/js/framework/components/general/dropdown.js';
import 'assets/metronic/src/js/framework/components/general/offcanvas.js';
import { ContactInfoPanelComponent } from '@app/shared/common/contact-info-panel/contact-info-panel.component';
import { GlobalSearchComponent } from '@app/shared/layout/top-bar/global-search/global-search.component';
import { ClientsNavigationComponent } from '@app/shared/layout/top-bar/clients-navigation/clients-navigation.component';

import { NoDataModule } from '@shared/common/widgets/no-data/no-data.module';

let COMPONENTS = [
  PlatformSelectComponent,
  HeaderComponent,
  TopBarComponent,
  SideBarComponent,
  LeftBarComponent,
  ContactInfoPanelComponent,
  GlobalSearchComponent,
  ClientsNavigationComponent,
];

@NgModule({
  imports: [
    ngCommon.CommonModule,
    FormsModule,
    TooltipModule.forRoot(),
    PopoverModule.forRoot(),
    UtilsModule,
    FiltersModule,
    LayoutCommonModule,
    InplaceEditModule,

    DxListModule,
    DxMenuModule,
    DxScrollViewModule,
    DxButtonModule,
    DxTooltipModule,
    DxNavBarModule,
    DxDropDownBoxModule,
    DxTextBoxModule,
    DxSelectBoxModule,
    DxAccordionModule,

    MatTabsModule,
    MatDialogModule,

    PrimeNgFileUploadModule,
    ProgressBarModule,
    TableModule,
    PaginatorModule,
    UserManagementModule,
    NoDataModule,
    CommonModule,
    SharedModule,
  ],
  declarations: COMPONENTS,
  exports: COMPONENTS,
  providers: [LayoutService],
})
export class LayoutModule {}
