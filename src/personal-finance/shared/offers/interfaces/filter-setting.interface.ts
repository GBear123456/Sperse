import { Observable } from '@node_modules/rxjs';

export interface FilterSettingInterface {
    name?: string;
    value$?: any;
    values$?: Observable<any[]>;
}
