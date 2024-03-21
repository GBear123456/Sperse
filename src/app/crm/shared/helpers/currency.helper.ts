/** Third party imports */

import { FilterInputsComponent } from "@shared/filters/inputs/filter-inputs.component";
import { FilterItemModel } from "@shared/filters/models/filter-item.model";
import { FilterModel } from "@shared/filters/models/filter.model";

/** Application imports */

export class CurrencyHelper {
    static getCurrencyFilter(initialCurrency): FilterModel {
        let itemModel = new FilterItemModel(initialCurrency);
        itemModel.isClearAllowed = false;
        return new FilterModel({
            component: FilterInputsComponent,
            caption: 'Currency',
            hidden: true,
            items: {
                CurrencyId: itemModel
            }
        });
    }
}
