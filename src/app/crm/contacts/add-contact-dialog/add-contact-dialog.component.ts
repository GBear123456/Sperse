/** Core imports */
import { Component, OnInit, AfterViewInit, Inject, Injector, ElementRef, ViewChild } from '@angular/core';

/** Third party imports */
import { Store, select } from '@ngrx/store';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { filter } from 'rxjs/operators';
import * as _ from 'underscore';

/** Application imports */
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppConsts } from '@shared/AppConsts';
import { PersonContactInfoDto } from '@shared/service-proxies/service-proxies';
import { NameParserService } from '@app/crm/shared/name-parser/name-parser.service';

@Component({
    templateUrl: 'add-contact-dialog.html',
    styleUrls: ['add-contact-dialog.less']
})
export class AddContactDialogComponent extends AppComponentBase implements OnInit, AfterViewInit {

    private slider: any;
    constructor(injector: Injector,
                @Inject(MAT_DIALOG_DATA) public data: PersonContactInfoDto,
                private elementRef: ElementRef,
                private fullNameParser: NameParserService,
                public dialogRef: MatDialogRef<AddContactDialogComponent>,
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);

        this.dialogRef.beforeClose().subscribe(() => {
            this.dialogRef.updatePosition({
                top: '157px',
                right: '-100vw'
            });
        });
    }

    ngOnInit() {
        this.dialogRef.disableClose = true;
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
            this.dialogRef.updateSize(undefined, '100vh');
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
            this.data.fullName, this.data.person);
    }

    onSave(event) {        
        this.dialogRef.close();
    }
}