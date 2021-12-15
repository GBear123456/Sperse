/** Core imports */
import { ComponentFactoryResolver, NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import * as ngCommon from '@angular/common';
import { FormsModule } from '@angular/forms';

/** Third party modules */
import { ModalModule } from 'ngx-bootstrap/modal';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { PopoverModule } from 'ngx-bootstrap/popover';

import { TableModule } from 'primeng/table';
import { AutoCompleteModule, EditorModule, FileUploadModule as PrimeNgFileUploadModule, InputMaskModule, PaginatorModule } from 'primeng/primeng';

/** Application imports */
import { LayoutCommonModule } from '@app/shared/layout/layout-common.module';
import { PersonalFinanceCommonModule } from '../../shared/common/personal-finance-common.module';
import { InstanceServiceProxy, TenantSubscriptionServiceProxy } from '@shared/service-proxies/service-proxies';
import { UserManagementListComponent } from '../../../shared/common/layout/user-management-list/user-management-list.component';
import { PersonalFinanceLayoutService } from '@shared/personal-finance-layout/personal-finance-layout.service';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { ImpersonationService } from '@admin/users/impersonation.service';
import { UserManagementModule } from '@shared/common/layout/user-management-list/user-management.module';

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
        InputMaskModule,
        UserManagementModule
    ],
    providers: [
        InstanceServiceProxy,
        TenantSubscriptionServiceProxy,
        ImpersonationService
    ]
})
export class LayoutModule {
    constructor(
        private pfmLayoutService: PersonalFinanceLayoutService,
        private componentFactoryResolver: ComponentFactoryResolver,
        private sessionService: AppSessionService
    ) {
        if (this.sessionService.userId !== null) {
            this.pfmLayoutService.headerContentUpdate(
                this.componentFactoryResolver.resolveComponentFactory(UserManagementListComponent)
            );
        }
    }
}