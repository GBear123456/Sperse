import { Observable } from '@node_modules/rxjs';

export interface FilterSettingInterface {
    name?: string;
    selected$?: Observable<any>;
    values$?: Observable<any[]>;
}
