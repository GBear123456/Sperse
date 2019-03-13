import { Component, Injector, Output, EventEmitter, ViewChild } from '@angular/core';
import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';

@Component({
    selector: 'app-modal-dialog',
    templateUrl: 'app-modal-dialog.component.html',
    styleUrls: ['app-modal-dialog.component.less']
})
export class AppModalDialogComponent extends ModalDialogComponent {
    @Output() onTitleKeyUp: EventEmitter<any> = new EventEmitter<any>();
    @Output() onTitleChanged: EventEmitter<any> = new EventEmitter<any>();

    constructor(
        injector: Injector
    ) {
        super(injector);
    }

    titleChanged(event) {
        let title = event.element.getElementsByTagName('input')[0].value;
        this.data.isTitleValid = Boolean(title);
        this.onTitleChanged.emit(title);
    }

    titleKeyUp(event) {
        this.onTitleKeyUp.emit(event.element.getElementsByTagName('input')[0].value);
    }
}
