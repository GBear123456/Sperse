import { ChatMessageDtoReadState, ChatMessageDtoSide, FriendDtoState, DefaultTimezoneScope, UserNotificationState, IsTenantAvailableOutputState } from '@shared/service-proxies/service-proxies';

export class AppChatMessageReadState {
    static Unread: number = ChatMessageDtoReadState._1;
    static Read: number = ChatMessageDtoReadState._2;
}

export class AppChatSide {
    static Sender: number = ChatMessageDtoSide._1;
    static Receiver: number = ChatMessageDtoSide._2;
}

export class AppFriendshipState {
    static Accepted: number = FriendDtoState._1;
    static Blocked: number = FriendDtoState._2;
}


export class AppTimezoneScope {
    static Application: number = DefaultTimezoneScope._1;
    static Tenant: number = DefaultTimezoneScope._2;
    static User: number = DefaultTimezoneScope._4;
}

export class AppUserNotificationState {
    static Unread: number = UserNotificationState._0;
    static Read: number = UserNotificationState._1;
}

export class AppTenantAvailabilityState {
    static Available: number = IsTenantAvailableOutputState._1;
    static InActive: number = IsTenantAvailableOutputState._2;
    static NotFound: number = IsTenantAvailableOutputState._3;
}