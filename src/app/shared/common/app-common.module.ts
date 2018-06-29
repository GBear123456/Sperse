import { AbpModule } from '@abp/abp.module';
import * as ngCommon from '@angular/common';
import { ModuleWithProviders, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppNavigationService } from '@app/shared/layout/nav/app-navigation.service';
import { NgModule, ModuleWithProviders } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ModalModule } from 'ngx-bootstrap';

import { UtilsModule } from '@shared/utils/utils.module';
import { AbpModule } from '@abp/abp.module';
import { CommonModule } from '@shared/common/common.module';
import { UtilsModule } from '@shared/utils/utils.module';
import { ModalModule } from 'ngx-bootstrap';
import { PaginatorModule } from 'primeng/primeng';
import { TableModule } from 'primeng/table';
import { AppAuthService } from './auth/app-auth.service';
import { AppRouteGuard } from './auth/auth-route-guard';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule, MatStepperModule, MatInputModule,
    MatDialogModule, MatTabsModule, MatSidenavModule, } from '@angular/material';

import { DxDropDownBoxModule, DxListModule, DxButtonModule, DxToolbarModule,
    DxMenuModule, DxTextBoxModule, DxValidationGroupModule, DxValidatorModule,
    DxSelectBoxModule, DxTextAreaModule, DxDataGridModule, DxContextMenuModule } from 'devextreme-angular';

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
import { DateRangePickerComponent } from './timing/date-range-picker.component';
import { PeriodComponent } from './period/period.component';
import { DateTimeService } from './timing/date-time.service';
import { TimeZoneComboComponent } from './timing/timezone-combo.component';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppNavigationService } from '@app/shared/layout/nav/app-navigation.service';
import { DataTableModule } from 'primeng/primeng';
import { PaginatorModule } from 'primeng/primeng';
import { DxiValidationRuleModule } from 'devextreme-angular/ui/nested/validation-rule-dxi';
import { InplaceSelectBoxComponent } from '@app/shared/common/inplace-select-box/inplace-select-box.component';

import { FileDropModule } from 'ngx-file-drop';
import { PapaParseModule } from 'ngx-papaparse';
import { ImageCropperModule } from 'ng2-img-cropper';

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
        DataTableModule,
        PaginatorModule,

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
        DxContextMenuModule
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
