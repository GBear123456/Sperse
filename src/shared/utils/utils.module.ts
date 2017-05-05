import { NgModule } from '@angular/core';

import { FileDownloadService } from './file-download.service';
import { EqualValidator } from './validation/equal-validator.directive';
import { PasswordComplexityValidator } from './validation/password-complexity-validator.directive'
import { ButtonBusyDirective } from './button-busy.directive'
import { AutoFocusDirective } from './auto-focus.directive'
import { BusyIfDirective } from './busy-if.directive';
import { LocalStorageService } from './local-storage.service';
import { FriendProfilePictureComponent } from './friend-profile-picture.component';
import { MomentFormatPipe } from './moment-format.pipe';

@NgModule({
    providers: [
        FileDownloadService,
        LocalStorageService
    ],
    declarations: [
        EqualValidator,
        PasswordComplexityValidator,
        ButtonBusyDirective,
        AutoFocusDirective,
        BusyIfDirective,
        FriendProfilePictureComponent,
        MomentFormatPipe
    ],
    exports: [
        EqualValidator,
        PasswordComplexityValidator,
        ButtonBusyDirective,
        AutoFocusDirective,
        BusyIfDirective,
        FriendProfilePictureComponent,
        MomentFormatPipe
    ]
})
export class UtilsModule { }