import { AccountConnectors } from '@shared/AppEnums';
import { QuovoComponentConfig } from '@shared/common/account-connector-dialog/quovo-login/quovo-component-config';
import { InstanceType } from '@shared/service-proxies/service-proxies';

export interface AccountConnectorDialogData {
    connector?: AccountConnectors;
    config?: QuovoComponentConfig;
    disabledConnectors?: AccountConnectors[];
    showBackButton?: boolean;
    operationType?: 'add' | 'update';
    overwriteCurrentCategoryTree?: boolean;
    loadingContainerElement?: Element;
    instanceType?: InstanceType;
    instanceId?: number;
}
