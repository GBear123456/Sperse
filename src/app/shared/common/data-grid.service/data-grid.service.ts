/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import DevExpress from 'devextreme';
import dxDataGridColumn = DevExpress.ui.dxDataGridColumn;

/** Application imports */
import { OrganizationUnitDto } from '@shared/service-proxies/service-proxies';
import { FieldDependencies } from '@app/shared/common/data-grid.service/field-dependencies.interface';

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

    static hideColumnChooser(grid) {
        grid.instance.hideColumnChooser();
    }

    static toggleCompactRowsHeight(dataGrid, updateDimensions = false) {
        dataGrid.instance.element().classList.toggle('grid-compact-view');
        if (updateDimensions) {
            dataGrid.instance.updateDimensions();
        }
    }

    static isCompactView(dataGrid) {
        return dataGrid.instance.element().classList.contains('grid-compact-view');
    }

    static getGridOption(dataGrid, option: string) {
        return dataGrid && dataGrid.instance && dataGrid.instance.option(option);
    }

    static getDataGridRowsViewHeight(dataGridInstance?) {
        return (dataGridInstance ? 
            dataGridInstance.element().getElementsByClassName('dx-datagrid-rowsview')[0] :
            document.querySelector('.dx-datagrid-rowsview') 
        ).clientHeight;
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

    static getSelectFields(
        dataGrid,
        requiredFields?: string[],
        fieldsDependencies?: FieldDependencies
    ): string[] {
        let selectFields = requiredFields || [];
        const visibleColumns = dataGrid.instance.getVisibleColumns();
        visibleColumns.forEach((column: dxDataGridColumn) => {
            if (column.dataField && (!requiredFields || requiredFields.indexOf(column.dataField) < 0)
                && column.dataField.indexOf('.') < 0) {
                selectFields.push(column.dataField);
            }
        });
        visibleColumns.forEach((column: dxDataGridColumn) => {
            if (fieldsDependencies && column.name && fieldsDependencies[column.name]) {
                fieldsDependencies[column.name].forEach((columnName: string) => {
                    if (selectFields.indexOf(columnName) < 0) {
                        selectFields.push(columnName);
                    }
                });
            }
        });
        return selectFields;
    }

    /** Reload grid if visible columns has changed */
    static refreshIfColumnsVisibilityStatusChange(event) {
        if (event.name === 'columns' && event.fullName.indexOf('visible') >= 0 && event.previousValue === false && event.value === true)
            event.component.refresh();
    }

}
