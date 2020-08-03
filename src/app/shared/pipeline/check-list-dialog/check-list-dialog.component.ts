/** Core imports */
import { Component, OnInit, Inject, AfterViewInit, ElementRef } from '@angular/core';

/** Third party imports */
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

/** Application imports */
import { StageChecklistServiceProxy } from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'check-list-dialog',
    templateUrl: './check-list-dialog.component.html',
    styleUrls: ['./check-list-dialog.component.less']
})
export class CheckListDialogComponent implements OnInit, AfterViewInit {
    private slider: any;
    dataSource: any[] = [{id: 2, name: 'Some checklist', sortOrder: 3}, {id: 6, name: 'One More checklist', sortOrder: 4}];

    validationRules = [
        { type: 'required', message: this.ls.l('FieldIsRequired') },
    ];

    constructor(
        private elementRef: ElementRef,
        public dialogRef: MatDialogRef<CheckListDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public dialogData: any,
        public ls: AppLocalizationService
    ) {
      this.dataSource = dialogData.stage.checklistPoints;
    }

    ngOnInit() {
        this.slider = this.elementRef.nativeElement.closest('.slider');
        this.slider.classList.add('hide', 'min-width-0');
        this.dialogRef.updateSize('0px', '0px');
        this.dialogRef.updatePosition({
            top: '210px',
            right: '-100vw'
        });
    }

    ngAfterViewInit() {
        setTimeout(() => {
            this.slider.classList.remove('hide');
            this.dialogRef.updateSize(undefined, '100vh');
            setTimeout(() => {
                this.dialogRef.updatePosition({
                    top: '210px',
                    right: '0px'
                });
            }, 100);
        });
    }

    addNewRecord() {
        this.dataSource.push({sortOrder: 0, id: null, name: undefined});
    }

    onChanged(event, cell) {
        if (cell.data.id) {
            if (event.value)
                this.dataSource[cell.rowIndex].name = event.value;
            else
                alert('value should be defined');
        } else {
            if (event.value)
                this.dataSource[cell.rowIndex].name = event.value;
            else
                this.dataSource.splice(cell.rowIndex, 1);
        }
    }

    onDelete(event) {
        console.log(event);
    }

    onReorder = (event) => {
        this.dataSource[event.fromIndex].sortOrder = this.dataSource[event.toIndex].sortOrder + 1;
    }

    close() {
        this.dialogRef.close();
    }
}