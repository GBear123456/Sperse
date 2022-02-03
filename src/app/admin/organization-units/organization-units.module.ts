import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { TreeDragDropService } from 'primeng/api';
import { OrganizationUnitsRoutingModule } from './organization-units-routing.module';
import { AppBsModalModule } from '@shared/common/appBsModal/app-bs-modal.module';
import { AddMemberModalComponent } from './add-member-modal.component';
import { AddRoleModalComponent } from './add-role-modal.component';
import { CreateOrEditUnitModalComponent } from './create-or-edit-unit-modal.component';
import { OrganizationTreeComponent } from './organization-tree.component';
import { OrganizationUnitMembersComponent } from './organization-unit-members.component';
import { OrganizationUnitRolesComponent } from './organization-unit-roles.component';
import { OrganizationUnitsComponent } from './organization-units.component';
import { EntityTypeHistoryModalComponent } from '@app/shared/common/entityHistory/entity-type-history-modal.component';
import { EntityChangeDetailModalComponent } from '@app/shared/common/entityHistory/entity-change-detail-modal.component';
import { DateTimeService } from '@app/shared/common/timing/date-time.service';
import { DateTimeModule } from '@shared/common/pipes/datetime/datetime.module';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { EditorModule } from 'primeng/editor';
import { InputMaskModule } from 'primeng/inputmask';
import { ImageCropperModule } from 'ngx-image-cropper';
import { DropdownModule } from 'primeng/dropdown';
import { TabsModule, TabsetConfig } from 'ngx-bootstrap/tabs';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { UtilsModule } from '@shared/utils/utils.module';
import { ContextMenuModule } from 'primeng/contextmenu';
import { ModalModule } from 'ngx-bootstrap/modal';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { TableModule } from 'primeng/table';
import { DragDropModule } from 'primeng/dragdrop';
import { PaginatorModule } from 'primeng/paginator';
import { TreeModule } from 'primeng/tree';

@NgModule({
    declarations: [
        AddMemberModalComponent,
        AddRoleModalComponent,
        CreateOrEditUnitModalComponent,
        OrganizationTreeComponent,
        OrganizationUnitMembersComponent,
        OrganizationUnitRolesComponent,
        OrganizationUnitsComponent,
        EntityTypeHistoryModalComponent,
        EntityChangeDetailModalComponent
    ],
    imports: [
        FormsModule,
        CommonModule,
        DateTimeModule.forRoot(),
        ReactiveFormsModule,
        ModalModule.forRoot(),
        AppBsModalModule,
        UtilsModule,
        TabsModule,
        EditorModule,
        TooltipModule,
        DragDropModule,
        InputMaskModule,
        AutoCompleteModule,
        ImageCropperModule,
        TreeModule,
        TableModule,
        DropdownModule,
        ContextMenuModule,
        PaginatorModule,
        OrganizationUnitsRoutingModule
    ],
    exports: [
        AppBsModalModule,
        AddMemberModalComponent, 
        AddRoleModalComponent, 
        OrganizationTreeComponent
    ],
    providers: [
        TreeDragDropService,
        TabsetConfig, 
        BsModalRef, 
        DateTimeService
    ]
})
export class OrganizationUnitsModule {}