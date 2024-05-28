/** Core imports */
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

/** Third party imports */
import { DxScrollViewModule } from 'devextreme-angular/ui/scroll-view';
import { DxTooltipModule } from 'devextreme-angular/ui/tooltip';
import { DxListModule } from 'devextreme-angular/ui/list';

/** Application imports */
import { ActionMenuModule } from '@app/shared/common/action-menu/action-menu.module';
import { UserDropdownMenuComponent } from '@shared/common/layout/user-management-list/user-dropdown-menu/user-dropdown-menu.component';
import { UserManagementListComponent } from '@shared/common/layout/user-management-list/user-management-list.component';
import { UserManagementService } from '@shared/common/layout/user-management-list/user-management.service';
import { ImpersonationService } from '@admin/users/impersonation.service';
import { BankCodeLettersModule } from '@app/shared/common/bank-code-letters/bank-code-letters.module';
import { InplaceEditModule } from '@app/shared/common/inplace-edit/inplace-edit.module';
import { AccessCodeInstructionsModule } from '@shared/common/access-code-instructions/access-code-instructions.module';

@NgModule({
    declarations: [
        UserManagementListComponent,
        UserDropdownMenuComponent
    ],
    imports: [
        CommonModule,
        DxScrollViewModule,
        DxTooltipModule,
        DxListModule,
        ActionMenuModule,
        BankCodeLettersModule,
        InplaceEditModule,
        AccessCodeInstructionsModule
    ],
    exports: [
        UserManagementListComponent,
        UserDropdownMenuComponent,
    ],
    providers: [
        ImpersonationService,
        UserManagementService
    ],
    entryComponents: [
        UserManagementListComponent
    ]
})
export class UserManagementModule {}
