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
    Unit: 'Unit',
    ThumbnailUrl: 'ThumbnailUrl'
};