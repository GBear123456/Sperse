import { FlatFeatureDto, NameValueDto } from '@shared/service-proxies/service-proxies';

export class FeatureValuesDto extends NameValueDto {
    defaultValue: any;

    constructor(data?: any) {
        super();
        if (data) {
            for (var property in data) {
                if (data.hasOwnProperty(property))
                    (<any>this)[property] = (<any>data)[property];
            }
        }
    }
}

export interface FeatureTreeEditModel {
    features: FlatFeatureDto[];
    featureValues: FeatureValuesDto[];
}