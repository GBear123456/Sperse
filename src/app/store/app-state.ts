import {
    AddressUsageTypesStoreState,
    ContactAssignedUsersStoreState,
    ActivityAssignedUsersStoreState,
    ContactLinkTypesStoreState,
    EmailUsageTypesStoreState,
    ListsStoreState,
    PartnerTypesStoreState,
    PhoneUsageTypesStoreState,
    CountriesStoreState,
    RatingsStoreState,
    StarsStoreState,
    StatusesStoreState,
    TagsStoreState,
    OrganizationTypeStoreState
} from 'app/store/index';

export interface State {
    addressUsageTypes: AddressUsageTypesStoreState.State;
    contactAssignedUsers: ContactAssignedUsersStoreState.State;
    activityAssignedUsers: ActivityAssignedUsersStoreState.State;
    contactLinkTypes: ContactLinkTypesStoreState.State;
    emailUsageTypes: EmailUsageTypesStoreState.State;
    lists: ListsStoreState.State;
    partnersTypes: PartnerTypesStoreState.State;
    phoneUsageTypes: PhoneUsageTypesStoreState.State;
    countries: CountriesStoreState.State;
    ratings: RatingsStoreState.State;
    stars: StarsStoreState.State;
    statuses: StatusesStoreState.State;
    tags: TagsStoreState.State;
    organizationTypes: OrganizationTypeStoreState.State;
}
