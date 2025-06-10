/** Core imports */
import {
    Component,
    Input,
    HostListener,
    AfterViewInit,
    Renderer2,
    ViewChild,
    ViewChildren,
    QueryList,
    ElementRef,
    OnChanges,
    SimpleChanges, OnDestroy
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

/** Third party imports */
import { Subscription } from 'rxjs';

/** Application imports */
import { MemberAreaLink } from '@shared/common/area-navigation/member-area-link.enum';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppConsts } from '@shared/AppConsts';

@Component({
    selector: 'area-navigation',
    templateUrl: './area-navigation.component.html',
    styleUrls: ['./area-navigation.component.less']
})
export class AreaNavigationComponent implements AfterViewInit, OnChanges, OnDestroy {
    @Input() memberAreaLinks: MemberAreaLink[];
    @Input() actionsButtons: any[];
    @ViewChildren('sublinks') sublinksRefs: QueryList<ElementRef>;
    @ViewChild('linksList') linksList: ElementRef;
    responsiveMemberAreaLinks = [];
    inlineMemberAreaLinks: MemberAreaLink[] = [];
    resizeTimeout: any;
    loggedUserId: number = this.appSession.userId;
    currentUrl = this.router.url;
    routeEventsSubscription: Subscription = this.router.events.subscribe(() => {
        this.currentUrl = this.router.url;
    });

    @HostListener('window:click') onClick() {
        this.closeAllOpenedMenuItems();
    }

    @HostListener('window:resize') onResize() {
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => this.checkMenuWidth());
    }

    constructor(
        private renderer: Renderer2,
        private router: Router,
        private appSession: AppSessionService,
        private elementRef: ElementRef,
        private route: ActivatedRoute,
        public ls: AppLocalizationService
    ) {}

    ngOnChanges(changes: SimpleChanges) {
        if (changes.memberAreaLinks) {
            this.checkMenuWidth();
        }
    }

    ngAfterViewInit() {
        this.checkMenuWidth();
    }

    checkMenuWidth() {
        const itemWidth = 9, maxInnerWidth = 1140, logoAndMenuWidth = 400;
        let menuSpace = Math.round(Math.min(innerWidth, maxInnerWidth) - logoAndMenuWidth);
        let menuItemsLength = 0;

        this.responsiveMemberAreaLinks.length = 0;
        this.inlineMemberAreaLinks.length = 0;

        this.memberAreaLinks.forEach((item, index) => {
            menuItemsLength += (itemWidth * this.memberAreaLinks[index].name.length + 50);
            if (menuItemsLength > menuSpace)
                this.responsiveMemberAreaLinks.push(this.memberAreaLinks[index]);
            else
                this.inlineMemberAreaLinks.push(this.memberAreaLinks[index]);
        });

        if (window.innerWidth < 530 && !this.loggedUserId) {
            this.responsiveMemberAreaLinks.push(...this.actionsButtons);
        }
    }

    navigationItemEnter(e, link: MemberAreaLink) {
        if (link.sublinks && link.sublinks.length) {
            setTimeout(() => this.renderer.addClass(e.target, 'opened'));
        } else {
            return;
        }
    }

    navigationItemLeave(e) {
        if (!this.elementRef.nativeElement.contains(e.relatedTarget) ||
            this.linksList.nativeElement.contains(e.relatedTarget)
        ) {
            this.closeAllOpenedMenuItems();
        }
    }

    handleLinkClick(e, link: MemberAreaLink) {
        if (AppConsts.isMobile && link.sublinks && link.sublinks.length) {
            setTimeout(() => this.renderer.addClass(e.target.parentElement, 'opened'));
        } else {
            this.router.navigate(
                [ link.routerUrl || this.getFirstVisibleLink(link.sublinks)],
                { relativeTo: this.route }
            );
        }
    }

    getFirstVisibleLink(sublinks: MemberAreaLink[]): string {
        if (!sublinks)
            return;

        let firstVisibleItem = sublinks.find(x => !x.hidden);
        return firstVisibleItem && firstVisibleItem.routerUrl;
    }

    private closeAllOpenedMenuItems() {
        this.sublinksRefs.toArray().forEach(sublinkRef => this.renderer.removeClass(sublinkRef.nativeElement.parentElement, 'opened'));
    }

    ngOnDestroy() {
        this.routeEventsSubscription.unsubscribe();
    }
}
