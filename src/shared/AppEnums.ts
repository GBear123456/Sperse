import {
    ChatMessageReadState,
    ChatSide,
    FriendshipState,
    SettingScopes,
    UserNotificationState,
    TenantAvailabilityState,
    ChartDateInterval
//    RegisterTenantInputSubscriptionStartType,

} from '@shared/service-proxies/service-proxies';
import { AppPermissions } from '@shared/AppPermissions';

export class AppChatMessageReadState {
    static Unread: number = ChatMessageReadState._1;
    static Read: number = ChatMessageReadState._2;
}

export class AppChatSide {
    static Sender: number = ChatSide._1;
    static Receiver: number = ChatSide._2;
}

export class AppFriendshipState {
    static Accepted: number = FriendshipState._1;
    static Blocked: number = FriendshipState._2;
}


export class AppTimezoneScope {
    static Application: number = SettingScopes._1;
    static Tenant: number = SettingScopes._2;
    static User: number = SettingScopes._4;
}

export class AppUserNotificationState {
    static Unread: number = UserNotificationState._0;
    static Read: number = UserNotificationState._1;
}

export class AppTenantAvailabilityState {
    static Available: number = TenantAvailabilityState._1;
    static InActive: number = TenantAvailabilityState._2;
    static NotFound: number = TenantAvailabilityState._3;
}

export class AppIncomeStatisticsDateInterval {
    static Daily: number = ChartDateInterval._1;
    static Weekly: number = ChartDateInterval._2;
    static Monthly: number = ChartDateInterval._3;
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

export class AddressUsageType {
    static Shipping = 'S';
}

export class ContactTypes {
    static Person = 'P';
    static Organization = 'O';
    static Property = 'Y';
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
    static Investor = 'I';
    static Vendor = 'V';
    static Other = 'O';
}

export class ContactGroupPermission {
    static Client = AppPermissions.CRMCustomers;
    static Partner = AppPermissions.CRMPartners;
    static UserProfile = AppPermissions.CRMEmployees;
    static Investor = AppPermissions.CRMInvestors;
    static Vendor = AppPermissions.CRMVendors;
    static Other = AppPermissions.CRMOthers;
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
    New = 'N',
    Failed = 'F'
}

export enum AccountConnectors {
    Plaid = 'Plaid',
    QuickBook = 'QuickBook',
    XeroOAuth2 = 'XeroOAuth2',
    SaltEdge = 'SaltEdge'
}

export enum SyncTypeIds {
    Plaid = 'P',
    QuickBook = 'B',
    XeroOAuth2 = 'O',
    SaltEdge = 'S'
}

export enum ConditionsType {
    Terms = 'Terms',
    Policies = 'Policies'
}

export enum ActionButtonType {
    Edit,
    Delete,
    Send,
    Cancel,
    MarkAsSent,
    MarkAsDraft
}

export enum NavigationState {
    Prev    = -1,
    Current = 0,
    Next    = 1
}

export enum Country {
    USA = 'US', 
    Canada = 'CA'
}