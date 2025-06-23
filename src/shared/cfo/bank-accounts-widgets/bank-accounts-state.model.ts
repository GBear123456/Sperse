import { BankAccountStatus } from '@shared/cfo/bank-accounts/helpers/bank-accounts.status.enum';

export class BankAccountsState {
    selectedSyncAccountIds?: number[];
    selectedBankAccountIds?: number[];
    statuses?: BankAccountStatus[];
    usedBankAccountIds?: number[];
    visibleBankAccountIds?: number[];
    selectedBusinessEntitiesIds?: number[];
    selectedBankAccountTypes?: string[];
}
