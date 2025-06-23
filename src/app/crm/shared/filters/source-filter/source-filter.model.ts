import { FilterModel } from '@shared/filters/models/filter.model';
import { FilterItemModel, DisplayElement } from '@shared/filters/models/filter-item.model';
import { SourceContact } from '@shared/common/source-contact-list/source-contact.interface';

export class SourceFilterModelBase extends FilterItemModel {
    contactFieldExpr = 'SourceContactId';

    public getDisplayElements(): DisplayElement[] {
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

    public clearItem(item) {
        item.value = item.displayValue = this[item.property] = null;
    }

    public removeFilterItem(filter: FilterModel, args: any, name: string) {
        if (name) {
            let item = filter.items.element.value.find((item) => item.name === name);
            this.clearItem(item);
        } else {
            filter.items.element.value.forEach((item) => {
                this.clearItem(item);
            });
        }
    }
}

export class SourceContactFilterModel extends SourceFilterModelBase {
    contact: SourceContact;

    constructor(init?: Partial<SourceContactFilterModel>) {
        super(init, true);
        if (init && init.contactFieldExpr)
            this.contactFieldExpr = init.contactFieldExpr;
    }

    get value() {
        return [
            {
                property: 'contact',
                label: this.ls.l('SourceContact'),
                name: this.contactFieldExpr,
                value: this.contact && this.contact.id,
                displayValue: this.contact && this.contact.name
            }
        ];
    }
}

export class SourceFilterModel extends SourceFilterModelBase {
    keyExpr: any;
    nameField: string;
    contact: SourceContact;
    organizationUnitId: number;
    affiliateCode: string;
    campaignCode: string;
    channelCode: string;
    refererUrl: string;
    entryUrl: string;

    constructor(init?: Partial<SourceFilterModel>) {
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
                label: this.ls.l('SourceAffiliateCode'),
                name: 'SourceAffiliateCode',
                value: this.affiliateCode
            },
            {
                property: 'contact',
                label: this.ls.l('SourceContact'),
                name: 'SourceContactId',
                value: this.contact && this.contact.id,
                displayValue: this.contact && this.contact.name
            },
            {
                property: 'channelCode',
                label: this.ls.l('Channel'),
                name: 'SourceChannelCode',
                value: this.channelCode
            },
            {
                property: 'refererUrl',
                label: this.ls.l('RefererUrl'),
                operator: 'contains',
                name: 'SourceRefererUrl',
                value: this.refererUrl
            },
            {
                property: 'entryUrl',
                label: this.ls.l('EntryUrl'),
                operator: 'contains',
                name: 'SourceEntryUrl',
                value: this.entryUrl
            }
        ];
    }
}