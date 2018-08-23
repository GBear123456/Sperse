import { createEntityAdapter, EntityAdapter } from '@ngrx/entity';
import { UserInfoDto } from '@shared/service-proxies/service-proxies';

export const assignedUsersAdapter: EntityAdapter<
    UserInfoDto
> = createEntityAdapter<UserInfoDto>({});

export interface State {
    assignedUsers: UserInfoDto[];
    isLoading: boolean;
    error: string;
    loaded: boolean;
}

export const initialState: State = {
    assignedUsers: null,
    isLoading: false,
    error: null,
    loaded: false
};
