import { createEntityAdapter, EntityAdapter } from '@ngrx/entity';
import { OrganizationTypeDto } from 'shared/service-proxies/service-proxies';

export const organizationTypesAdapter: EntityAdapter<
    OrganizationTypeDto
    > = createEntityAdapter<OrganizationTypeDto>({});

export interface State {
    organizationTypes: OrganizationTypeDto[];
    isLoading: boolean;
    error: string;
    loaded: boolean;
}

export const initialState: State = {
    organizationTypes: null,
    isLoading: false,
    error: null,
    loaded: false
};
