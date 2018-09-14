import {
    AddressUsageTypesStoreState,
    AssignedUsersStoreState,
    ContactLinkTypesStoreState,
    EmailUsageTypesStoreState,
    ListsStoreState,
    PartnerTypesStoreState,
    PhoneUsageTypesStoreState,
    CountriesStoreState,
    RatingsStoreState,
    StarsStoreState,
    StatusesStoreState,
    TagsStoreState
} from 'app/store/index';

export interface State {
    addressUsageTypes: AddressUsageTypesStoreState.State;
    assignedUsers: AssignedUsersStoreState.State;
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
}