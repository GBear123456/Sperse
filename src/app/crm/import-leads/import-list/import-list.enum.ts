import { KeysEnum } from '@shared/common/keys.enum/keys.enum';
import { ImportListDto } from '@app/crm/import-leads/import-list/import-list-dto.interface';

export const ImportListFields: KeysEnum<ImportListDto> = {
    Id: 'Id',
    FileName: 'FileName',
    FileSize: 'FileSize',
    StatusName: 'StatusName',
    TotalCount: 'TotalCount',
    TypeName: 'TypeName'
};