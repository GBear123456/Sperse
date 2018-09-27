/** Core imports */
import * as ngCommon from '@angular/common';
import { NgModule, ModuleWithProviders } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

/** Third party imports */
import {
    MatProgressBarModule,
    MatStepperModule,
    MatInputModule,
    MatDialogModule,
    MatTabsModule,
    MatSidenavModule,
    MatFormFieldModule,
    MatButtonModule,
    MatSelectModule,
    MatTooltipModule,
    MatSliderModule,
    MatAutocompleteModule,
    MatSlideToggleModule
} from '@angular/material';
import {
    DxDropDownBoxModule, DxListModule, DxButtonModule, DxToolbarModule,
    DxMenuModule, DxTextBoxModule, DxValidationGroupModule, DxValidatorModule,
    DxSelectBoxModule, DxTextAreaModule, DxDataGridModule, DxContextMenuModule,
    DxTreeViewModule, DxRadioGroupModule, DxPopupModule, DxSliderModule,
    DxTabsModule, DxTagBoxModule, DxProgressBarModule, DxTooltipModule, DxSwitchModule, DxTreeListModule
} from 'devextreme-angular';
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
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppNavigationService } from '@app/shared/layout/nav/app-navigation.service';
import { InplaceSelectBoxComponent } from '@app/shared/common/inplace-select-box/inplace-select-box.component';
import { ImportWizardService } from '@app/shared/common/import-wizard/import-wizard.service';
import { RatingBarComponent } from './rating-bar/rating-bar.component';
import { PaymentWizardComponent } from './payment-wizard/payment-wizard.component';
import { PackageCardComponent } from './payment-wizard/package-chooser/package-card/package-card.component';
import { PackageChooserComponent } from './payment-wizard/package-chooser/package-chooser.component';
import { PaymentStatusComponent } from './payment-wizard/payment-status/payment-status.component';
import { PaymentOptionsComponent } from './payment-wizard/payment-options/payment-options.component';
import { CreditCardComponent } from './payment-wizard/payment-options/credit-card/credit-card.component';
import { PayPalComponent } from './payment-wizard/payment-options/pay-pal/pay-pal.component';
import { BankTransferComponent } from './payment-wizard/payment-options/bank-transfer/bank-transfer.component';
import { ECheckComponent } from './payment-wizard/payment-options/e-check/e-check.component';
import { UserAssignmentComponent } from '@app/crm/shared/user-assignment-list/user-assignment-list.component';
import { StaticListComponent } from '@app/crm/shared/static-list/static-list.component';
import { TagsListComponent } from '@app/crm/shared/tags-list/tags-list.component';
import { ListsListComponent } from '@app/crm/shared/lists-list/lists-list.component';
import { RatingComponent } from '@app/crm/shared/rating/rating.component';
import { StarsListComponent } from '@app/crm/shared/stars-list/stars-list.component';
import { TypesListComponent } from '@app/crm/shared/types-list/types-list.component';

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
        TypesListComponent
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
        TypesListComponent
    ],
    providers: [
        DateTimeService,
        AppLocalizationService,
        AppNavigationService,
        ImportWizardService
    ],
    entryComponents: [
        ConfirmImportDialog,
        UploadPhotoDialogComponent,
        ConfirmDialogComponent,
        PaymentWizardComponent
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
