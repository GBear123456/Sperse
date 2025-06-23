<<<<<<< HEAD
import { FlatFeatureDto, NameValueDto } from '@shared/service-proxies/service-proxies';

export class FeatureValuesDto extends NameValueDto {
    isCustomValue?: boolean;
    restoreValue: string;
}

export class FeatureTreeEditModel {
    features: FlatFeatureDto[];
    featureValues: FeatureValuesDto[];
=======
import { FlatFeatureDto, NameValueDto } from '@shared/service-proxies/service-proxies';

export class FeatureValuesDto extends NameValueDto {
    isCustomValue?: boolean;
    restoreValue: string;
}

export class FeatureTreeEditModel {
    features: FlatFeatureDto[];
    featureValues: FeatureValuesDto[];
>>>>>>> f999b481882149d107812286d0979872df712626
}