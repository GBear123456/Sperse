import { CrmStoreModule } from '@app/crm/store/crm-store.module';
import * as CrmStore from './crm-state';

export * from './address-usage-types-store/index';
export * from './assigned-users-store/index';
export * from './contact-link-types-store/index';
export * from './email-usage-types-store/index';
export * from './lists-store/index';
export * from './partner-types-store/index';
export * from './phone-usage-types-store/index';
export * from './pipelines-store/index';
export * from './ratings-store/index';
export * from './stars-store/index';
export * from './statuses-store/index';
export * from './tags-store/index';
export { CrmStoreModule, CrmStore };
