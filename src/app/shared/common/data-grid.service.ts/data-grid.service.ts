import { Injectable } from '@angular/core';

@Injectable()
export class DataGridService {

    static enableFilteringRow(dataGrid, event) {
        let visible = !dataGrid.instance.option('filterRow.visible');
        dataGrid.instance.option('filterRow.visible', visible);
        event.element.setAttribute('button-pressed', visible);
    }

    static toggleCompactRowsHeight(dataGrid, updateDimensions = false) {
        dataGrid.instance.element().classList.toggle('grid-compact-view');
        if (updateDimensions) {
            dataGrid.instance.updateDimensions();
        }
    }

    static showColumnChooser(grid) {
        grid.instance.showColumnChooser();
    }

    static getGridOption(dataGrid, option: string) {
        return dataGrid && dataGrid.instance && dataGrid.instance.option(option);
    }

}
