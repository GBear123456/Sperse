import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ChatFriendDto } from './ChatFriendDto';
import { AppConsts } from '@shared/AppConsts';
import { UserHelper } from '../../helpers/UserHelper';

@Component({
    templateUrl: './chat-friend-list-item.component.html',
    selector: 'chat-friend-list-item'
})
export class ChatFriendListItemComponent {

    remoteServiceUrl: string = AppConsts.remoteServiceBaseUrl;
    appPath: string = AppConsts.appBaseUrl;

    @Input() friend: ChatFriendDto;
    @Output() selectChatFriend: EventEmitter<string> = new EventEmitter<string>();

    getShownUserName(friend: ChatFriendDto): string {
        return UserHelper.getShownUserName(friend.friendUserName, friend.friendTenantId, friend.friendTenancyName);
    }

    getRemoteImageUrl(profilePictureId: string, userId: number, tenantId?: number): string {
        return this.remoteServiceUrl + '/Profile/GetFriendProfilePictureById?id=' + profilePictureId + '&userId=' + userId + '&tenantId=' + tenantId;
    }
}
