import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ChatFriendDto } from './ChatFriendDto';
import { AppConsts } from '@shared/AppConsts';

@Component({
    templateUrl: './chat-friend-list-item.component.html',
    selector: 'chat-friend-list-item'
})
export class ChatFriendListItem {

    remoteServiceUrl: string = AppConsts.remoteServiceBaseUrl;
    appPath: string = AppConsts.appBaseUrl;

    @Input() friend: ChatFriendDto;
    @Output() selectChatFriend: EventEmitter<string> = new EventEmitter<string>();

    getShownUserName(tenanycName: string, userName: string): string {
        return (tenanycName ? tenanycName : '.') + '\\' + userName;
    }

    getRemoteImageUrl(profilePictureId: string, userId: number, tenantId?: number): string {
        return this.remoteServiceUrl + '/Profile/GetFriendProfilePictureById?id=' + profilePictureId + '&userId=' + userId + '&tenantId=' + tenantId;
    }
}