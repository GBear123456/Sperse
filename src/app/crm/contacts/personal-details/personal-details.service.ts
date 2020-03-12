/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';

/** Application imports */
import { PersonalDetailsDialogComponent } from './personal-details-dialog/personal-details-dialog.component';

@Injectable()
export class PersonalDetailsService {

    constructor(
        public dialog: MatDialog
    ) {}

    showPersonalDetailsDialog(dialogId: string = 'personal-details-dialog') {
        setTimeout(() => {
            if (!this.dialog.getDialogById(dialogId)) {
                this.dialog.open(PersonalDetailsDialogComponent, {
                    id: dialogId,
                    panelClass: ['slider'],
                    disableClose: false,
                    hasBackdrop: false,
                    closeOnNavigation: true,
                    data: {}
                });
            }
        });
    }
}