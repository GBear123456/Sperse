import {
    AddressUsageTypesStoreState,
    AssignedUsersStoreState,
    ContactLinkTypesStoreState,
    EmailUsageTypesStoreState,
    ListsStoreState,
    PartnerTypesStoreState,
    PhoneUsageTypesStoreState,
    PipelinesStoreState,
    RatingsStoreState,
    StarsStoreState,
    StatusesStoreState,
    TagsStoreState
} from 'app/crm/store/index';

export interface State {
    addressUsageTypes: AddressUsageTypesStoreState.State;
    assignedUsers: AssignedUsersStoreState.State;
    contactLinkTypes: ContactLinkTypesStoreState.State;
    emailUsageTypes: EmailUsageTypesStoreState.State;
    lists: ListsStoreState.State;
    partnersTypes: PartnerTypesStoreState.State;
    phoneUsageTypes: PhoneUsageTypesStoreState.State;
    pipelines: PipelinesStoreState.State;
    ratings: RatingsStoreState.State;
    stars: StarsStoreState.State;
    statuses: StatusesStoreState.State;
    tags: TagsStoreState.State;
}
