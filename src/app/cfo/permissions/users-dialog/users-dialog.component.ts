import { Component, OnInit, Inject, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

@Component({
    selector: 'app-users-dialog',
    templateUrl: './users-dialog.component.html',
    styleUrls: ['./users-dialog.component.less'],
    encapsulation: ViewEncapsulation.None
})
export class UsersDialogComponent implements OnInit {
    constructor(public dialogRef: MatDialogRef<UsersDialogComponent>,
                @Inject(MAT_DIALOG_DATA) public data: any) {}

    ngOnInit() {}

    userChosen(userId: number) {
        this.dialogRef.close(userId);
    }

}
