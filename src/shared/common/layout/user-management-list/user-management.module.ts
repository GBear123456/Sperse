import { NgModule } from '@angular/core';
import { UserDropdownMenuComponent } from '@shared/common/layout/user-management-list/user-dropdown-menu/user-dropdown-menu.component';
import { UserManagementListComponent } from '@shared/common/layout/user-management-list/user-management-list.component';
import { UserManagementService } from '@shared/common/layout/user-management-list/user-management.service';
import { CommonModule } from '@angular/common';
import { ImpersonationService } from '@admin/users/impersonation.service';

@NgModule({
    declarations: [
        UserManagementListComponent,
        UserDropdownMenuComponent
    ],
    imports: [
        CommonModule
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
