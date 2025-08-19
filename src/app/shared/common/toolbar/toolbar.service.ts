import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, ReplaySubject } from 'rxjs';

@Injectable()
export class ToolbarService {
    private _isSearchBoxEnabled: BehaviorSubject<boolean> = new BehaviorSubject(false);
    private _latestSearchConfig: ReplaySubject<any> = new ReplaySubject(1);

    isSearchBoxEnabled$: Observable<boolean> = this._isSearchBoxEnabled.asObservable();
    latestSearchConfig$: Observable<any> = this._latestSearchConfig.asObservable();

    private _tooltipTarget$ = new BehaviorSubject<string | null>(null);
    tooltipTarget$ = this._tooltipTarget$.asObservable();

    get isSearchBoxEnabled(): boolean {
        return this._isSearchBoxEnabled.getValue();
    } 
    /**
     * Get item index in group and amount of items in group and returns item position in group
     * @param {number} itemIndex
     * @param {number} itemsInGroup
     * @return {"first" | "inside" | "single" | "last"}
     */
    static getGroupItemPosition(itemIndex: number, itemsInGroup: number): 'first' | 'inside' | 'single' | 'last' {
        const isLast = itemsInGroup === itemIndex + 1;
        return itemIndex ? (isLast ? 'last' : 'inside') : (isLast ? 'single' : 'first');
    }

    /**
     * Return item reverted index
     * @param {number} itemIndex
     * @param {number} itemsInGroup
     * @return {number}
     */
    static getGroupItemIndex(itemIndex: number, itemsInGroup: number) {
        return itemsInGroup - itemIndex;
    }

    /**
     * Set attributes to correctly display borders and border-radius
     * @param e
     */
    onItemRendered(e) {
        const button = e.itemElement.querySelector('.dx-button');
        if (button) {
            const itemGroupItems = e.component.option('items').filter(item => item.location === e.itemData.location);
            const itemIndexInGroup = itemGroupItems.findIndex(item => item === e.itemData);
            button.setAttribute('group-item-count', itemGroupItems.length);
            button.setAttribute('group-item-index', itemGroupItems.length - itemIndexInGroup);
            button.setAttribute('group-item-position', ToolbarService.getGroupItemPosition(itemIndexInGroup, itemGroupItems.length));
        }
    }

    setSearchConfig(config: any) {
        this._latestSearchConfig.next(config);
    }

    showSearchBox(display: boolean) {
        this._isSearchBoxEnabled.next(display);
    }

    showTooltipFor(target: string) {
        this._tooltipTarget$.next(target);
    }

    hideTooltip() {
        this._tooltipTarget$.next(null);
    }
}
