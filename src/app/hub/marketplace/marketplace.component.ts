/** Core imports */
import { Component, Injector, OnInit } from '@angular/core';

/** Third party imports */

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

    filterByCategory(categoryId: number) {
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
