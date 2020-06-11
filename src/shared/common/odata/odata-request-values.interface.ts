import { Param } from '@shared/common/odata/param.model';

export interface ODataRequestValues {
    filter: any;
    params: Param[];
}