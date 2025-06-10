import { Observable } from 'rxjs';

export interface NavLink {
    name?: string;
    label?: string;
    label$?: Observable<string>;
    route: string;
    disabled?: boolean;
    visible$?: Observable<boolean>;
}
