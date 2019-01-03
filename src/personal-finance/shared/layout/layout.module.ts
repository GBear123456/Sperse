/** Core imports */
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import * as ngCommon from '@angular/common';
import { FormsModule } from '@angular/forms';

/** Third party modules */
import { ModalModule, TabsModule, TooltipModule, PopoverModule } from 'ngx-bootstrap';
import { TableModule } from 'primeng/table';
import { AutoCompleteModule, EditorModule, FileUploadModule as PrimeNgFileUploadModule, InputMaskModule, PaginatorModule } from 'primeng/primeng';

/** Application imports */
import { LayoutCommonModule } from '@app/shared/layout/layout-common.module';
import { PersonalFinanceCommonModule } from '../../shared/common/personal-finance-common.module';
import { AppService } from '@app/app.service';
import { InstanceServiceProxy, TenantSubscriptionServiceProxy } from '@shared/service-proxies/service-proxies';
import { PersonalFinanceHeaderComponent } from '@shared/personal-finance-layout/personal-finance-header.component';
import { PersonalFinanceFooterComponent } from '@shared/personal-finance-layout/personal-finance-footer.component';
import { UserManagementListComponent } from './user-management-list/user-management-list.component';

let COMPONENTS = [
    UserManagementListComponent
];

@NgModule({
    imports: [
        ngCommon.CommonModule,
        FormsModule,
        RouterModule,

        LayoutCommonModule,
        PersonalFinanceCommonModule,
        ModalModule.forRoot(),
        TooltipModule.forRoot(),
        TabsModule.forRoot(),
        PopoverModule.forRoot(),

        TableModule,
        PaginatorModule,
        AutoCompleteModule,
        EditorModule,
        PrimeNgFileUploadModule,
        InputMaskModule
    ],
    declarations: COMPONENTS,
    exports: COMPONENTS,
    entryComponents: COMPONENTS,
    providers: [
        AppService,
        InstanceServiceProxy,
        TenantSubscriptionServiceProxy
    ]
})
export class LayoutModule { }
