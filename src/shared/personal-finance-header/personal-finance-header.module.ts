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
import { MemberAreaNavigationComponent } from './member-area-navigation/member-area-navigation.component';
import { AppAreaNavigationComponent } from './app-area-navigation/app-area-navigation.component';
import { PersonalFinanceHeaderComponent } from './personal-finance-header.component';
//import { PersonalFinanceCommonModule } from '../../shared/common/personal-finance-common.module';
import { AppService } from '@app/app.service';
import { PagesHeaderComponent } from './pages-header/pages-header.component';
import { LayoutCommonModule } from '@app/shared/layout/layout-common.module';
//import { InstanceServiceProxy, TenantSubscriptionServiceProxy } from '@shared/service-proxies/service-proxies';

let COMPONENTS = [
    PagesHeaderComponent,
    PersonalFinanceHeaderComponent,
    AppAreaNavigationComponent,
    MemberAreaNavigationComponent
];

@NgModule({
    imports: [
        ngCommon.CommonModule,
        FormsModule,
        RouterModule,

        LayoutCommonModule
        //PersonalFinanceCommonModule,

        // ModalModule.forRoot(),
        // TooltipModule.forRoot(),
        // TabsModule.forRoot(),
        // PopoverModule.forRoot(),
        //
        // TableModule,
        // PaginatorModule,
        // AutoCompleteModule,
        // EditorModule,
        // PrimeNgFileUploadModule,
        // InputMaskModule
    ],
    declarations: COMPONENTS,
    exports: COMPONENTS,
    providers: [
        AppService,
        // InstanceServiceProxy,
        // TenantSubscriptionServiceProxy
    ]
})
export class PersonalFinanceHeaderModule { }
