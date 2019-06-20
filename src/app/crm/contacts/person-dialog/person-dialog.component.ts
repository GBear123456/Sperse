import { Component, Inject, Injector } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppConsts } from '@shared/AppConsts';
import { ContactInfoDto } from 'shared/service-proxies/service-proxies';

@Component({
    selector: 'person-dialog',
    templateUrl: './person-dialog.component.html',
    styleUrls: ['./person-dialog.component.less']
})
export class PersonDialogComponent extends AppComponentBase {
    constructor(
        injector: Injector,
        @Inject(MAT_DIALOG_DATA) public data: ContactInfoDto,
        public dialog: MatDialog,
        public dialogRef: MatDialogRef<PersonDialogComponent>
    ) {
        super(injector);
    }
}
