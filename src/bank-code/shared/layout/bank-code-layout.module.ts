/** Core imports */
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

/** Application imports */
import { LayoutCommonModule } from '@app/shared/layout/layout-common.module';
import { UserManagementModule } from '@shared/common/layout/user-management-list/user-management.module';
import { BankCodeHeaderComponent, AdHeaderHostDirective } from './bank-code-header.component';
import { BankCodeLayoutService } from './bank-code-layout.service';
import { AreaNavigationModule } from '@shared/common/area-navigation/area-navigation.module';

let COMPONENTS = [
    AdHeaderHostDirective,
    BankCodeHeaderComponent
];

@NgModule({
    imports: [
        AreaNavigationModule,
        CommonModule,
        RouterModule,
        LayoutCommonModule,
        UserManagementModule
    ],
    declarations: COMPONENTS,
    exports: COMPONENTS,
    providers: [
        BankCodeLayoutService
    ]
})
export class BankCodeLayoutModule { }
