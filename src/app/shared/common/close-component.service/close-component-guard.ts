/** Core imports */
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanDeactivate, RouterStateSnapshot } from '@angular/router';

/** Third party imports */
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

/** Application imports */
import { CloseComponentService } from './close-component.service';
import { CloseComponentAction } from './close-component-action.enum';

@Injectable()
export class CloseComponentGuard implements CanDeactivate<any> {
    constructor(private closeComponentService: CloseComponentService) {}

    canDeactivate(component: any, currentRoute: ActivatedRouteSnapshot, currentState: RouterStateSnapshot, nextState?: RouterStateSnapshot): Observable<boolean> {
        let result$: Observable<CloseComponentAction>;
        if (component.skipClosePopup && component.skipClosePopup(currentState.url, nextState.url)) {
            result$ = of(CloseComponentAction.Discard);
        } else {
            result$ = this.closeComponentService.checkDataChangeAndGetMovingAction(component);
        }
        return result$.pipe(switchMap(result => component.handleDeactivate(result)));
    }
}

