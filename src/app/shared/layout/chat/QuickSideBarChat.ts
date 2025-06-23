import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable()
export class QuickSideBarChat {
    private isOpened: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    public isOpened$: Observable<boolean> = this.isOpened.asObservable();

    initOffcanvas(): void {
        let $offCanvas = ($('#m_quick_sidebar') as any).mOffcanvas({
            class: 'm-quick-sidebar',
            //overlay: false,
            close: $('#m_quick_sidebar_close'),
            toggle: $('#m_quick_sidebar_toggle')
        });

        // run once on first time dropdown shown
        ($('#m_quick_sidebar') as any).mOffcanvas().one('afterShow', () => {
            mApp.block($('#m_quick_sidebar'));

            setTimeout(() => {
                mApp.unblock($('#m_quick_sidebar'));
                ($('#m_quick_sidebar').find('.m-quick-sidebar__content') as any).removeClass('m--hide');
            }, 1000);
        });
    }

    hide(): void {
        $('body, #m_quick_sidebar').removeClass('m-quick-sidebar--on');
        ($('#m_quick_sidebar') as any).mOffcanvas().hide();
        setTimeout(() => this.isOpened.next(false));
    }

    show(): void {
        $('body, #m_quick_sidebar').addClass('m-quick-sidebar--on');
        ($('#m_quick_sidebar') as any).mOffcanvas().show();
        setTimeout(() => this.isOpened.next(true));
    }

    toggle() {
        if ($('body').hasClass('m-quick-sidebar--on'))
            this.hide();
        else
            this.show();
    }

    init(scrollEvent: any): void {
        this.initOffcanvas();
        if (scrollEvent) {
            scrollEvent();
        }
    }
}
