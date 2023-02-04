/** Core imports */
import { AfterViewInit, Component, EventEmitter, Injector, OnInit, Output, ViewEncapsulation } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import min from 'lodash/min';
import * as moment from 'moment';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { AppChatMessageReadState, AppChatSide, AppFriendshipState } from '@shared/AppEnums';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { DomHelper } from '@shared/helpers/DomHelper';
import {
    BlockUserInput,
    ChatSide,
    ChatServiceProxy,
    CommonLookupServiceProxy,
    CreateFriendshipRequestByUserNameInput,
    CreateFriendshipRequestInput,
    FriendDto,
    FriendshipState,
    FriendshipServiceProxy,
    MarkAllUnreadMessagesOfUserAsReadInput,
    NameValueDto,
    ProfileServiceProxy,
    UnblockUserInput,
    UserLoginInfoDto,
    ChatMessageDto
} from '@shared/service-proxies/service-proxies';
import { LocalStorageService } from '@shared/utils/local-storage.service';
import { QuickSideBarChat } from 'app/shared/layout/chat/QuickSideBarChat';
import { ChatFriendDto } from './ChatFriendDto';
import { ChatSignalrService } from './chat-signalr.service';
import { UserHelper } from '../../helpers/UserHelper';
import { CommonLookupModalComponent } from '@app/shared/common/lookup/common-lookup-modal.component';
import { AppFeatures } from '@shared/AppFeatures';
import { FeatureCheckerService } from 'abp-ng2-module';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { NotifyService } from 'abp-ng2-module';

@Component({
    templateUrl: './chat-bar.component.html',
    selector: 'chat-bar',
    styleUrls: [
        '../../../../assets/metronic/themes/default/css/style.bundle.css',
        '../../../../shared/metronic/m-list-search.less',
        '../../../../shared/metronic/m-quick-sidebar.less',
        '../../../../shared/metronic/m-messenger.less',
        './chat-bar.component.less'
    ]
})
export class ChatBarComponent implements OnInit, AfterViewInit {
    @Output() onProgress: EventEmitter<any> = new EventEmitter();

    public progress = 0;
    uploadUrl: string = AppConsts.remoteServiceBaseUrl + '/api/Chat/UploadFile';
    isFileSelected = false;
    $_chatMessageInput: JQuery;
    friendDtoState: typeof AppFriendshipState = AppFriendshipState;
    friends: ChatFriendDto[] = [];
    currentUser: UserLoginInfoDto = this.appSessionService.user;
    chatMessage = '';
    tenantToTenantChatAllowed = false;
    tenantToHostChatAllowed = false;
    interTenantChatAllowed = false;
    sendingMessage = false;
    loadingPreviousUserMessages = false;
    userNameFilter = '';
    serverClientTimeDifference = 0;
    appChatSide: typeof AppChatSide = AppChatSide;
    appChatMessageReadState: typeof AppChatMessageReadState = AppChatMessageReadState;
    _isOpen: boolean;
    set isOpen(newValue: boolean) {
        if (newValue === this._isOpen) {
            return;
        }

        this.localStorageService.setItem('app.chat.isOpen', newValue);
        this._isOpen = newValue;

        if (newValue) {
            this.markAllUnreadMessagesOfUserAsRead(this.selectedUser);
        }

        this.adjustNotifyPosition();
    }
    get isOpen(): boolean {
        return this._isOpen;
    }

    _pinned = false;
    set pinned(newValue: boolean) {
        if (newValue === this._pinned) {
            return;
        }

        this._pinned = newValue;
        this.localStorageService.setItem('app.chat.pinned', newValue);
    }
    get pinned(): boolean {
        return this._pinned;
    }

    _selectedUser: ChatFriendDto = new ChatFriendDto();
    set selectedUser(newValue: ChatFriendDto) {
        if (newValue === this._selectedUser) {
            return;
        }

        this._selectedUser = newValue;

        //NOTE: this is a fix for localForage is not able to store user with messages array filled
        if (newValue.messages) {
            newValue.messages = [];
            newValue.messagesLoaded = false;
        }
        this.localStorageService.setItem('app.chat.selectedUser', newValue);
    }
    get selectedUser(): ChatFriendDto {
        return this._selectedUser;
    }

    constructor(injector: Injector,
        private appSessionService: AppSessionService,
        private friendshipService: FriendshipServiceProxy,
        private chatService: ChatServiceProxy,
        private commonLookupService: CommonLookupServiceProxy,
        private localStorageService: LocalStorageService,
        private chatSignalrService: ChatSignalrService,
        private profileService: ProfileServiceProxy,
        private quickSideBarChat: QuickSideBarChat,
        private dialog: MatDialog,
        private feature: FeatureCheckerService,
        private notify: NotifyService,
        public ls: AppLocalizationService
    ) {}

    shareCurrentLink() {
        this.chatMessage = '[link]{"message":"' + window.location.href + '"}';
        this.sendMessage();
        $('#chatDropdownToggle').dropdown('toggle');
    }

    onFileSelect() {
        $('#chatDropdownToggle').dropdown('toggle');
    }

    onUploadImage(event): void {

        const jsonResult = JSON.parse(event.xhr.response);
        this.chatMessage = '[image]{"id":"' + jsonResult.result.id + '", "name":"' + jsonResult.result.name + '", "contentType":"' + jsonResult.result.contentType + '"}';
        this.sendMessage();

        this.isFileSelected = false;
        this.progress = 0;
    }

    onUploadFile(event): void {
        const jsonResult = JSON.parse(event.xhr.response);
        this.chatMessage = '[file]{"id":"' + jsonResult.result.id + '", "name":"' + jsonResult.result.name + '", "contentType":"' + jsonResult.result.contentType + '"}';
        this.sendMessage();

        this.isFileSelected = false;
        this.progress = 0;
    }

    onBeforeSend(event): void {
        this.isFileSelected = true;
        event.xhr.setRequestHeader('Authorization', 'Bearer ' + abp.auth.getToken());

        event.xhr.upload.addEventListener('progress', (e: ProgressEvent) => {
            if (e.lengthComputable) {
                this.progress = Math.round((e.loaded * 100) / e.total);
            }

            this.onProgress.emit({ originalEvent: e, progress: this.progress });
        }, false);
    }

    ngOnInit(): void {
        this.init();
    }

    getShownUserName(friend: ChatFriendDto): string {
        return UserHelper.getShownUserName(friend.friendUserName, friend.friendTenantId, friend.friendTenancyName);
    }

    block(user: FriendDto): void {
        const blockUserInput = new BlockUserInput();
        blockUserInput.tenantId = user.friendTenantId;
        blockUserInput.userId = user.friendUserId;

        this.friendshipService.blockUser(blockUserInput).subscribe(() => {
            this.notify.info(this.ls.l('UserBlocked'));
        });
    }

    unblock(user: FriendDto): void {
        const unblockUserInput = new UnblockUserInput();
        unblockUserInput.tenantId = user.friendTenantId;
        unblockUserInput.userId = user.friendUserId;

        this.friendshipService.unblockUser(unblockUserInput).subscribe(() => {
            this.notify.info(this.ls.l('UserUnblocked'));
        });
    }

    markAllUnreadMessagesOfUserAsRead(user: ChatFriendDto): void {
        if (!user || !this.isOpen) {
            return;
        }

        const unreadMessages = user.messages && user.messages.filter((message: ChatMessageDto) => {
            return message.readState === AppChatMessageReadState.Unread;
        });
        const unreadMessageIds = unreadMessages && unreadMessages.map((message: ChatMessageDto) => message.id);

        if (!unreadMessageIds || !unreadMessageIds.length) {
            return;
        }

        const input = new MarkAllUnreadMessagesOfUserAsReadInput();
        input.tenantId = user.friendTenantId;
        input.userId = user.friendUserId;

        this.chatService.markAllUnreadMessagesOfUserAsRead(input).subscribe(() => {
            user.messages.forEach((message: ChatMessageDto) => {
                if (unreadMessageIds.indexOf(message.id) >= 0) {
                    message.readState = AppChatMessageReadState.Read;
                }
            });
        });
    }

    loadMessages(user: ChatFriendDto, callback: any): void {
        this.loadingPreviousUserMessages = true;
        let minMessageId;
        if (user.messages && user.messages.length) {
            minMessageId = min(user.messages.map(m => m.id));
        }

        this.chatService.getUserChatMessages(user.friendTenantId ? user.friendTenantId : undefined, user.friendUserId, minMessageId)
            .subscribe(result => {
                if (!user.messages) {
                    user.messages = [];
                }

                user.messages = result.items.concat(user.messages);

                this.markAllUnreadMessagesOfUserAsRead(user);

                if (!result.items.length) {
                    user.allPreviousMessagesLoaded = true;
                }

                this.loadingPreviousUserMessages = false;
                if (callback) {
                    callback();
                }
            });
    }

    openSearchModal(userName: string, tenantId?: number): void {
        const dialogRef = this.dialog.open(CommonLookupModalComponent, {
            panelClass: [ 'slider' ],
            data: {
                filterText: userName,
                tenantId: tenantId
            }
        });
        dialogRef.componentInstance.itemSelected.subscribe((item: NameValueDto) => {
            this.addFriendSelected(item);
        });
    }

    addFriendSelected(item: NameValueDto): void {
        const userId = item.value;
        const input = new CreateFriendshipRequestInput();
        input.userId = parseInt(userId);
        input.tenantId = this.appSessionService.tenant ? this.appSessionService.tenant.id : null;

        this.friendshipService.createFriendshipRequest(input).subscribe(() => {
            this.userNameFilter = '';
        });
    }

    search(): void {
        const input = new CreateFriendshipRequestByUserNameInput();

        if (this.userNameFilter.indexOf('\\') === -1) {
            input.userName = this.userNameFilter;
        } else {
            const tenancyAndUserNames = this.userNameFilter.split('\\');
            input.tenancyName = tenancyAndUserNames[0];
            input.userName = tenancyAndUserNames[1];
        }

        if (!input.tenancyName || !this.interTenantChatAllowed) {
            const tenantId = this.appSessionService.tenant ? this.appSessionService.tenant.id : null;
            this.openSearchModal(input.userName, tenantId);
        } else {
            this.friendshipService.createFriendshipRequestByUserName(input).subscribe(() => {
                this.userNameFilter = '';
            });
        }
    }

    getFriendOrNull(userId: number, tenantId?: number): ChatFriendDto {
        const friends = this.friends.filter(friend => friend.friendUserId === userId && friend.friendTenantId === tenantId);
        if (friends.length) {
            return friends[0];
        }

        return null;
    }

    getFilteredFriends(state: FriendshipState, userNameFilter: string): FriendDto[] {
        const foundFriends = this.friends && this.friends.filter(friend => friend.state === state &&
            this.getShownUserName(friend)
                .toLocaleLowerCase()
                .indexOf(userNameFilter.toLocaleLowerCase()) >= 0);

        return foundFriends;
    }

    getFilteredFriendsCount(state: FriendshipState): number {
        return this.friends.filter(friend => friend.state === state).length;
    }

    getUserNameByChatSide(chatSide: ChatSide): string {
        return chatSide === AppChatSide.Sender ?
            this.currentUser.userName :
            this.selectedUser.friendUserName;
    }

    getFixedMessageTime(messageTime: moment.Moment): string {
        return moment(messageTime).add(-1 * this.serverClientTimeDifference, 'seconds').format('YYYY-MM-DDTHH:mm:ssZ');
    }

    changeNotifyPosition(positionClass: string): void {
        if (!toastr) {
            return;
        }

        toastr.clear();
        toastr.options.positionClass = positionClass;
    }

    getFriendsAndSettings(callback: any): void {
        this.chatService.getUserChatFriendsWithSettings().subscribe(result => {
            this.friends = (result.friends as ChatFriendDto[]);
            this.serverClientTimeDifference = moment(abp.clock.now()).diff(result.serverTime, 'seconds');

            this.triggerUnreadMessageCountChangeEvent();
            callback();
        });
    }

    scrollToBottom(): void {
        setTimeout(() => {
            this.scrollToBottomInternal();
        }, 100);
    }

    scrollToBottomInternal(): void {
        DomHelper.waitUntilElementIsVisible('.m-messenger-conversation .m-messenger__messages', () => {
            setTimeout(() => {
                const $scrollArea = $('.m-messenger-conversation .m-messenger__messages');
                const scrollToVal = $scrollArea.prop('scrollHeight') + 'px';
                $scrollArea.slimScroll({ scrollTo: scrollToVal });
            });
        });
    }

    loadLastState(): void {
        const self = this;
        self.localStorageService.getItem('app.chat.isOpen', (err, isOpen) => {
            self.isOpen = isOpen;

            self.localStorageService.getItem('app.chat.pinned', (err, pinned) => {
                self.pinned = pinned;
            });

            if (isOpen) {
                self.quickSideBarChat.show();
                self.localStorageService.getItem('app.chat.selectedUser', (err, selectedUser) => {
                    if (selectedUser && selectedUser.friendUserId) {
                        self.showMessagesPanel();
                        self.selectFriend(selectedUser);
                    } else {
                        self.showFriendsPanel();
                    }
                });
            }
        });
    }

    selectFriend(friend: ChatFriendDto): void {
        const chatUser = this.getFriendOrNull(friend.friendUserId, friend.friendTenantId);
        this.selectedUser = chatUser;
        if (!chatUser) {
            return;
        }

        this.chatMessage = '';

        this.showMessagesPanel();

        if (!chatUser.messagesLoaded) {
            this.loadMessages(chatUser, () => {
                chatUser.messagesLoaded = true;
                this.scrollToBottom();
                this.$_chatMessageInput.focus();
            });
        } else {
            this.markAllUnreadMessagesOfUserAsRead(this.selectedUser);
            this.scrollToBottom();
            this.$_chatMessageInput.focus();
        }
    }

    showMessagesPanel(): void {
        $('.m-messenger-friends').hide();
        $('.m-messenger-conversation').show(() => {
            this.initConversationScrollbar();
        });
        $('#m_quick_sidebar_back').removeClass('d-none');
    }

    showFriendsPanel(): void {
        $('.m-messenger-friends').show();
        $('.m-messenger-conversation').hide();
        $('#m_quick_sidebar_back').addClass('d-none');
    }

    initConversationScrollbar(): void {
        let $messengerMessages = $('.m-messenger-conversation .m-messenger__messages');
        let height = $('#m_quick_sidebar').outerHeight(true) - $('.selected-chat-user').outerHeight(true) - $('#ChatMessage').height() - 150;

        $messengerMessages.slimScroll({ destroy: true });
        $messengerMessages.slimScroll({
            height: height
        });
    }

    sendMessage(): void {
        if (!this.chatMessage) {
            return;
        }

        this.sendingMessage = true;
        const tenancyName = this.appSessionService.tenant ? this.appSessionService.tenant.tenancyName : null;
        this.chatSignalrService.sendMessage({
            tenantId: this.selectedUser.friendTenantId,
            userId: this.selectedUser.friendUserId,
            message: this.chatMessage,
            tenancyName: tenancyName,
            userName: this.appSessionService.user.userName,
            profilePictureId: this.appSessionService.user.profilePictureId
        }, () => {
            this.chatMessage = '';
            this.sendingMessage = false;
        });
    }

    reversePinned(): void {
        this.pinned = !this.pinned;
    }

    bindUiEvents(): void {
        const self = this;
        self.quickSideBarChat.init((e, pos) => {
            if (pos === 0 && !this.selectedUser.allPreviousMessagesLoaded && !this.loadingPreviousUserMessages) {
                self.loadMessages(self.selectedUser, null);
            }
        });

        const $backToList = $('#m_quick_sidebar_back');
        $backToList.on('click', () => {
            self.selectedUser = new ChatFriendDto();
            this.showFriendsPanel();
        });

        const $sidebarTogglers = $('#m_quick_sidebar_toggle');
        $sidebarTogglers.on('click', () => {
            this.isOpen = $('body').hasClass('m-quick-sidebar--on');
        });

        $('div.m-quick-sidebar').on('mouseleave', () => {
            if (this.pinned) {
                return;
            }

            self.quickSideBarChat.hide();
            this.isOpen = false;
            this.adjustNotifyPosition();
        });

        $(window as any).on('resize', () => {
            this.initConversationScrollbar();
        });
    }

    ngAfterViewInit(): void {
        this.$_chatMessageInput = $('#ChatMessage');
    }

    adjustNotifyPosition(): void {
        if (this.isOpen) {
            this.changeNotifyPosition('toast-chat-open');
        } else {
            this.changeNotifyPosition('toast-bottom-right');
        }
    }

    triggerUnreadMessageCountChangeEvent(): void {
        let totalUnreadMessageCount = 0;

        if (this.friends) {
            totalUnreadMessageCount = this.friends.reduce((memo, friend) => memo + friend.unreadMessageCount, 0);
        }

        abp.event.trigger('app.chat.unreadMessageCountChanged', totalUnreadMessageCount);
    }

    registerEvents(): void {
        const self = this;

        abp.event.on('app.chat.messageReceived', message => {
            const user = this.getFriendOrNull(message.targetUserId, message.targetTenantId);
            if (!user) {
                return;
            }

            user.messages = user.messages || [];
            user.messages.push(message);

            if (message.side === AppChatSide.Receiver) {
                user.unreadMessageCount += 1;
                message.readState = AppChatMessageReadState.Unread;
                this.triggerUnreadMessageCountChangeEvent();

                if (this.isOpen && this.selectedUser !== null && user.friendTenantId === this.selectedUser.friendTenantId && user.friendUserId === this.selectedUser.friendUserId) {
                    this.markAllUnreadMessagesOfUserAsRead(user);
                } else {
                    this.notify.info(
                        abp.utils.formatString('{0}: {1}', user.friendUserName, abp.utils.truncateString(message.message, 100)),
                        null,
                        {
                            onclick() {
                                if (!$('body').hasClass('m-quick-sidebar--on')) {
                                    self.quickSideBarChat.show();
                                    self.isOpen = true;
                                }

                                self.showMessagesPanel();

                                self.selectFriend(user);
                                self.pinned = true;
                            }
                        });
                }
            }

            self.scrollToBottom();
        });

        abp.event.on('app.chat.friendshipRequestReceived', (data, isOwnRequest) => {
            if (!isOwnRequest) {
                abp.notify.info(this.ls.l('UserSendYouAFriendshipRequest', data.friendUserName));
            }

            if (!(this.friends.filter((friend: ChatFriendDto) => {
                return friend.friendUserId === data.friendUserId && friend.friendTenantId === data.friendTenantId;
            }).length)) {
                this.friends.push(data);
            }
        });

        abp.event.on('app.chat.userConnectionStateChanged', data => {
            const user = this.getFriendOrNull(data.friend.userId, data.friend.tenantId);
            if (!user) {
                return;
            }

            user.isOnline = data.isConnected;
        });

        abp.event.on('app.chat.userStateChanged', data => {
            const user = this.getFriendOrNull(data.friend.userId, data.friend.tenantId);
            if (!user) {
                return;
            }

            user.state = data.state;
        });

        abp.event.on('app.chat.allUnreadMessagesOfUserRead', data => {
            const user = this.getFriendOrNull(data.friend.userId, data.friend.tenantId);
            if (!user) {
                return;
            }

            user.unreadMessageCount = 0;
            this.triggerUnreadMessageCountChangeEvent();
        });

        abp.event.on('app.chat.readStateChange', data => {
            const user = this.getFriendOrNull(data.friend.userId, data.friend.tenantId);
            if (!user) {
                return;
            }

            $.each(user.messages,
                (index, message) => {
                    message.receiverReadState = AppChatMessageReadState.Read;
                });
        });

        abp.event.on('app.chat.connected', () => {
            const self = this;
            self.getFriendsAndSettings(() => {
                DomHelper.waitUntilElementIsReady('#m_quick_sidebar, #m_quick_sidebar_toggle', () => {
                    self.bindUiEvents();

                    DomHelper.waitUntilElementIsReady('.m-quick-sidebar', () => {
                        self.loadLastState();
                    });
                });
            });
        });
    }

    init(): void {
        this.registerEvents();
        this.tenantToTenantChatAllowed = this.feature.isEnabled(AppFeatures.AppChatFeatureTenantToTenant);
        this.tenantToHostChatAllowed = this.feature.isEnabled(AppFeatures.AppChatFeatureTenantToHost);
        this.interTenantChatAllowed = this.feature.isEnabled(AppFeatures.AppChatFeatureTenantToTenant) || this.feature.isEnabled(AppFeatures.AppChatFeatureTenantToHost) || !this.appSessionService.tenant;
    }
}
