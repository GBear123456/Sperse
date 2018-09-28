import { Component, ViewEncapsulation } from '@angular/core';
import { PackageChooserComponent } from '@app/shared/common/payment-wizard/package-chooser/package-chooser.component';

@Component({
    selector: 'app-package-chooser-widget',
    templateUrl: '../../../../src/app/shared/common/payment-wizard/package-chooser/package-chooser.component.html',
    styleUrls: [
        '../../../../node_modules/@angular/material/prebuilt-themes/indigo-pink.css',
        '../../../../src/app/shared/common/payment-wizard/package-chooser/package-chooser.component.less'
    ],
    encapsulation: ViewEncapsulation.Emulated
})
export class PackageChooserWidgetComponent extends PackageChooserComponent {}
