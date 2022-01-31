import {
    ContactAssignedUsersStoreState,
    ActivityAssignedUsersStoreState,
    ContactLinkTypesStoreState,
    ListsStoreState,
    PartnerTypesStoreState,
    RatingsStoreState,
    StarsStoreState,
    TagsStoreState,
    OrganizationTypeStoreState
} from 'app/store/index';

export interface State {
    contactAssignedUsers: ContactAssignedUsersStoreState.State;
    activityAssignedUsers: ActivityAssignedUsersStoreState.State;
    contactLinkTypes: ContactLinkTypesStoreState.State;
    lists: ListsStoreState.State;
    partnersTypes: PartnerTypesStoreState.State;
    ratings: RatingsStoreState.State;
    stars: StarsStoreState.State;
    tags: TagsStoreState.State;
    organizationTypes: OrganizationTypeStoreState.State;
}
