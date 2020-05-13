/** Core imports */
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

/** Third party imports */
import { DxSelectBoxModule } from 'devextreme-angular/ui/select-box';

/** Application imports */
import { LayoutCommonModule } from '@app/shared/layout/layout-common.module';
import { UserManagementModule } from '@shared/common/layout/user-management-list/user-management.module';
import { BankCodeHeaderComponent } from './bank-code-header.component';
import { BankCodeLayoutService } from './bank-code-layout.service';
import { AreaNavigationModule } from '@shared/common/area-navigation/area-navigation.module';
import { FooterComponent } from '../footer/footer.component';
import { ProductsMenuComponent } from './products-menu/products-menu.component';

let COMPONENTS = [
    BankCodeHeaderComponent,
    FooterComponent,
    ProductsMenuComponent
];

@NgModule({
    imports: [
        AreaNavigationModule,
        DxSelectBoxModule,
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
export class BankCodeLayoutModule {}
