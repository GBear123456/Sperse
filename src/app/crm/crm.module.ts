/** Core imports */
import { NgModule } from '@angular/core';
import * as ngCommon from '@angular/common';
import { FormsModule } from '@angular/forms';

/** Third party imports */
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { Store } from '@ngrx/store';
import { DxListModule } from 'devextreme-angular/ui/list';
import { DxTreeListModule } from 'devextreme-angular/ui/tree-list';
import { DxTooltipModule } from 'devextreme-angular/ui/tooltip';
import { DxDataGridModule } from 'devextreme-angular/ui/data-grid';
import { DxToolbarModule } from 'devextreme-angular/ui/toolbar';
import { DxTemplateModule } from 'devextreme-angular/core';
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
import { DxFileManagerModule } from 'devextreme-angular';
import { FileUploadModule } from 'ng2-file-upload';
import { GooglePlaceModule } from 'ngx-google-places-autocomplete';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { AppService } from '@app/app.service';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { PipelineModule } from '@app/shared/pipeline/pipeline.module';
import { UtilsModule } from '@shared/utils/utils.module';
import { CRMDashboardWidgetsModule } from '@shared/crm/dashboard-widgets/dashboard-widgets.module';
import { CrmRoutingModule } from './crm-routing.module';
import { ClientsComponent } from './clients/clients.component';
import { PartnersComponent } from './partners/partners.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { DocumentsComponent } from './documents/documents.component';
import { LeftMenuComponent } from './shared/common/left-menu/left-menu.component';
import { CommissionHistoryComponent } from './commission-history/commission-history.component';
import { LeadsComponent } from './leads/leads.component';
import { OrdersComponent } from './orders/orders.component';
import { OrdersHeaderDropdownComponent } from './orders/orders-header-dropdown/orders-header-dropdown.component';
import { InvoicesComponent } from './invoices/invoices.component';
import { ImportLeadsComponent } from './import-leads/import-leads.component';
import { ImportListComponent } from './import-leads/import-list/import-list.component';
import { ImportLeadsService } from './import-leads/import-leads.service';
import { ActivityComponent } from './activity/activity.component';
import { CreateActivityDialogComponent } from './activity/create-activity-dialog/create-activity-dialog.component';
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
import { SourceContactListModule } from '@shared/common/source-contact-list/source-contact-list.module';
import { LoadingSpinnerModule } from '@app/shared/common/loading-spinner/loading-spinner.module';
import { AppPermissions } from '@shared/AppPermissions';
import { BankCodeLettersModule } from '@app/shared/common/bank-code-letters/bank-code-letters.module';
import { SliceModule } from '@app/shared/common/slice/slice.module';
import { MapModule } from '@app/shared/common/slice/map/map.module';
import { OrderDropdownModule } from '@app/crm/shared/order-dropdown/order-dropfown.module';
import { ActionMenuModule } from '@app/shared/common/action-menu/action-menu.module';
import { InvoiceGridMenuModule } from '@app/crm/invoices/invoice-grid-menu/invoice-grid-menu.module'
import { ReportsComponent } from '@app/crm/reports/reports.component';
import { TypesDropdownComponent } from '@app/crm/shared/types-dropdown/types-dropdown.component';
import { LeftMenuService } from '../cfo/shared/common/left-menu/left-menu.service';
import { StaticListModule } from '../shared/common/static-list/static-list.module';
import { StaticTreeViewModule } from '../shared/common/static-tree-view/static-tree-view.module';
import { CountryPhoneNumberModule } from '@shared/common/phone-numbers/country-phone-number.module';
import { ModalDialogModule } from '@shared/common/dialogs/modal/modal-dialog.module';
import { ListsModule } from '../shared/common/lists/lists.module';
import { CalendarService } from '@app/shared/common/calendar-button/calendar.service';
import { EntityCheckListDialogComponent } from '@app/crm/shared/entity-check-list-dialog/entity-check-list-dialog.component';
import { CommissionEarningsDialogComponent } from '@app/crm/commission-history/commission-earnings-dialog/commission-earnings-dialog.component';
import { LedgerCompleteDialogComponent } from '@app/crm/commission-history/ledger-complete-dialog/ledger-complete-dialog.component';
import { RequestWithdrawalDialogComponent } from '@app/crm/commission-history/request-withdrawal-dialog/request-withdrawal-dialog.component';
import { UpdateCommissionableDialogComponent } from '@app/crm/commission-history/update-commissionable-dialog/update-commissionable-dialog.component';
import { UpdateCommissionRateDialogComponent } from '@app/crm/commission-history/update-rate-dialog/update-rate-dialog.component';
import { EditTypeItemDialogComponent } from '@app/crm/shared/types-dropdown/edit-type-item-dialog/edit-type-item-dialog.component';
import { TenantSettingsWizardModule } from '@shared/common/tenant-settings-wizard/tenant-settings-wizard.module';
import { ProductsComponent } from './products/products.component';
import { CouponsComponent } from './coupons/coupons.component';
import { AddCouponDialogComponent } from './coupons/add-coupon-dialog/add-coupon-dialog.component';
import { CrmContactGroupGuard } from './crm-contact-group-guard';

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
        DxFileManagerModule,

        MatSidenavModule,
        MatProgressBarModule,
        MatTabsModule,
        MatDialogModule,
        MatProgressSpinnerModule,
        MatSelectModule,
        MatStepperModule,
        SourceContactListModule,
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
        ActionMenuModule,
        InvoiceGridMenuModule,
        StaticListModule,
        StaticTreeViewModule,
        CountryPhoneNumberModule,
        ModalDialogModule,
        ListsModule,
        GooglePlaceModule,
        MatInputModule,
        MatButtonModule,
        TenantSettingsWizardModule
    ],
    declarations: [
        ClientsComponent,
        DocumentsComponent,
        PartnersComponent,
        ProductsComponent,
        CouponsComponent,
        AddCouponDialogComponent,
        LeadsComponent,
        OrdersComponent,
        InvoicesComponent,
        ReportsComponent,
        DashboardComponent,
        LeftMenuComponent,
        ImportListComponent,
        ImportLeadsComponent,
        InvoiceAddressDialog,
        CreateActivityDialogComponent,
        BankSettingsDialogComponent,
        CrmIntroComponent,
        ActivityComponent,
        TypesDropdownComponent,
        EntityCheckListDialogComponent,
        OrdersHeaderDropdownComponent,
        CommissionHistoryComponent,
        CommissionEarningsDialogComponent,
        LedgerCompleteDialogComponent,
        RequestWithdrawalDialogComponent,
        UpdateCommissionableDialogComponent,
        UpdateCommissionRateDialogComponent,
        EditTypeItemDialogComponent
    ],
    providers: [
        ImportServiceProxy,
        ImportLeadsService,
        DataSourceService,
        LeftMenuService,
        CalendarService,
        CrmContactGroupGuard,
        { provide: 'leftMenuCollapsed', useValue: AppConsts.isMobile },
        { provide: 'showGlobalSearch', useValue: true }
    ],
    entryComponents: [
        AddCouponDialogComponent,
        BankSettingsDialogComponent,
        InvoiceAddressDialog,
        CreateActivityDialogComponent,
        CrmIntroComponent,
        EntityCheckListDialogComponent,
        CommissionEarningsDialogComponent,
        LedgerCompleteDialogComponent,
        RequestWithdrawalDialogComponent,
        UpdateCommissionableDialogComponent,
        UpdateCommissionRateDialogComponent,
        EditTypeItemDialogComponent
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
            if (this.permissionService.isGranted(AppPermissions.CRM)) {
                this.store$.dispatch(new PipelinesStoreActions.LoadRequestAction(false));
            }
        }
    }
}