import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { AutoFocusDirective } from './auto-focus.directive';
import { BusyIfDirective } from './busy-if.directive';
import { ButtonBusyDirective } from './button-busy.directive';
import { FileDownloadService } from './file-download.service';
import { FriendProfilePictureComponent } from './friend-profile-picture.component';
import { LocalStorageService } from './local-storage.service';
import { MomentFormatPipe } from './moment-format.pipe';
import { ValidationMessagesComponent } from './validation-messages.component';
import { EqualValidator } from './validation/equal-validator.directive';
import { MinValueValidator } from './validation/min-value-validator.directive';
import { PasswordComplexityValidator } from './validation/password-complexity-validator.directive';
import { ArrayToTreeConverterService } from './array-to-tree-converter.service';
import { TreeDataHelperService } from './tree-data-helper.service';
import { LuxonFormatPipe } from './luxon-format.pipe';
import { DatePickerLuxonModifierDirective } from './date-time/date-picker-luxon-modifier.directive';
import { DateRangePickerLuxonModifierDirective } from './date-time/date-range-picker-luxon-modifier.directive';

@NgModule({
    imports: [
        CommonModule
    ],
    providers: [
        FileDownloadService,
        LocalStorageService,
        TreeDataHelperService,
        ArrayToTreeConverterService
    ],
    declarations: [
        EqualValidator,
        PasswordComplexityValidator,
        MinValueValidator,
        ButtonBusyDirective,
        AutoFocusDirective,
        BusyIfDirective,
        FriendProfilePictureComponent,
        MomentFormatPipe,
        ValidationMessagesComponent,
        DatePickerLuxonModifierDirective,
        DateRangePickerLuxonModifierDirective,
        LuxonFormatPipe
    ],
    exports: [
        EqualValidator,
        PasswordComplexityValidator,
        MinValueValidator,
        ButtonBusyDirective,
        AutoFocusDirective,
        BusyIfDirective,
        FriendProfilePictureComponent,
        MomentFormatPipe,
        ValidationMessagesComponent,
        DatePickerLuxonModifierDirective,
        DateRangePickerLuxonModifierDirective,
        LuxonFormatPipe
    ]
})
export class UtilsModule { }
