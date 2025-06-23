import { Component, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ContactInfoDto } from 'shared/service-proxies/service-proxies';

@Component({
    selector: 'person-dialog',
    templateUrl: './person-dialog.component.html',
    styleUrls: ['./person-dialog.component.less']
})
export class PersonDialogComponent {
    constructor(
        @Inject(MAT_DIALOG_DATA) public data: ContactInfoDto,
        public dialog: MatDialog,
        public dialogRef: MatDialogRef<PersonDialogComponent>
    ) {}
}
