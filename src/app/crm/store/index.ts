import { CrmStoreModule } from '@app/crm/store/crm-store.module';
import * as CrmStore from './crm-state';

export * from './pipelines-store/index';
export * from './organization-units-store/index';
export * from './subscriptions/index';
export { CrmStoreModule, CrmStore };
