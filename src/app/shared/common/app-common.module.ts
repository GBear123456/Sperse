import { AbpModule } from '@abp/abp.module';
import * as ngCommon from '@angular/common';
import { ModuleWithProviders, NgModule } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppNavigationService } from '@app/shared/layout/nav/app-navigation.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ModalModule } from 'ngx-bootstrap';
import { UtilsModule } from '@shared/utils/utils.module';
import { CommonModule } from '@shared/common/common.module';
import { TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/primeng';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule, MatStepperModule, MatInputModule,
    MatDialogModule, MatTabsModule, MatSidenavModule, } from '@angular/material';

import { DxDropDownBoxModule, DxListModule, DxButtonModule, DxToolbarModule,
    DxMenuModule, DxTextBoxModule, DxValidationGroupModule, DxValidatorModule,
    DxSelectBoxModule, DxTextAreaModule, DxDataGridModule, DxContextMenuModule } from 'devextreme-angular';
import { DxiValidationRuleModule } from 'devextreme-angular/ui/nested/validation-rule-dxi';

import { UploadPhotoDialogComponent } from './upload-photo-dialog/upload-photo-dialog.component';
import { ImportWizardComponent } from './import-wizard/import-wizard.component';
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

import { PapaParseModule } from 'ngx-papaparse';
import { ImageCropperModule } from 'ng2-img-cropper';
import { FileDropModule } from 'ngx-file-drop';

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
        ReactiveFormsModule,
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
        FileDropModule
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
        UploadPhotoDialogComponent
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
        UploadPhotoDialogComponent
    ],
    providers: [
        DateTimeService,
        AppLocalizationService,
        AppNavigationService
    ],
    entryComponents: [
        UploadPhotoDialogComponent
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
