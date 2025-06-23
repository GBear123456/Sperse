import { PipelinesStoreState, OrganizationUnitsStoreState, SubscriptionsStoreState } from 'app/crm/store/index';

export interface State {
    pipelines: PipelinesStoreState.State;
    organizationUnits: OrganizationUnitsStoreState.State;
    subscriptions: SubscriptionsStoreState.State;
}
