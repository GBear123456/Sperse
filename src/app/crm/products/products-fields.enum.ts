import { KeysEnum } from '@shared/common/keys.enum/keys.enum';
import { ProductDto } from '@app/crm/products/products-dto.interface';

export const ProductFields: KeysEnum<ProductDto> = {
    Id: 'Id',
    Code: 'Code',
    Name: 'Name',
    Description: 'Description',
    Group: 'Group',
    Type: 'Type',
    Price: 'Price',
    CurrencyId: 'CurrencyId',
    Unit: 'Unit',
    ThumbnailUrl: 'ThumbnailUrl',
    PublicName: 'PublicName',
    CreateUser: 'CreateUser',
    SinglePurchaseAllowed: 'SinglePurchaseAllowed',
    AllowCoupon: 'AllowCoupon',
    IsPublished: 'IsPublished',
    PublishDate: 'PublishDate',
    IsArchived: 'IsArchived',
    ProductSubscriptionOptions: 'ProductSubscriptionOptions'
};