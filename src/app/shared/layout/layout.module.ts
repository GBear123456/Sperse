/** Core imports */
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import * as ngCommon from '@angular/common';
import { FormsModule } from '@angular/forms';

/** Third party modules */
import { MatTabsModule } from '@angular/material';
import {
    DxMenuModule, DxScrollViewModule, DxButtonModule,
    DxDropDownBoxModule, DxListModule, DxNavBarModule
} from 'devextreme-angular';
import { ModalModule, TabsModule, TooltipModule, PopoverModule } from 'ngx-bootstrap';
import { FileUploadModule as PrimeNgFileUploadModule, ProgressBarModule, PaginatorModule } from 'primeng/primeng';
import { TableModule } from 'primeng/table';

/** Application imports */
import { LayoutCommonModule } from './layout-common.module';
import { PlatformSelectComponent } from './platform-select.component';
import { HeaderComponent } from './header.component';
import { SideBarComponent } from './side-bar.component';
import { TopBarComponent } from './top-bar.component';
import { FiltersModule } from '@shared/filters/filters.module';
import { UtilsModule } from '@shared/utils/utils.module'
import { LayoutService } from '@app/shared/layout/layout.service';

let COMPONENTS = [
    PlatformSelectComponent,
    HeaderComponent,
    TopBarComponent,
    SideBarComponent
];

@NgModule({
    imports: [
        ngCommon.CommonModule,
        FormsModule,
        RouterModule,
        ModalModule.forRoot(),
        TooltipModule.forRoot(),
        TabsModule.forRoot(),
        PopoverModule.forRoot(),
        UtilsModule,
        FiltersModule,
        LayoutCommonModule,

        DxListModule,
        DxMenuModule,
        DxScrollViewModule,
        DxButtonModule,
        DxNavBarModule,
        DxDropDownBoxModule,

        MatTabsModule,

        PrimeNgFileUploadModule,
        ProgressBarModule,
        TableModule,
        PaginatorModule
    ],
    declarations: COMPONENTS,
    exports: COMPONENTS,
    providers: [
        LayoutService
    ]
})
export class LayoutModule {}
