/** Core imports */
import { Directive, ElementRef, AfterViewInit, Renderer2 } from '@angular/core';

/** Third party imports */
import { ClipboardService } from 'ngx-clipboard'
import { NotifyService } from '@abp/notify/notify.service';

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Directive({
  selector: 'dx-data-grid'
})
export class dxDataGridClipboardDirective implements AfterViewInit {
    private observer: MutationObserver;
    private element = this.elRef.nativeElement;
    private pool = [];
    private copyToClipboard = (event) => {
        this.clipboardService.copyFromContent(event.target.parentNode.innerText.trim());
        this.notifyService.info(this.ls.l('SavedToClipboard'));

        event.stopPropagation();
        event.preventDefault();
    }

    constructor(
        private elRef: ElementRef,
        private renderer: Renderer2,
        private ls: AppLocalizationService,
        private notifyService: NotifyService,
        private clipboardService: ClipboardService
    ) {   }

    ngAfterViewInit() {
        this.observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {                
                this.element.querySelectorAll('.dx-datagrid-rowsview .dx-datagrid-content table:first-child .clipboard-holder').forEach((elm, i) => {
                    if (elm.innerText.trim() && !elm.querySelector('i')) {
                        if (!this.pool[i]) {
                            this.pool[i] = this.renderer.createElement('i');
                            this.pool[i].addEventListener('click', this.copyToClipboard);
                            this.renderer.addClass(this.pool[i], 'fa-clone');
                            this.renderer.addClass(this.pool[i], 'fa');
                        }
                        this.renderer.appendChild(elm, this.pool[i]);
                    }
                });
            });   
        });

        this.observer.observe(this.element, { 
            characterData: false,
            attributes: false, 
            childList: true,
            subtree: true
        });
    }

    ngDestroy() {
        this.observer.disconnect();
        this.pool.map(elm => {
            elm.removeEventListener(this.copyToClipboard);
            this.renderer.removeClass(elm, 'fa-clone');
            this.renderer.removeClass(elm, 'fa');
            this.renderer.destroyNode(elm);
            return undefined;
        });
    }
}