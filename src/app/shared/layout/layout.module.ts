/** Core imports */
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import * as ngCommon from '@angular/common';
import { FormsModule } from '@angular/forms';

/** Third party modules */
import { MatTabsModule } from '@angular/material';
import {
    DxMenuModule, DxScrollViewModule, DxButtonModule,
    DxDropDownBoxModule, DxListModule, DxNavBarModule
} from 'devextreme-angular';
import { ModalModule, TabsModule, TooltipModule, PopoverModule } from 'ngx-bootstrap';
import { FileUploadModule as PrimeNgFileUploadModule, ProgressBarModule, PaginatorModule } from 'primeng/primeng';
import { TableModule } from 'primeng/table';




/** Application imports */
import { SmsVerificationModalComponent } from '@app/shared/layout/profile/sms-verification-modal.component';
import { PlatformSelectComponent } from './platform-select.component';
import { HeaderComponent } from './header.component';
import { HeaderNotificationsComponent } from './notifications/header-notifications.component';
import { SideBarComponent } from './side-bar.component';
import { TopBarComponent } from './top-bar.component';
import { FooterComponent } from './footer.component';
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
import { FiltersModule } from '@shared/filters/filters.module';
import { AppCommonModule } from '@app/shared/common/app-common.module';
import { UtilsModule } from '@shared/utils/utils.module';
import { FileUploadModule } from '@node_modules/ng2-file-upload';
import { SideBarMenuComponent } from './nav/side-bar-menu.component';
import { TopBarMenuComponent } from './nav/top-bar-menu.component';
import { LayoutService } from '@app/shared/layout/layout.service';

let COMPONENTS = [
    PlatformSelectComponent,
    HeaderComponent,
    HeaderNotificationsComponent,
    TopBarComponent,
    SideBarComponent,
    FooterComponent,
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
    SmsVerificationModalComponent,
    SideBarMenuComponent,
    TopBarMenuComponent
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
        FiltersModule,
        FileUploadModule,

        DxListModule,
        DxMenuModule,
        DxScrollViewModule,
        DxButtonModule,
        DxNavBarModule,
        DxDropDownBoxModule,

        MatTabsModule,

        PrimeNgFileUploadModule,
        ProgressBarModule,
        TableModule,
        PaginatorModule
    ],
    declarations: COMPONENTS,
    exports: COMPONENTS,
    providers: [
        LinkedAccountService,
        UserNotificationHelper,
        ChatSignalrService,
        QuickSideBarChat,
        LayoutService
    ]
})
export class LayoutModule {}
