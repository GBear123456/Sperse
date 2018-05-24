import { CategorizationPrefixes } from '../enums/categorization-prefixes.enum';
export class CategorizationModel {
    prefix: CategorizationPrefixes;
    statsKeyName: string;
    namesSource?: string;
    childNamesSource?: string;
    childReferenceProperty?: string;
}
