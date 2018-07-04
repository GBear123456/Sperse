import { Component, Injector, OnInit, ViewChild } from '@angular/core';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { FormGroup } from '@angular/forms';
import { MatHorizontalStepper } from '@angular/material';

@Component({
    selector: 'app-cfo-intro',
    templateUrl: './cfo-intro.component.html',
    styleUrls: ['./cfo-intro.component.less'],
    animations: [appModuleAnimation()]
})
export class CfoIntroComponent extends CFOComponentBase implements OnInit {
    @ViewChild('stepper') stepper: MatHorizontalStepper;
    isLinear = false;
    firstFormGroup: FormGroup;
    secondFormGroup: FormGroup;
    videoIndex = 6;

    constructor(
        injector: Injector
    ) {
        super(injector);
    }

    ngOnInit() {

    }

    showVideo() {
        this.stepper.selectedIndex = this.videoIndex;
    }
}
