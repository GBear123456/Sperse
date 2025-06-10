import { GlobalSearchGroupEntity } from '@app/shared/layout/top-bar/global-search/global-search-group-item.interface';
import { Params } from '@angular/router';
import { ItemTypeEnum } from '@shared/common/item-details-layout/item-type.enum';

export interface GlobalSearchGroup {
    name: string;
    entities: GlobalSearchGroupEntity[];
    link: string;
    linkParams?: Params;
}