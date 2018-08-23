import { CrmStoreModule } from '@app/crm/shared/store/crm-store.module';
import * as CrmStoreSelectors from './crm-selectors';
import * as CrmStoreState from './crm-state';

export * from './assigned-users-store';
export * from './lists-store';
export * from './partner-types-store';
export * from './pipelines-store';
export * from './ratings-store';
export * from './stars-store';
export * from './statuses-store';
export * from './tags-store';
export { CrmStoreModule, CrmStoreState, CrmStoreSelectors };
