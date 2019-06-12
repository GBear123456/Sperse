import { Injectable } from '@angular/core';

@Injectable()
export class ToolbarService {

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
        const itemGroupItems = e.component.option('items').filter(item => item.location === e.itemData.location);
        const itemIndexInGroup = itemGroupItems.findIndex(item => item === e.itemData);
        const button = e.itemElement.querySelector('.dx-button');
        button.setAttribute('group-item-count', itemGroupItems.length);
        button.setAttribute('group-item-index', itemGroupItems.length - itemIndexInGroup);
        button.setAttribute('group-item-position', ToolbarService.getGroupItemPosition(itemIndexInGroup, itemGroupItems.length));
    }
}
