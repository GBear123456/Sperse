import { AccountConnectors } from '@shared/AppEnums';
import { InstanceType, ConnectionMode } from '@shared/service-proxies/service-proxies';

export interface AccountConnectorDialogData {
    connector?: AccountConnectors;
    disabledConnectors?: AccountConnectors[];
    showBackButton?: boolean;
    operationType?: 'add' | 'update';
    overwriteCurrentCategoryTree?: boolean;
    loadingContainerElement?: Element;
    instanceType?: InstanceType;
    instanceId?: number;
    mode?: ConnectionMode;
}
