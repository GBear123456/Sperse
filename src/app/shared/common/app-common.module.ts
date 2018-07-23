/** Core imports */
import * as ngCommon from '@angular/common';
import { NgModule, ModuleWithProviders } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

/** Third party imports */
import {
    MatProgressBarModule, MatStepperModule, MatInputModule,
    MatDialogModule, MatTabsModule, MatSidenavModule, MatFormFieldModule
} from '@angular/material';
import {
    DxDropDownBoxModule, DxListModule, DxButtonModule, DxToolbarModule,
    DxMenuModule, DxTextBoxModule, DxValidationGroupModule, DxValidatorModule,
    DxSelectBoxModule, DxTextAreaModule, DxDataGridModule, DxContextMenuModule,
    DxTreeViewModule, DxRadioGroupModule, DxCheckBoxModule, DxPopupModule,
    DxScrollViewModule, DxTabsModule, DxTagBoxModule, DxProgressBarModule, DxTooltipModule
} from 'devextreme-angular';

import { DxiValidationRuleModule } from 'devextreme-angular/ui/nested/validation-rule-dxi';
import { TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/primeng';
import { ModalModule } from 'ngx-bootstrap';
import { FileDropModule } from 'ngx-file-drop';
import { PapaParseModule } from 'ngx-papaparse';
import { ImageCropperModule } from 'ng2-img-cropper';
import { ModalDialogComponent } from './dialogs/modal/modal-dialog.component';
import { ConfirmDialogComponent } from './dialogs/confirm/confirm-dialog.component';
import { SelectionFilterComponent } from './selection-filter/selection-filter.component';
import { BankAccountsWidgetsModule } from '@shared/cfo/bank-accounts-widgets/bank-accounts-widgets.module';

/** Application imports */
import { AbpModule } from '@abp/abp.module';
import { UtilsModule } from '@shared/utils/utils.module';
import { CommonModule } from '@shared/common/common.module';
import { UploadPhotoDialogComponent } from './upload-photo-dialog/upload-photo-dialog.component';
import { ImportWizardComponent } from './import-wizard/import-wizard.component';
import { ConfirmImportDialog } from './import-wizard/confirm-import-dialog/confirm-import-dialog.component';
import { ImportProgressBarComponent } from './import-wizard/import-progress-bar/import-progress-bar.component';
import { ContactInfoPanelComponent } from './contact-info-panel/contact-info-panel.component';
import { ToolBarComponent } from './toolbar/toolbar.component';
import { HeadLineComponent } from './headline/headline.component';
import { TimeZoneComboComponent } from './timing/timezone-combo.component';
import { JqPluginDirective } from './libs/jq-plugin.directive';
import { CommonLookupModalComponent } from './lookup/common-lookup-modal.component';
import { DateRangePickerComponent } from './timing/date-range-picker.component';
import { InplaceEditComponent } from './inplace-edit/inplace-edit.component';
import { DatePickerDirective } from './timing/date-picker.component';
import { PeriodComponent } from './period/period.component';
import { DateTimeService } from './timing/date-time.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppNavigationService } from '@app/shared/layout/nav/app-navigation.service';
import { InplaceSelectBoxComponent } from '@app/shared/common/inplace-select-box/inplace-select-box.component';

@NgModule({
    imports: [
        ngCommon.CommonModule,
        FormsModule,
        ModalModule.forRoot(),
        UtilsModule,
        AbpModule,
        CommonModule,
        TableModule,
        PaginatorModule,
        BankAccountsWidgetsModule,

        MatTabsModule,
        MatInputModule,
        MatSidenavModule,
        MatDialogModule,
        MatFormFieldModule,
        MatProgressBarModule,
        MatStepperModule,
        ReactiveFormsModule,
        FileDropModule,
        PapaParseModule,
        ImageCropperModule,

        DxListModule,
        DxContextMenuModule,
        DxButtonModule,
        DxToolbarModule,
        DxDropDownBoxModule,
        DxMenuModule,
        DxTextBoxModule,
        DxValidationGroupModule,
        DxValidatorModule,
        DxiValidationRuleModule,
        DxSelectBoxModule,
        DxTextAreaModule,
        DxDataGridModule,
        DxContextMenuModule,
        DxTreeViewModule,
        DxRadioGroupModule,
        DxCheckBoxModule,
        DxTextBoxModule,
        DxScrollViewModule,
        DxDataGridModule,
        DxSelectBoxModule,
        MatDialogModule,
        DxContextMenuModule,
        DxTabsModule,
        DxTagBoxModule,
        DxPopupModule,
        DxProgressBarModule,
        DxTooltipModule
    ],
    declarations: [
        TimeZoneComboComponent,
        JqPluginDirective,
        CommonLookupModalComponent,
        DateRangePickerComponent,
        DatePickerDirective,
        ToolBarComponent,
        HeadLineComponent,
        ContactInfoPanelComponent,
        InplaceEditComponent,
        InplaceSelectBoxComponent,
        PeriodComponent,
        ImportWizardComponent,
        ImportProgressBarComponent,
        ConfirmImportDialog,
        UploadPhotoDialogComponent,
        ConfirmDialogComponent,
        ModalDialogComponent,
        SelectionFilterComponent,
    ],
    exports: [
        TimeZoneComboComponent,
        JqPluginDirective,
        CommonLookupModalComponent,
        DateRangePickerComponent,
        DatePickerDirective,
        HeadLineComponent,
        ToolBarComponent,
        ContactInfoPanelComponent,
        InplaceEditComponent,
        InplaceSelectBoxComponent,
        PeriodComponent,
        ImportWizardComponent,
        ImportProgressBarComponent,
        ConfirmImportDialog,
        UploadPhotoDialogComponent,
        ConfirmDialogComponent,
        ModalDialogComponent,
        SelectionFilterComponent,
    ],
    providers: [
        DateTimeService,
        AppLocalizationService,
        AppNavigationService
    ],
    entryComponents: [
        ConfirmImportDialog,
        UploadPhotoDialogComponent,
        ConfirmDialogComponent,
        ModalDialogComponent
    ]
})
export class AppCommonModule {
    static forRoot(): ModuleWithProviders {
        return {
            ngModule: AppCommonModule,
            providers: []
        };
    }
}
