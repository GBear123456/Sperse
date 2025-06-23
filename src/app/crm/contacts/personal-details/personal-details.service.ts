<<<<<<< HEAD
/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';

/** Application imports */
import { LayoutService } from '@app/shared/layout/layout.service';
import { PersonalDetailsDialogComponent } from './personal-details-dialog/personal-details-dialog.component';
import { ContactsService } from '../contacts.service';

@Injectable()
export class PersonalDetailsService {
    constructor(
        private layoutService: LayoutService,
        private contactsService: ContactsService,
        public dialog: MatDialog
    ) {}

     togglePersonalDetailsDialog(dialogId: string = 'personal-details-dialog', open = true): void {
         if (!this.layoutService.showModernLayout) {
             let dialog = this.dialog.getDialogById(dialogId);
             if (!dialog) {
                 if (open)
                     dialog = this.dialog.open(PersonalDetailsDialogComponent, {
                         id: dialogId,
                         panelClass: ['slider'],
                         disableClose: true,
                         hasBackdrop: false,
                         closeOnNavigation: true,
                         data: {}
                     });
             } else if (!open)
                 dialog.close();
         }
    }
=======
/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';

/** Application imports */
import { LayoutService } from '@app/shared/layout/layout.service';
import { PersonalDetailsDialogComponent } from './personal-details-dialog/personal-details-dialog.component';
import { ContactsService } from '../contacts.service';

@Injectable()
export class PersonalDetailsService {
    constructor(
        private layoutService: LayoutService,
        private contactsService: ContactsService,
        public dialog: MatDialog
    ) {}

     togglePersonalDetailsDialog(dialogId: string = 'personal-details-dialog', open = true): void {
         if (!this.layoutService.showModernLayout) {
             let dialog = this.dialog.getDialogById(dialogId);
             if (!dialog) {
                 if (open)
                     dialog = this.dialog.open(PersonalDetailsDialogComponent, {
                         id: dialogId,
                         panelClass: ['slider'],
                         disableClose: true,
                         hasBackdrop: false,
                         closeOnNavigation: true,
                         data: {}
                     });
             } else if (!open)
                 dialog.close();
         }
    }
>>>>>>> f999b481882149d107812286d0979872df712626
}