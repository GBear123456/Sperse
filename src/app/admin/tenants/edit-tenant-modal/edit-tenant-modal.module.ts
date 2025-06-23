/** Core imports */
import * as ngCommon from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';

/** Third party imports */
import { ModulesEditionsSelectComponent, ClearIconSvgComponent } from '@admin/tenants/modules-edtions-select/modules-editions-select.component';
import { DxCheckBoxModule } from 'devextreme-angular/ui/check-box';
import { DxScrollViewModule } from 'devextreme-angular/ui/scroll-view';
import { TabsModule } from 'ngx-bootstrap/tabs';

/** Application imports */
import {
    TenantSubscriptionServiceProxy
} from '@shared/service-proxies/service-proxies';
import { EditTenantModalComponent } from '@app/admin/tenants/edit-tenant-modal/edit-tenant-modal.component';
import { ModalDialogModule } from '@shared/common/dialogs/modal/modal-dialog.module';
import { FeaturesModule } from '@app/shared/features/features.module';

@NgModule({
    declarations: [
        EditTenantModalComponent,
        ModulesEditionsSelectComponent, 
        ClearIconSvgComponent
    ],
    imports: [
        FormsModule,
        DxCheckBoxModule,
        ngCommon.CommonModule,
        DxScrollViewModule,
        ModalDialogModule,
        FeaturesModule,
        TabsModule
    ],
    providers: [
    ],
    entryComponents: [
        EditTenantModalComponent
    ]
})
export class EditTenantModule {}