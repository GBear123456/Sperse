import { createEntityAdapter, EntityAdapter } from '@ngrx/entity';
import { UserInfoDto } from 'shared/service-proxies/service-proxies';

export interface State {
    entities: { [contactGroup: string]: UserInfoDto[] };
    isLoading: boolean;
    error: string;
}

export const initialState: State = {
    entities: {},
    isLoading: false,
    error: null,
};