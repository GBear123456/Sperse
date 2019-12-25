/** Core imports */
import { NgModule } from '@angular/core';
import * as ngCommon from '@angular/common';
import { FormsModule } from '@angular/forms';

/** Third party imports */
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { Store } from '@ngrx/store';
import { AngularGooglePlaceModule } from 'angular-google-place';
import { DxListModule } from 'devextreme-angular/ui/list';
import { DxTreeListModule } from 'devextreme-angular/ui/tree-list';
import { DxTooltipModule } from 'devextreme-angular/ui/tooltip';
import { DxDataGridModule } from 'devextreme-angular/ui/data-grid';
import { DxToolbarModule } from 'devextreme-angular/ui/toolbar';
import { DxTemplateModule } from 'devextreme-angular/core/template';
import { DxDateBoxModule } from 'devextreme-angular/ui/date-box';
import { DxTextBoxModule } from 'devextreme-angular/ui/text-box';
import { DxValidatorModule } from 'devextreme-angular/ui/validator';
import { DxValidationSummaryModule } from 'devextreme-angular/ui/validation-summary';
import { DxValidationGroupModule } from 'devextreme-angular/ui/validation-group';
import { DxButtonModule } from 'devextreme-angular/ui/button';
import { DxFileUploaderModule } from 'devextreme-angular/ui/file-uploader';
import { DxSelectBoxModule } from 'devextreme-angular/ui/select-box';
import { DxPivotGridModule } from 'devextreme-angular/ui/pivot-grid';
import { DxNumberBoxModule } from 'devextreme-angular/ui/number-box';
import { DxScrollViewModule } from 'devextreme-angular/ui/scroll-view';
import { DxTextAreaModule } from 'devextreme-angular/ui/text-area';
import { DxContextMenuModule } from 'devextreme-angular/ui/context-menu';
import { DxSliderModule } from 'devextreme-angular/ui/slider';
import { DxRadioGroupModule } from 'devextreme-angular/ui/radio-group';
import { DxCheckBoxModule } from 'devextreme-angular/ui/check-box';
import { DxTagBoxModule } from 'devextreme-angular/ui/tag-box';
import { DxDropDownBoxModule } from 'devextreme-angular/ui/drop-down-box';
import { DxSchedulerModule } from 'devextreme-angular/ui/scheduler';
import { DxPopoverModule } from 'devextreme-angular/ui/popover';
import { DxCalendarModule } from 'devextreme-angular/ui/calendar';
import { FileUploadModule } from 'ng2-file-upload';

/** Application imports */
import { AppService } from '@app/app.service';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { PipelineModule } from '@app/shared/pipeline/pipeline.module';
import { DeleteAndReassignDialogComponent } from '@app/crm/shared/delete-and-reassign-dialog/delete-and-reassign-dialog.component';
import { UtilsModule } from '@shared/utils/utils.module';
import { CRMDashboardWidgetsModule } from '@shared/crm/dashboard-widgets/dashboard-widgets.module';
import { CrmRoutingModule } from './crm-routing.module';
import { ClientsComponent } from './clients/clients.component';
import { PartnersComponent } from './partners/partners.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { DashboardMenuComponent } from './dashboard/left-menu/left-menu.component';
import { LeadsComponent } from './leads/leads.component';
import { OrdersComponent } from './orders/orders.component';
import { ImportLeadsComponent } from './import-leads/import-leads.component';
import { ImportListComponent } from './import-leads/import-list/import-list.component';
import { ImportLeadsService } from './import-leads/import-leads.service';
import { ActivityComponent } from './activity/activity.component';
import { CreateActivityDialogComponent } from './activity/create-activity-dialog/create-activity-dialog.component';
import { CreateInvoiceDialogComponent } from './shared/create-invoice-dialog/create-invoice-dialog.component';
import { InvoiceAddressDialog } from './shared/create-invoice-dialog/invoice-address-dialog/invoice-address-dialog.component';
import { BankSettingsDialogComponent } from './shared/bank-settings-dialog/bank-settings-dialog.component';
import { CrmIntroComponent } from './shared/crm-intro/crm-intro.component';
import { SharedIntroStepsModule } from '@shared/shared-intro-steps/shared-intro-steps.module';
import { ImportServiceProxy } from '@shared/service-proxies/service-proxies';
import { ContactsModule } from './contacts/contacts.module';
import { AppStoreService } from '@app/store/app-store.service';
import { AppCommonModule } from '@app/shared/common/app-common.module';
import { CommonModule } from '@shared/common/common.module';
import { DataSourceService } from '@app/shared/common/data-source/data-source.service';
import { PipelinesStoreActions } from '@app/crm/store';
import { AppStore } from '@app/store';
import { LoadingSpinnerModule } from '@app/shared/common/loading-spinner/loading-spinner.module';
import { AppPermissions } from '@shared/AppPermissions';
import { BankCodeLettersModule } from '@app/shared/common/bank-code-letters/bank-code-letters.module';
import { SliceModule } from '@app/shared/common/slice/slice.module';
import { MapModule } from '@app/shared/common/slice/map/map.module';
import { OrderDropdownModule } from '@app/crm/shared/order-dropdown/order-dropfown.module';
import { ActionMenuModule } from '@app/shared/common/action-menu/action-menu.module';

@NgModule({
    imports: [
        CrmRoutingModule,
        FormsModule,
        ngCommon.CommonModule,
        CommonModule,
        AppCommonModule,
        DxDropDownBoxModule,
        DxTreeListModule,
        DxDataGridModule,
        DxPivotGridModule,
        DxToolbarModule,
        DxTemplateModule,
        DxDateBoxModule,
        DxTextBoxModule,
        DxValidatorModule,
        DxValidationGroupModule,
        DxValidationSummaryModule,
        DxButtonModule,
        DxFileUploaderModule,
        DxSelectBoxModule,
        DxNumberBoxModule,
        DxScrollViewModule,
        DxTextAreaModule,
        DxContextMenuModule,
        DxTooltipModule,
        DxListModule,
        DxSliderModule,
        DxRadioGroupModule,
        DxCheckBoxModule,
        DxTagBoxModule,
        DxSchedulerModule,
        DxPopoverModule,
        DxCalendarModule,

        MatSidenavModule,
        MatProgressBarModule,
        MatTabsModule,
        MatDialogModule,
        MatProgressSpinnerModule,
        MatSelectModule,
        MatStepperModule,
        AngularGooglePlaceModule,

        CRMDashboardWidgetsModule,
        ContactsModule,
        FileUploadModule,
        UtilsModule,
        PipelineModule,
        SharedIntroStepsModule,
        LoadingSpinnerModule,
        BankCodeLettersModule,
        SliceModule,
        MapModule,
        OrderDropdownModule,
        ActionMenuModule
    ],
    declarations: [
        ClientsComponent,
        PartnersComponent,
        LeadsComponent,
        OrdersComponent,
        DashboardComponent,
        DashboardMenuComponent,
        ImportListComponent,
        ImportLeadsComponent,
        DeleteAndReassignDialogComponent,
        InvoiceAddressDialog,
        CreateInvoiceDialogComponent,
        CreateActivityDialogComponent,
        BankSettingsDialogComponent,
        CrmIntroComponent,
        ActivityComponent
    ],
    providers: [
        AppStoreService,
        ImportServiceProxy,
        ImportLeadsService,
        DataSourceService
    ],
    entryComponents: [
        BankSettingsDialogComponent,
        InvoiceAddressDialog,
        CreateInvoiceDialogComponent,
        CreateActivityDialogComponent,
        DeleteAndReassignDialogComponent,
        CrmIntroComponent
    ]
})
export class CrmModule {
    private readonly name = 'CRM';

    constructor(
        private appService: AppService,
        private appStoreService: AppStoreService,
        private importLeadsService: ImportLeadsService,
        private permissionService: AppPermissionService,
        private store$: Store<AppStore.State>
    ) {
        if (abp.session.userId) {
            setTimeout(() => this.appStoreService.loadUserDictionaries(), 2000);
            if (permissionService.isGranted(AppPermissions.CRMBulkImport))
                appService.subscribeModuleChange((config) => {
                    if (config['name'] == this.name)
                        importLeadsService.setupImportCheck();
                    else
                        importLeadsService.stopImportCheck();
                });
            this.store$.dispatch(new PipelinesStoreActions.LoadRequestAction(false));
        }
    }
}
