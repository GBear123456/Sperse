/** Core imports */
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import * as ngCommon from '@angular/common';
import { FormsModule } from '@angular/forms';

/** Third party modules */
import { ModalModule, TabsModule, TooltipModule, PopoverModule } from 'ngx-bootstrap';
import { FileUploadModule as PrimeNgFileUploadModule, ProgressBarModule, PaginatorModule } from 'primeng/primeng';
import { TableModule } from 'primeng/table';
import { FileUploadModule } from '@node_modules/ng2-file-upload';
import {
    DxScrollViewModule
} from 'devextreme-angular';
/** Application imports */
import { SmsVerificationModalComponent } from '@app/shared/layout/profile/sms-verification-modal.component';
import { HeaderNotificationsComponent } from './notifications/header-notifications.component';
import { LoginAttemptsModalComponent } from './login-attempts-modal.component';
import { ChangePasswordModalComponent } from './profile/change-password-modal.component';
import { ChangeProfilePictureModalComponent } from './profile/change-profile-picture-modal.component';
import { MySettingsModalComponent } from './profile/my-settings-modal.component';
import { LinkedAccountsModalComponent } from './linked-accounts-modal.component';
import { LinkAccountModalComponent } from './link-account-modal.component';
import { NotificationsComponent } from './notifications/notifications.component';
import { NotificationSettingsModalComponent } from './notifications/notification-settings-modal.component';
import { UserNotificationHelper } from './notifications/UserNotificationHelper';
import { ChatBarComponent } from './chat/chat-bar.component';
import { ChatMessageComponent } from './chat/chat-message.component';
import { ChatFriendListItemComponent } from './chat/chat-friend-list-item.component';
import { ChatSignalrService } from './chat/chat-signalr.service';
import { QuickSideBarChat } from './chat/QuickSideBarChat';
import { LinkedAccountService } from './linked-account.service';
import { AppCommonModule } from '@app/shared/common/app-common.module';
import { CommonModule } from '@shared/common/common.module';
import { UtilsModule } from '@shared/utils/utils.module';

let COMPONENTS = [
    HeaderNotificationsComponent,
    LoginAttemptsModalComponent,
    LinkedAccountsModalComponent,
    LinkAccountModalComponent,
    ChangePasswordModalComponent,
    ChangeProfilePictureModalComponent,
    MySettingsModalComponent,
    NotificationsComponent,
    ChatBarComponent,
    ChatMessageComponent,
    ChatFriendListItemComponent,
    NotificationSettingsModalComponent,
    SmsVerificationModalComponent
];

@NgModule({
    imports: [
        ngCommon.CommonModule,
        FormsModule,
        RouterModule,
        AppCommonModule,
        ModalModule.forRoot(),
        TooltipModule.forRoot(),
        TabsModule.forRoot(),
        PopoverModule.forRoot(),
        UtilsModule,
        FileUploadModule,
        CommonModule,
        PrimeNgFileUploadModule,
        ProgressBarModule,
        TableModule,
        PaginatorModule,
        DxScrollViewModule
    ],
    declarations: COMPONENTS,
    exports: COMPONENTS,
    providers: [
        LinkedAccountService,
        UserNotificationHelper,
        ChatSignalrService,
        QuickSideBarChat
    ],
    entryComponents: [
        MySettingsModalComponent,
        ChangePasswordModalComponent
    ]
})
export class LayoutCommonModule {}
