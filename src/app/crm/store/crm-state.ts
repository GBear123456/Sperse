import { PipelinesStoreState, OrganizationUnitsStoreState } from 'app/crm/store/index';

export interface State {
    pipelines: PipelinesStoreState.State;
    organizationUnits: OrganizationUnitsStoreState.State;
}
