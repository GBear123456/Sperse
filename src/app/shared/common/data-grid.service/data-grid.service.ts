import { Injectable } from '@angular/core';
import { OrganizationUnitDto } from '@shared/service-proxies/service-proxies';

@Injectable()
export class DataGridService {
    static defaultGridPagerConfig = {
        showPageSizeSelector: true,
        allowedPageSizes: [10, 20, 50, 100],
        showInfo: true,
        visible: true
    };

    static enableFilteringRow(dataGrid, event) {
        let visible = !dataGrid.instance.option('filterRow.visible');
        dataGrid.instance.option('filterRow.visible', visible);
        event.element.setAttribute('button-pressed', visible);
    }

    static showCompactRowsHeight(dataGrid, updateDimensions = false) {
        dataGrid.instance.element().classList.toggle('grid-compact-view');
        if (updateDimensions) {
            dataGrid.instance.updateDimensions();
        }
    }

    static showColumnChooser(grid) {
        grid.instance.showColumnChooser();
    }

    static toggleCompactRowsHeight(dataGrid, updateDimensions = false) {
        dataGrid.instance.element().classList.toggle('grid-compact-view');
        if (updateDimensions) {
            dataGrid.instance.updateDimensions();
        }
    }

    static getGridOption(dataGrid, option: string) {
        return dataGrid && dataGrid.instance && dataGrid.instance.option(option);
    }

    static getOrganizationUnitName(organizationUnitId: number, organizationUnits: OrganizationUnitDto[]): string {
        let organizationUnitName = '';
        if (organizationUnits && organizationUnits.length) {
            const organizationUnit = organizationUnits.find((organizationUnit: OrganizationUnitDto) => {
                return organizationUnit.id === organizationUnitId;
            });
            if (organizationUnit) {
                organizationUnitName = organizationUnit.displayName;
            }
        }
        return organizationUnitName;
    }

}
