/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Observable, of } from 'rxjs';
import { delay, switchMap } from 'rxjs/operators';

/** Application imports */
import { PersonalDetailsDialogComponent } from './personal-details-dialog/personal-details-dialog.component';

@Injectable()
export class PersonalDetailsService {
    constructor(
        public dialog: MatDialog
    ) {}

    showPersonalDetailsDialog(dialogId: string = 'personal-details-dialog'): Observable<undefined> {
        return of(dialogId).pipe(
            delay(0),
            switchMap((dialogId: string = 'personal-details-dialog') => {
                let dialog: MatDialogRef<PersonalDetailsDialogComponent> = this.dialog.getDialogById(dialogId);
                if (!dialog) {
                    dialog = this.dialog.open(PersonalDetailsDialogComponent, {
                        id: dialogId,
                        panelClass: ['slider'],
                        disableClose: false,
                        hasBackdrop: false,
                        closeOnNavigation: true,
                        data: {}
                    });
                }
                return dialog.afterClosed();
            })
        );
    }
}