import { AccountConnectors } from '@shared/AppEnums';
import { XeroComponentConfig } from '@shared/common/account-connector-dialog/xero-login/xero-component-config';
import { QuovoComponentConfig } from '@shared/common/account-connector-dialog/quovo-login/quovo-component-config';

export interface AccountConnectorDialogData {
    connector?: AccountConnectors;
    config: XeroComponentConfig | QuovoComponentConfig;
}
