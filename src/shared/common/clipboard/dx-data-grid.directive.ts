/** Core imports */
import { Directive, AfterViewInit, OnDestroy, Renderer2 } from '@angular/core';

/** Third party imports */
import { ClipboardService } from 'ngx-clipboard';
import { NotifyService } from '@abp/notify/notify.service';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Directive({
  selector: 'dx-data-grid'
})
export class DxDataGridClipboardDirective implements AfterViewInit, OnDestroy {
    private subscription;
    private clipboardIcon;
    private copyToClipboard = (event) => {
        this.clipboardService.copyFromContent(event.target.parentNode.innerText.trim());
        this.notifyService.info(this.ls.l('SavedToClipboard'));

        event.stopPropagation();
        event.preventDefault();
    }

    constructor(
        private renderer: Renderer2,
        private ls: AppLocalizationService,
        private notifyService: NotifyService,
        private component: DxDataGridComponent,
        private clipboardService: ClipboardService
    ) {
        this.clipboardIcon = this.renderer.createElement('i');
        this.clipboardIcon.addEventListener('click', this.copyToClipboard);
        this.renderer.addClass(this.clipboardIcon, 'save-to-clipboard');
    }

    ngAfterViewInit() {
        this.subscription = this.component.onCellHoverChanged.subscribe(event => {
            if (event.rowType == 'data' && event.eventType == 'mouseover') {
                if (event.cellElement.classList.contains('clipboard-holder'))
                    this.appendClipboardIcon(event.cellElement);
                else
                    this.appendClipboardIcon(event.cellElement.querySelector('.clipboard-holder'));
            }
        });
    }

    appendClipboardIcon(elm) {
        if (elm && elm.innerText.trim() && !elm.querySelector('i'))
            this.renderer.appendChild(elm, this.clipboardIcon);
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
        this.clipboardIcon.removeEventListener('click', this.copyToClipboard);
        this.renderer.removeClass(this.clipboardIcon, 'save-to-clipboard');
        if (this.clipboardIcon.parentNode)
            this.renderer.removeChild(this.clipboardIcon.parentNode, this.clipboardIcon);
    }
}