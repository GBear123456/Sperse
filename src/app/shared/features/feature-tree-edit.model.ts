import { FlatFeatureDto, NameValueDto } from '@shared/service-proxies/service-proxies';

export class FeatureValuesDto extends NameValueDto {
    isCustomValue?: boolean;
    restoreValue: string;
}

export class FeatureTreeEditModel {
    features: FlatFeatureDto[];
    featureValues: FeatureValuesDto[];
}