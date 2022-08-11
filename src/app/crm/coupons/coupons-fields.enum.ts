import { KeysEnum } from '@shared/common/keys.enum/keys.enum';
import { CouponDto } from './coupons-dto.interface';

export const CouponFields: KeysEnum<CouponDto> = {
    Id: 'Id',
    Code: 'Code',
    Description: 'Description',
    Type: 'Type',
    Value: 'Value',
    ActivationDate: 'ActivationDate',
    DeactivationDate: 'DeactivationDate',
    Duration: 'Duration',
    IsArchived: 'IsArchived',
    Created: 'Created'
};