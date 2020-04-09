import { FilterModel } from '@shared/filters/models/filter.model';
import { FilterItemModel, DisplayElement } from '@shared/filters/models/filter-item.model';
import { SourceContact } from '@shared/common/source-contact-list/source-contact.interface';

export class SourceFilterModel extends FilterItemModel {
    keyExpr: any;
    nameField: string;
    organizationUnitId: number;
    contact: SourceContact;
    affiliateCode: string;
    campaignCode: string;
    channelCode: string;

    public constructor(init?: Partial<SourceFilterModel>) {
        super(init, true);
    }

    get value() {
        return [
            {
                property: 'campaignCode',
                label: this.ls.l('CampaignCode'),
                name: 'SourceCampaignCode',
                value: this.campaignCode
            },
            {
                property: 'affiliateCode',
                label: this.ls.l('AffiliateCode'),
                name: 'SourceAffiliateCode',
                value: this.affiliateCode
            },
            {
                property: 'contact',
                label: this.ls.l('Contact'),
                name: 'SourceContactId',
                value: this.contact && this.contact.id,
                displayValue: this.contact && this.contact.name
            },
            {
                property: 'channelCode',
                label: this.ls.l('Channel'),
                name: 'SourceChannelCode',
                value: this.channelCode
            }
        ];
    }

    getDisplayElements(): DisplayElement[] {
        let result: DisplayElement[] = [];
        this.value.forEach((item) => {
            if (item.value) {
                result.push(
                    <DisplayElement>{
                        id: item.name,
                        item: this,
                        displayValue: item.label + ': ' + (item.displayValue || item.value)
                    }
                );
            }
        });
        return result;
    }

    removeFilterItem(filter: FilterModel, args: any, name: string) {
        if (name) {
            let item = filter.items.element.value.find((item) => item.name === name);
            item.value = item.displayValue = this[item.property] = null;
        }
    }
}