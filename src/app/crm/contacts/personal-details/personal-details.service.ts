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

    showPersonalDetailsDialog() {
        setTimeout(() => {
            if (!this.dialog.getDialogById('personal-settings'))
                this.dialog.open(PersonalDetailsDialogComponent, {
                    id: 'personal-settings',
                    panelClass: ['slider'],
                    disableClose: false,
                    hasBackdrop: false,
                    closeOnNavigation: true,
                    data: {}
                });
        }, 600);
    }
}