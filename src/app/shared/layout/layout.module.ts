import { NgModule, ModuleWithProviders } from '@angular/core';
import { RouterModule } from '@angular/router';
import * as ngCommon from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ModalModule, TooltipModule } from 'ngx-bootstrap';

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
import { ChatFriendListItem } from './chat/chat-friend-list-item.component';
import { ChatSignalrService } from './chat/chat-signalr.service';
import { QuickSideBarChat } from './chat/QuickSideBarChat';
import { LinkedAccountService } from './linked-account.service';

import { FiltersModule } from '@shared/filters/filters.module';
import { AppCommonModule } from '@app/shared/common/app-common.module';
import { UtilsModule } from '@shared/utils/utils.module';
import { FileUploadModule } from '@node_modules/ng2-file-upload';

import {
    DxMenuModule, DxScrollViewModule, DxButtonModule,
    DxDropDownBoxModule, DxListModule, DxNavBarModule
} from 'devextreme-angular';

import { MatTabsModule } from '@angular/material';

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
    ChatFriendListItem,
    NotificationSettingsModalComponent
];

@NgModule({
    imports: [
        ngCommon.CommonModule,
        FormsModule,
        RouterModule,

        AppCommonModule,

        ModalModule.forRoot(),
        TooltipModule.forRoot(),

        UtilsModule,
        FiltersModule,

        FileUploadModule,

        DxListModule,
        DxMenuModule,
        DxScrollViewModule,
        DxButtonModule,
        DxNavBarModule,
        DxDropDownBoxModule,

        MatTabsModule
    ],
    declarations: COMPONENTS,
    exports: COMPONENTS,
    providers: [
        LinkedAccountService,
        UserNotificationHelper,
        ChatSignalrService,
        QuickSideBarChat
    ]
})
export class LayoutModule {}
