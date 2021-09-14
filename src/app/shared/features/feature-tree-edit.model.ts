import { FlatFeatureDto, NameValueDto } from '@shared/service-proxies/service-proxies';

export class FeatureValuesDto extends NameValueDto {}

export interface FeatureTreeEditModel {
    features: FlatFeatureDto[];
    featureValues: FeatureValuesDto[];
}