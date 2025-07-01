import { FlatFeatureDto, NameValueDto } from '@shared/service-proxies/service-proxies';

export class FeatureTreeEditModel {
    features: FlatFeatureTreeDto[];
    featureValues: FeatureValuesDto[];
}

export class FlatFeatureTreeDto extends FlatFeatureDto {
    hidden?: boolean;
}

export class FeatureValuesDto extends NameValueDto {
    isCustomValue?: boolean;
    restoreValue: string;
}