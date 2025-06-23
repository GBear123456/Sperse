import { KeysEnum } from '@shared/common/keys.enum/keys.enum';
import { TenantLandingPageDto } from './tenant-landing-page-dto.interface';

export const TenantLandingPageFields: KeysEnum<TenantLandingPageDto> = {
    TenantId: 'TenantId',
    TenantName: 'TenantName',
    FirstDomain: 'FirstDomain',
    Verified: 'Verified',
    Disabled: 'Disabled'
};