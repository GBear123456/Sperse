import {
    ChatMessageDtoReadState,
    ChatMessageDtoSide,
    FriendDtoState,
    DefaultTimezoneScope,
    UserNotificationState,
    IsTenantAvailableOutputState,
    IncomeStatisticsDateInterval
//    RegisterTenantInputSubscriptionStartType,

} from '@shared/service-proxies/service-proxies';

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

export class AppIncomeStatisticsDateInterval {
    static Daily: number = IncomeStatisticsDateInterval._1;
    static Weekly: number = IncomeStatisticsDateInterval._2;
    static Monthly: number = IncomeStatisticsDateInterval._3;
}
/*
export class SubscriptionStartType {

    static Free: number = RegisterTenantInputSubscriptionStartType._1;
    static Trial: number = RegisterTenantInputSubscriptionStartType._2;
    static Paid: number = RegisterTenantInputSubscriptionStartType._3;
}
*/

export class AppEditionExpireAction {
    static DeactiveTenant = 'DeactiveTenant';
    static AssignToAnotherEdition = 'AssignToAnotherEdition';
}

export class LinkType {
    static Facebook = 'F';
    static GooglePlus = 'G';
    static LinkedIn = 'L';
    static Pinterest = 'P';
    static Twitter = 'T';
    static Website = 'J';
    static Alexa = 'A';
    static BBB = 'B';
    static Crunchbase = 'C';
    static Domain = 'D';
    static Yelp = 'E';
    static Instagram = 'I';
    static Nav = 'N';
    static OpenCorporates = 'O';
    static Trustpilot = 'R';
    static GlassDoor = 'S';
    static Followers = 'W';
    static Youtube = 'Y';
    static RSS = 'Z';
}

export class LinkUsageType {
    static Home = 'H';
    static Mobile = 'M';
    static Work = 'W';
}

export class ContactTypes {
    static Personal = 'personal';
    static Business = 'business';
}

export class ContactStatus {
    static Prospective = 'P';
    static Active = 'A';
    static Inactive = 'I';
}

export class ContactGroup {
    static Client = 'C';
    static Partner = 'P';
    static UserProfile = 'U';
    static Investor = "I";
    static Vendor = "V";
}

export class PersonOrgRelationType {
    static Owner = 'O';
    static CoOwner = 'C';
    static Shareholder = 'S';
    static Employee = 'E';
}

export class ODataSearchStrategy {
    static Contains = 'contains';
    static StartsWith = 'startswith';
    static Equals = 'equals';
}

export enum ImportStatus {
    Cancelled = 'A',
    Completed = 'C',
    InProgress = 'I',
    New = 'N'
}

export enum AccountConnectors {
    Quovo = 'Quovo',
    Xero = 'Xero'
}

export enum ConditionsType {
    Terms = 'Terms',
    Policies = 'Policies'
}

export enum NoteType {
    ClientNote = 'C',
    CompanyNote = 'M',
    IncomingCall = 'I',
    OutcomingCall = 'O'
}
