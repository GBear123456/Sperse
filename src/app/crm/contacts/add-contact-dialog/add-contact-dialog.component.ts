/** Core imports */
import { Component, OnInit, AfterViewInit, Inject, ElementRef } from '@angular/core';

/** Third party imports */
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

/** Application imports */
import { ContactInfoDto } from '@shared/service-proxies/service-proxies';
import { NameParserService } from '@shared/common/name-parser/name-parser.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    templateUrl: 'add-contact-dialog.html',
    styleUrls: ['add-contact-dialog.less']
})
export class AddContactDialogComponent implements OnInit, AfterViewInit {

    private slider: any;
    constructor(
        private elementRef: ElementRef,
        private fullNameParser: NameParserService,
        public ls: AppLocalizationService,
        public dialogRef: MatDialogRef<AddContactDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: ContactInfoDto,
    ) {
        this.dialogRef.beforeClosed().subscribe(() => {
            this.dialogRef.updatePosition({
                top: '157px',
                right: '-100vw'
            });
        });
    }

    ngOnInit() {
        this.slider = this.elementRef.nativeElement.closest('.slider');
        this.slider.classList.add('hide');
        this.dialogRef.updateSize('0px', '0px');
        this.dialogRef.updatePosition({
            top: '157px',
            right: '-100vw'
        });
    }

    ngAfterViewInit() {
        setTimeout(() => {
            this.slider.classList.remove('hide');
            this.dialogRef.updateSize(undefined, 'calc(100vh - 157px)');
            setTimeout(() => {
                this.dialogRef.updatePosition({
                    top: '157px',
                    right: '0px'
                });
            }, 100);
        });
    }

    onValueChanged(event) {
        this.fullNameParser.parseIntoPerson(
            this.data.personContactInfo.fullName, this.data.personContactInfo.person);
    }

    onSave() {
        this.dialogRef.close();
    }
}
