import { FilterModel } from '@shared/filters/models/filter.model';
import { FilterItemModel, DisplayElement } from '@shared/filters/models/filter-item.model';
import { ContactStatus } from '@shared/AppEnums';

export class FilterContactStatusModel extends FilterItemModel {
    includeActive: boolean = true;
    includeInActive: boolean = false;
    includeProspective: number = 0;

    activeSubFilter = [{
        text: this.ls.l('IncludeProspective'),
        value: 0
    }, {
        text: this.ls.l('ExcludeProspective'),
        value: 1
    }, {
        text: this.ls.l('ProspectiveOnly'),
        value: 2
    }];

    get value(): ContactStatus[] {
        if (this.includeActive != this.includeInActive)
            return [this.includeActive ? ContactStatus.Active : ContactStatus.Inactive];
    }

    set value(value: ContactStatus[]) {
        let status = value && value[0];
        if (status) {
            this.includeActive = status == ContactStatus.Active;
            this.includeInActive = status == ContactStatus.Inactive;
        } else {
            this.includeActive = false;
            this.includeInActive = false;
        }
    }

    public constructor(init?: Partial<FilterContactStatusModel>) {
        super(init, true);
    }

    getDisplayElements(): DisplayElement[] {
        let result: DisplayElement[] = [];

        if (this.includeActive)    
            result.push(<DisplayElement>{ 
                item: this, 
                args: this.includeActive,
                displayValue: this.ls.l('Active') + 
                    ' (' + this.activeSubFilter[this.includeProspective].text + ')' 
            });

        if (this.includeInActive)
            result.push(<DisplayElement>{ 
                item: this, 
                args: this.includeActive, 
                displayValue: this.ls.l('Inactive')
            });

        return result;
    }

    removeFilterItem(filter: FilterModel, args: any) {
        if (args != undefined) {
            if (args) 
                this.includeActive = false;
            else
                this.includeInActive = false;
        } else {
            this.includeActive = true;
            this.includeInActive = false;
            this.includeProspective = 0;
        }
    }

    applyRequestParams(request) {
        if (request) {
            if (this.includeActive != this.includeInActive)            
                request.params.isActive = this.includeActive;

            if (this.includeProspective)
                request.params.isProspective = this.includeProspective > 1;
        }
    }
}