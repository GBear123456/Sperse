import { Component, Injector, OnInit, ViewChild } from '@angular/core';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { MatDialog } from '@angular/material';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatHorizontalStepper } from '@angular/material';

@Component({
    selector: 'app-cfo-intro',
    templateUrl: './cfo-intro.component.html',
    styleUrls: ['./cfo-intro.component.less'],
    animations: [appModuleAnimation()]
})
export class CfoIntroComponent extends CFOComponentBase implements OnInit {
    isLinear = false;
    firstFormGroup: FormGroup;
    secondFormGroup: FormGroup;
    @ViewChild('stepper') stepper: MatHorizontalStepper;
    videoIndex = 6;

    constructor(
        injector: Injector,
        public dialog: MatDialog,
        private _formBuilder: FormBuilder
    ) {
        super(injector);
    }

    ngOnInit() {

    }

    showVideo() {
        this.stepper.selectedIndex = this.videoIndex;
    }
}
