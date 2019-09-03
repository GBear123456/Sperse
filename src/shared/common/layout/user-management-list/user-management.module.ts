/** Core imports */
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

/** Third party imports */
import { DxScrollViewModule } from 'devextreme-angular/ui/scroll-view';

/** Application imports */
import { UserDropdownMenuComponent } from '@shared/common/layout/user-management-list/user-dropdown-menu/user-dropdown-menu.component';
import { UserManagementListComponent } from '@shared/common/layout/user-management-list/user-management-list.component';
import { UserManagementService } from '@shared/common/layout/user-management-list/user-management.service';
import { ImpersonationService } from '@admin/users/impersonation.service';
import { BankCodeLettersModule } from '@app/shared/common/bank-code-letters/bank-code-letters.module';

@NgModule({
    declarations: [
        UserManagementListComponent,
        UserDropdownMenuComponent
    ],
    imports: [
        CommonModule,
        DxScrollViewModule,
        BankCodeLettersModule
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
