/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { Observable, from, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import swal from 'sweetalert';

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { CloseComponentAction } from './close-component-action.enum';

@Injectable()
export class CloseComponentService {
    constructor(private ls: AppLocalizationService) {}

    checkDataChangeAndGetMovingAction(component): Observable<CloseComponentAction> {
        let result$ = of(CloseComponentAction.Discard);
        if (component.dataChanged()) {
            result$ = from(swal({
                title: this.ls.l('UnsavedChanges'),
                buttons: {
                    cancel: {
                        text: this.ls.l('Save'),
                        value: CloseComponentAction.Save,
                        visible: true,
                        className: '',
                        closeModal: true,
                    },
                    confirm: {
                        text: this.ls.l('Discard'),
                        value: CloseComponentAction.Discard,
                        visible: true,
                        className: '',
                        closeModal: true
                    },
                    continue: {
                        text: this.ls.l('ContinueEditing'),
                        value: CloseComponentAction.ContinueEditing,
                        visible: true,
                        className: '',
                        closeModal: true
                    }
                }
            }));
        }
        return result$;
    }
}

