/** Core imports */
import { Component, Injector, OnInit, ViewChild } from '@angular/core';

/** Third party imports */
import { DxScrollViewComponent } from 'devextreme-angular/ui/scroll-view';

/** Application imports */
import { AppComponentBase } from '@shared/common/app-component-base';
import { ExtensionServiceProxy } from '@shared/service-proxies/service-proxies';

@Component({
    selector: 'app-marketplace',
    templateUrl: './marketplace.component.html',
    styleUrls: ['./marketplace.component.less'],
    providers: [ ExtensionServiceProxy ]
})
export class MarketplaceComponent extends AppComponentBase implements OnInit {
    @ViewChild('content') scrollView: DxScrollViewComponent;
    public headlineConfig = {
        names: [this.l('Marketplace')],
        onRefresh: () => {
            this.refresh();
        },
        icon: 'globe',
        buttons: []
    };
    extensionList: any;
    extensionCategories: any;
    sortedList = [];

    private rootComponent: any;

    constructor(
        injector: Injector,
        private extensionServiceProxy: ExtensionServiceProxy
    ) {
        super(injector);
    }

    ngOnInit() {
        this.rootComponent = this.getRootComponent();
        this.rootComponent.overflowHidden(true);
        this.getExtentionCategories();
    }

    refresh() {}

    scrollToCategory(categoryId: number) {
        let element = document.getElementById('category-' + categoryId);
        if (element) this.scrollView.instance.scrollTo(element.offsetTop);
    }

    getExtentionCategories() {
        this.extensionServiceProxy.getCategories().subscribe((result) => {
            this.extensionCategories = result;
            this.getAll(undefined, undefined);
        });
    }

    getSortedItems() {
        this.extensionCategories.forEach((category) => {
            category['items'] = this.extensionList.filter((item) => item.categoryId === category.id);
            category['visibleItems'] = category.id === 1 ? 6 : 3;
            this.sortedList.push(category);
        });
    }

    getAll(categoryId, topCount) {
        this.extensionServiceProxy.getAll(categoryId, topCount).subscribe((result) => {
            this.extensionList = result;
            this.getSortedItems();
        });
    }
}
