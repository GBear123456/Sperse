import { Observable } from '@node_modules/rxjs';
import { CloseComponentAction } from '@app/shared/common/close-component.service/close-component-action.enum';

export interface ICloseComponent {
    dataChanged(): boolean;
    handleDeactivate(deactivateAction: CloseComponentAction): Observable<boolean>;
    skipClosePopup?(currentStateUrl: string, nextStateUrl: string): boolean;
}
