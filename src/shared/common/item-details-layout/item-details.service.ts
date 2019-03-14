import { Injectable } from '@angular/core';
import { ItemTypeEnum } from '@shared/common/item-details-layout/item-type.enum';
import DataSource from 'devextreme/data/data_source';
import { Observable, of, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ItemFullInfo } from '@shared/common/item-details-layout/item-full-info';
import { TargetDirectionEnum } from '@app/crm/contacts/target-direction.enum';
import { DataSourceService } from '@app/shared/common/data-source/data-source.service';

class ItemsDataSource {
    [itemType: string]: {
        dataSource: DataSource,
        loadMethod: () => Observable<any>
    };
}

@Injectable()
export class ItemDetailsService {
    private itemsListSource: ItemsDataSource = new ItemsDataSource();
    constructor(private dataSourceService: DataSourceService) {}
    setItemsSource(itemType: ItemTypeEnum, dataSource: any, loadMethod?: () => Observable<any>) {
        this.itemsListSource[itemType] = {
            dataSource: dataSource,
            loadMethod: loadMethod
        };
    }

    getItemsSource(itemType: ItemTypeEnum): Observable<DataSource> {
        return this.itemsListSource[itemType] && this.itemsListSource[itemType].dataSource
               ? of(this.itemsListSource[itemType].dataSource)
               : of(null); //this.dataSourceService.getDataSource(itemType, true);
    }

    /**
     * Return current, next or previous item from the provided.
     * If dataSource has no next or previous items - it loads next or previous items from the server
     * @param {ItemTypeEnum} itemType
     * @param {number} itemId
     * @param {TargetDirectionEnum} itemDirection
     * @return {Observable<ItemFullInfo>}
     */
    getItemFullInfo(itemType: ItemTypeEnum, itemId: number, itemDirection: TargetDirectionEnum, itemSearchProperty = 'Id'): Observable<ItemFullInfo> {
        const dataSource$ = this.getItemsSource(itemType);
        return dataSource$.pipe(switchMap(dataSource => {
            let fullInfo$ = of(null);
            if (dataSource) {
                let items = dataSource['entities'] || dataSource.items();
                let itemIndex = 0;
                let itemData = items.find((item, index) => {
                    if (item[itemSearchProperty] == itemId) {
                        itemIndex = index;
                        return true;
                    }
                    return false;
                });
                const isFirstOnPage = itemIndex === 0;
                const itemsCountOnTheLastPage = this.getItemsCountOnLastPage(dataSource['total'] || dataSource.totalCount(), dataSource.pageSize(), dataSource.pageIndex());
                const isLastOnPage = itemIndex + 1 === items.length || dataSource.isLastPage() && itemIndex + 1 === itemsCountOnTheLastPage;
                const isFirstOnList = isFirstOnPage && dataSource.pageIndex() === 0;
                const isLastOnList = dataSource.isLastPage() && itemIndex + 1 === itemsCountOnTheLastPage;
                fullInfo$ = of({
                    itemData: itemData,
                    isFirstOnPage: isFirstOnPage,
                    isLastOnPage: isLastOnPage,
                    isFirstOnList: isFirstOnList,
                    isLastOnList: isLastOnList
                });
                if (itemDirection !== TargetDirectionEnum.Current && (!isFirstOnList || !isLastOnList)) {
                    if (itemDirection === TargetDirectionEnum.Prev) {
                        if (isFirstOnPage) {
                            /** Update data sourse page */
                            dataSource.pageIndex(dataSource.pageIndex() - 1);
                            fullInfo$ = from(dataSource.reload()).pipe(
                                switchMap(() => {
                                    const newItems = dataSource.items();
                                    const newItemId = newItems[newItems.length - 1][itemSearchProperty];
                                    /** Get data of the last item from the previous page */
                                    return this.getItemFullInfo(itemType, newItemId, TargetDirectionEnum.Current, itemSearchProperty);
                                })
                            );
                        } else {
                            fullInfo$ = this.getItemFullInfo(itemType, items[itemIndex - 1][itemSearchProperty], TargetDirectionEnum.Current, itemSearchProperty);
                        }
                    } else if (itemDirection === TargetDirectionEnum.Next) {
                        if (isLastOnPage) {
                            if (!dataSource['entities']) {
                                /** Update data sourse page */
                                dataSource.pageIndex(dataSource.pageIndex() + 1);
                            }
                            const method$ = this.itemsListSource[itemType].loadMethod
                                ? this.itemsListSource[itemType].loadMethod.call(itemData.stageId)
                                : from(dataSource.reload());
                            fullInfo$ = method$.pipe(
                                switchMap(() => {
                                    const newItemId = dataSource['entities']
                                        ? dataSource['entities'][dataSource['entities'].length - dataSource.pageSize()][itemSearchProperty]
                                        : dataSource.items()[0][itemSearchProperty];
                                    /** Get data of the first item from the next page */
                                    return this.getItemFullInfo(itemType, newItemId, TargetDirectionEnum.Current, itemSearchProperty);
                                })
                            );
                        } else {
                            fullInfo$ = this.getItemFullInfo(itemType, items[itemIndex + 1][itemSearchProperty], TargetDirectionEnum.Current, itemSearchProperty);
                        }
                    }
                }
            }
            return fullInfo$;
        }));
    }

    private getItemsCountOnLastPage(total, pageSize, pageIndex) {
        return total - pageSize * pageIndex;
    }
}
