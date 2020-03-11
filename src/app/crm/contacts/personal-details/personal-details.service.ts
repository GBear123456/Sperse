/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Observable } from 'rxjs';

/** Application imports */
import { PersonalDetailsDialogComponent } from './personal-details-dialog/personal-details-dialog.component';

@Injectable()
export class PersonalDetailsService {

    constructor(
        public dialog: MatDialog
    ) {}

    showPersonalDetailsDialog(): Observable<MatDialogRef<PersonalDetailsDialogComponent>> {
        return new Observable((subscriber) => {
            setTimeout(() => {
                subscriber.next(this.dialog.open(PersonalDetailsDialogComponent, {
                    id: 'personal-details-dialog',
                    panelClass: ['slider'],
                    disableClose: false,
                    hasBackdrop: false,
                    closeOnNavigation: true,
                    data: {}
                }));
                subscriber.complete();
            });
        });
    }
}