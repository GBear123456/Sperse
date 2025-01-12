/** Core imports */
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import * as ngCommon from '@angular/common';
import { FormsModule } from '@angular/forms';

/** Third party modules */
import { CKEditorModule } from 'ckeditor4-angular';
import { ModalModule } from 'ngx-bootstrap/modal';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { PopoverModule } from 'ngx-bootstrap/popover';
import { FileUploadModule as PrimeNgFileUploadModule } from 'primeng/fileupload';
import { ProgressBarModule } from 'primeng/progressbar';
import { PaginatorModule } from 'primeng/paginator';
import { TableModule } from 'primeng/table';
import { MatTabsModule } from '@angular/material/tabs';
import { FileUploadModule } from '@node_modules/ng2-file-upload';
import { DxListModule } from 'devextreme-angular/ui/list';
import { DxTooltipModule } from 'devextreme-angular/ui/tooltip';
import { DxDataGridModule } from 'devextreme-angular/ui/data-grid';
import { DxScrollViewModule } from 'devextreme-angular/ui/scroll-view';
import { DxSelectBoxModule } from 'devextreme-angular/ui/select-box';
import { DxCheckBoxModule } from 'devextreme-angular/ui/check-box';
import { DxSwitchModule } from 'devextreme-angular/ui/switch';
import { DxTextBoxModule } from 'devextreme-angular/ui/text-box';

/** Application imports */
import { SmsVerificationModalComponent } from '@app/shared/layout/profile/sms-verification-modal.component';
import { HeaderNotificationsComponent } from './notifications/header-notifications/header-notifications.component';
import { LoginAttemptsModalComponent } from './login-attempts-modal/login-attempts-modal.component';
import { ChangePasswordModalComponent } from './profile/change-password-modal.component';
import { MySettingsModalComponent } from './profile/my-settings-modal.component';
import { LinkedAccountsModalComponent } from './linked-accounts-modal/linked-accounts-modal.component';
import { LinkAccountModalComponent } from './link-account-modal/link-account-modal.component';
import { NotificationsComponent } from './notifications/notifications.component';
import { NotificationSettingsModalComponent } from './notifications/notification-settings-modal/notification-settings-modal.component';
import { UserNotificationHelper } from './notifications/UserNotificationHelper';
import { ChatBarComponent } from './chat/chat-bar.component';
import { ChatMessageComponent } from './chat/chat-message.component';
import { ChatFriendListItemComponent } from './chat/chat-friend-list-item.component';
import { ChatSignalrService } from './chat/chat-signalr.service';
import { QuickSideBarChat } from './chat/QuickSideBarChat';
import { LinkedAccountService } from './linked-accounts-modal/linked-account.service';
import { AppCommonModule } from '@app/shared/common/app-common.module';
import { CommonModule } from '@shared/common/common.module';
import { UtilsModule } from '@shared/utils/utils.module';
import { ModalDialogModule } from '../../../shared/common/dialogs/modal/modal-dialog.module';
import { CountryPhoneNumberModule } from '../../../shared/common/phone-numbers/country-phone-number.module';
import { MonacoEditorModule } from 'ngx-monaco-editor';
import { ReactiveFormsModule } from '@angular/forms';

let COMPONENTS = [
    HeaderNotificationsComponent,
    LoginAttemptsModalComponent,
    LinkedAccountsModalComponent,
    LinkAccountModalComponent,
    ChangePasswordModalComponent,
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
        ReactiveFormsModule,     
        MonacoEditorModule.forRoot(),
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
        CKEditorModule,
        PaginatorModule,
        DxScrollViewModule,
        DxSelectBoxModule,
        DxCheckBoxModule,
        DxDataGridModule,
        ModalDialogModule,
        DxTooltipModule,
        DxSwitchModule,
        DxTextBoxModule,
        DxListModule,
        MatTabsModule,
        CountryPhoneNumberModule
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
        ChangePasswordModalComponent,
        NotificationSettingsModalComponent,
        NotificationsComponent,
        LoginAttemptsModalComponent,
        LinkedAccountsModalComponent,
        LinkAccountModalComponent
    ]
})
export class LayoutCommonModule {}