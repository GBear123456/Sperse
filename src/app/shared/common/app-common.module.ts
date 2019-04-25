/** Core imports */
import * as ngCommon from '@angular/common';
import { NgModule, ModuleWithProviders } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

/** Third party imports */
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatStepperModule } from '@angular/material/stepper';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSliderModule } from '@angular/material/slider';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { DxDropDownBoxModule } from 'devextreme-angular/ui/drop-down-box';
import { DxListModule } from 'devextreme-angular/ui/list';
import { DxButtonModule } from 'devextreme-angular/ui/button';
import { DxToolbarModule } from 'devextreme-angular/ui/toolbar';
import { DxMenuModule } from 'devextreme-angular/ui/menu';
import { DxTextBoxModule } from 'devextreme-angular/ui/text-box';
import { DxValidationGroupModule } from 'devextreme-angular/ui/validation-group';
import { DxValidatorModule } from 'devextreme-angular/ui/validator';
import { DxSelectBoxModule } from 'devextreme-angular/ui/select-box';
import { DxTextAreaModule } from 'devextreme-angular/ui/text-area';
import { DxDataGridModule } from 'devextreme-angular/ui/data-grid';
import { DxContextMenuModule } from 'devextreme-angular/ui/context-menu';
import { DxTreeViewModule } from 'devextreme-angular/ui/tree-view';
import { DxRadioGroupModule } from 'devextreme-angular/ui/radio-group';
import { DxPopupModule } from 'devextreme-angular/ui/popup';
import { DxSliderModule } from 'devextreme-angular/ui/slider';
import { DxCheckBoxModule } from 'devextreme-angular/ui/check-box';
import { DxTabsModule } from 'devextreme-angular/ui/tabs';
import { DxTagBoxModule } from 'devextreme-angular/ui/tag-box';
import { DxProgressBarModule } from 'devextreme-angular/ui/progress-bar';
import { DxTooltipModule } from 'devextreme-angular/ui/tooltip';
import { DxSwitchModule } from 'devextreme-angular/ui/switch';
import { DxTreeListModule } from 'devextreme-angular/ui/tree-list';
import { DxiValidationRuleModule } from 'devextreme-angular/ui/nested/validation-rule-dxi';

import { TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/primeng';
import { ModalModule } from 'ngx-bootstrap';
import { FileDropModule } from 'ngx-file-drop';
import { PapaParseModule } from 'ngx-papaparse';
import { ImageCropperModule } from 'ng2-img-cropper';
import { CreditCardDirectivesModule } from 'angular-cc-library';
import { AngularGooglePlaceModule } from 'angular-google-place';

/** Application imports */
import { AbpModule } from '@abp/abp.module';
import { UtilsModule } from '@shared/utils/utils.module';
import { CommonModule } from '@shared/common/common.module';
import { UploadPhotoDialogComponent } from './upload-photo-dialog/upload-photo-dialog.component';
import { ConfirmDialogComponent } from './dialogs/confirm/confirm-dialog.component';
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
import { InplaceSelectBoxComponent } from '@app/shared/common/inplace-select-box/inplace-select-box.component';
import { ImportWizardService } from '@app/shared/common/import-wizard/import-wizard.service';
import { RatingBarComponent } from './rating-bar/rating-bar.component';
import { PaymentWizardComponent } from './payment-wizard/payment-wizard.component';
import { PackageCardComponent } from './payment-wizard/package-chooser/package-card/package-card.component';
import { PackageChooserComponent } from './payment-wizard/package-chooser/package-chooser.component';
import { PaymentStatusComponent } from './payment-wizard/payment-status/payment-status.component';
import { PaymentOptionsComponent } from './payment-wizard/payment-options/payment-options.component';
import { PaymentOptionsFooterComponent } from '@app/shared/common/payment-wizard/payment-options/payment-options-footer/payment-options-footer.component';
import { CreditCardComponent } from './payment-wizard/payment-options/credit-card/credit-card.component';
import { PayPalComponent } from './payment-wizard/payment-options/pay-pal/pay-pal.component';
import { BankTransferComponent } from './payment-wizard/payment-options/bank-transfer/bank-transfer.component';
import { ECheckComponent } from './payment-wizard/payment-options/e-check/e-check.component';
import { UserAssignmentComponent } from '@app/crm/shared/user-assignment-list/user-assignment-list.component';
import { TagsListComponent } from '@app/crm/shared/tags-list/tags-list.component';
import { ListsListComponent } from '@app/crm/shared/lists-list/lists-list.component';
import { RatingComponent } from '@app/crm/shared/rating/rating.component';
import { StarsListComponent } from '@app/crm/shared/stars-list/stars-list.component';
import { TypesListComponent } from '@app/crm/shared/types-list/types-list.component';
import { StaticListComponent } from './static-list/static-list.component';
import { LoadingSpinnerComponent } from './loading-spinner/loading-spinner.component';

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

        MatTabsModule,
        MatInputModule,
        MatSidenavModule,
        MatDialogModule,
        MatFormFieldModule,
        MatProgressBarModule,
        MatStepperModule,
        MatButtonModule,
        MatSelectModule,
        MatTooltipModule,
        MatSliderModule,
        MatSlideToggleModule,
        MatAutocompleteModule,
        ReactiveFormsModule,
        FileDropModule,
        PapaParseModule,
        ImageCropperModule,

        DxListModule,
        DxCheckBoxModule,
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
        DxTextBoxModule,
        DxDataGridModule,
        DxSelectBoxModule,
        MatDialogModule,
        DxContextMenuModule,
        DxTabsModule,
        DxTagBoxModule,
        DxPopupModule,
        DxProgressBarModule,
        DxTooltipModule,
        DxSwitchModule,
        DxTreeListModule,
        DxSliderModule,
        CreditCardDirectivesModule,
        AngularGooglePlaceModule
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
        RatingBarComponent,
        PaymentWizardComponent,
        PackageCardComponent,
        PackageChooserComponent,
        PaymentStatusComponent,
        PaymentOptionsComponent,
        PaymentOptionsFooterComponent,
        CreditCardComponent,
        PayPalComponent,
        BankTransferComponent,
        ECheckComponent,
        StaticListComponent,
        UserAssignmentComponent,
        TagsListComponent,
        ListsListComponent,
        RatingComponent,
        StarsListComponent,
        TypesListComponent,
        LoadingSpinnerComponent
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
        RatingBarComponent,
        StaticListComponent,
        UserAssignmentComponent,
        TagsListComponent,
        ListsListComponent,
        RatingComponent,
        StarsListComponent,
        TypesListComponent,
        LoadingSpinnerComponent
    ],
    providers: [
        DateTimeService,
        ImportWizardService
    ],
    entryComponents: [
        ConfirmImportDialog,
        UploadPhotoDialogComponent,
        ConfirmDialogComponent,
        PaymentWizardComponent,
        CommonLookupModalComponent
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
