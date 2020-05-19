/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { delay, filter } from 'rxjs/operators';

/** Application imports */
import { PersonalDetailsDialogComponent } from './personal-details-dialog/personal-details-dialog.component';
import { ContactsService } from '../contacts.service';

@Injectable()
export class PersonalDetailsService {
    constructor(
        private contactsService: ContactsService,
        public dialog: MatDialog
    ) {}

    togglePersonalDetailsDialog(dialogId: string, closeIfExists = true): void {
        of(dialogId).pipe(
            delay(0)
        ).subscribe((dialogId: string = 'personal-details-dialog') => {
            if (!this.dialog.getDialogById(dialogId)) {
                this.dialog.open(PersonalDetailsDialogComponent, {
                    id: dialogId,
                    panelClass: ['slider'],
                    disableClose: false,
                    hasBackdrop: false,
                    closeOnNavigation: true,
                    data: {}
                }).afterClosed().pipe(filter(Boolean)).subscribe(() => {
                    this.contactsService.closeSettingsDialog();
                });
                this.contactsService.openSettingsDialog();
            } else if (closeIfExists) {
                this.contactsService.closeSettingsDialog();
            }
        });
    }
}