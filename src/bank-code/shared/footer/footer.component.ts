import {Component, OnInit} from '@angular/core';
import {ConditionsModalComponent} from '@shared/common/conditions-modal/conditions-modal.component';
import {MatDialog} from '@angular/material';
import {ConditionsType} from '@shared/AppEnums';

@Component({
    selector: 'bank-code-footer',
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.less']
})
export class FooterComponent implements OnInit {
    conditions = ConditionsType;

    constructor(
        private dialog: MatDialog
    ) {
    }

    ngOnInit() {
    }

    openConditionsDialog(type: any) {
        this.dialog.open(ConditionsModalComponent, { panelClass: ['slider', 'footer-slider'], data: { type: type } });
    }

}
