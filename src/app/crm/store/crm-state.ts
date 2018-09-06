import {
    AssignedUsersStoreState,
    ListsStoreState,
    PartnerTypesStoreState,
    PipelinesStoreState,
    RatingsStoreState,
    StarsStoreState,
    StatusesStoreState,
    TagsStoreState
} from 'app/crm/store/index';

export interface State {
    assignedUsers: AssignedUsersStoreState.State;
    lists: ListsStoreState.State;
    partnersTypes: PartnerTypesStoreState.State;
    pipelines: PipelinesStoreState.State;
    ratings: RatingsStoreState.State;
    stars: StarsStoreState.State;
    statuses: StatusesStoreState.State;
    tags: TagsStoreState.State;
}
