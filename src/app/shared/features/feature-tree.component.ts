<<<<<<< HEAD
/** Core imports */
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

/** Third party imports */
import filter from 'lodash/filter';

/** Application imports */
import { FeatureTreeEditModel } from '@app/shared/features/feature-tree-edit.model';
import { FlatFeatureDto, NameValueDto } from '@shared/service-proxies/service-proxies';
import { ArrayToTreeConverterService } from '@shared/utils/array-to-tree-converter.service';
import { TreeDataHelperService } from '@shared/utils/tree-data-helper.service';
import { ArrayHelper } from '@shared/helpers/ArrayHelper';

@Component({
    selector: 'feature-tree',
    templateUrl: './feature-tree.component.html',
    styleUrls: ['./feature-tree.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeatureTreeComponent {
    @Input() showResetToDefault: boolean = false;
    @Input() enableRestoreCustom: boolean = false;
    @Input() isReadOnly: boolean = false;
    @Input() set editData(val: FeatureTreeEditModel) {
        if (val) {
            if (!this._editData || ArrayHelper.dataChanged(val.features, this._editData.features) || ArrayHelper.dataChanged(val.featureValues, this._editData.featureValues)) {
                this._editData = val;
                this.setTreeData(val.features);
                this.setSelectedNodes(val);
            }
        }
    }

    private _editData: FeatureTreeEditModel;
    treeData: any;
    initialGrantedFeatures;

    constructor(
        private arrayToTreeConverterService: ArrayToTreeConverterService,
        private treeDataHelperService: TreeDataHelperService,
    ) {
        if (this.isReadOnly)
            this.showResetToDefault = false;
    }

    setTreeData(features: FlatFeatureDto[]) {
        this.treeData = this.arrayToTreeConverterService.createTree(
            features,
            'parentName',
            'name',
            null,
            'children',
            [
                { target: 'displayName', source: 'displayName' },
                { target: 'expanded', value: true }
            ]
        );
    }

    setSelectedNodes(val: FeatureTreeEditModel) {
        val.features.forEach((feature) => {
            let node = this.treeDataHelperService.findNode(this.treeData, { data: { name: feature.name } });
            let items = filter(val.featureValues, { name: feature.name });
            let value = '';
            if (items && items.length === 1) {
                let item = items[0];
                value = item.value;
                node.isCustom = item.isCustomValue;
                node.restoreValue = item.restoreValue || feature.defaultValue;
            } else {
                value = feature.defaultValue;
            }

            if (feature.inputType.name == 'SINGLE_LINE_STRING' && value == feature.defaultValue)
                value = '';

            node.value = feature.inputType.name == 'CHECKBOX' ? value == 'true' : value;
        });
        this.initialGrantedFeatures = this.getGrantedFeatures();
    }

    getGrantedFeatures(): NameValueDto[] {
        if (!this._editData.features) {
            return [];
        }

        let features: NameValueDto[] = [];
        for (let i = 0; i < this._editData.features.length; i++) {
            let feature = new NameValueDto();

            let featureData = this._editData.features[i];
            feature.name = featureData.name;
            feature.value = this.getFeatureValueByName(feature.name);
            features.push(feature);
        }

        return features;
    }

    onCheckboxInputChange(event, node) {
        if (event.event == null)
            return;

        this.onInputChange(node);
        if (node.value)
            this.nodeSelect(node);
        else
            this.setChildrenValue(node, false);
    }

    onInputChange(node) {
        if (this.enableRestoreCustom && node.value !== '' && node.value != node.restoreValue)
            node.isCustom = true;

        this.setFeatureValueByName(node.data.name, node.value);
    }

    findFeatureByName(featureName: string): FlatFeatureDto {
        const self = this;

        const feature = self._editData.features.find(f => f.name === featureName);

        if (!feature) {
            abp.log.warn('Could not find a feature by name: ' + featureName);
        }

        return feature;
    }

    validateInputValue(feature) {
        return event => {
            return this.isFeatureValueValid(feature.data.name, event.value);
        }
    }

    isFeatureValueValid(featureName: string, value: string): boolean {
        const self = this;
        const feature = self.findFeatureByName(featureName);
        if (!feature || !feature.inputType || !feature.inputType.validator) {
            return true;
        }

        const validator = (feature.inputType.validator as any);
        if (validator.name === 'STRING') {
            if (value === undefined || value === null) {
                return validator.attributes.AllowNull;
            }

            if (typeof value !== 'string') {
                return false;
            }

            if (validator.attributes.MinLength > 0 && value.length < validator.attributes.MinLength) {
                return false;
            }

            if (validator.attributes.MaxLength > 0 && value.length > validator.attributes.MaxLength) {
                return false;
            }

            if (validator.attributes.RegularExpression) {
                return (new RegExp(validator.attributes.RegularExpression)).test(value);
            }
        } else if (validator.name === 'NUMERIC' || validator.name === 'FLOAT') {
            if (value === undefined || value === null || value === '') {
                return true;
            }

            const numValue = parseFloat(value);
            if (isNaN(numValue)) {
                return false;
            }

            const minValue = validator.attributes.MinValue;
            if (minValue > numValue) {
                return false;
            }

            const maxValue = validator.attributes.MaxValue;
            if (maxValue > 0 && numValue > maxValue) {
                return false;
            }

            let regexStr = '^';
            if (minValue < 0) {
                regexStr += '-?';
            }
            regexStr += '\\d+';
            if (validator.name == 'FLOAT') {
                regexStr += `\\.?\\d{0,${validator.attributes.DecimalPlaces}}`;
            }
            regexStr += '$';
            return (new RegExp(regexStr)).test(value);
        }
        return true;
    }

    areAllValuesValid(): boolean {
        let result = true;

        this._editData.features.forEach((feature) => {
            let value = this.getFeatureValueByName(feature.name);
            if (!this.isFeatureValueValid(feature.name, value)) {
                result = false;
            }
        });

        return result;
    }

    setFeatureValueByName(featureName: string, value: string): void {
        const featureValue = this._editData.featureValues.find(f => f.name === featureName);
        if (!featureValue) {
            return;
        }

        featureValue.value = value == null ? value : value.toString();
    }

    getFeatureValueByName(featureName: string): string {
        let feature = this.treeDataHelperService.findNode(this.treeData, { data: { name: featureName } });
        if (!feature)
            return null;

        if (!feature.data.inputType || feature.data.inputType.name === 'CHECKBOX')
            return feature.value ? 'true' : 'false';

        if (feature.value !== '' && feature.value != null)
            return feature.value.toString();

        return feature.data.defaultValue;
    }

    nodeSelect(node) {
        var parentName = node.parent;
        while (parentName != null) {
            let parentNode = this.treeDataHelperService.findNode(this.treeData, { data: { name: node.parent } });
            if (!parentNode.value) {
                parentNode.value = true;
                this.setFeatureValueByName(parentNode.data.name, 'true');
            }
            parentName = parentNode.parent;
        }

        this.setChildrenValue(node, true);
    }

    setChildrenValue(node, value: boolean) {
        let childrenNodesNames = this.treeDataHelperService.findChildren(this.treeData, {
            data: { name: node.data.name },
        });

        childrenNodesNames.forEach(childName => {
            let childNode = this.treeDataHelperService.findNode(this.treeData, { data: { name: childName } });
            if (childNode.data.inputType.name === 'CHECKBOX') {
                childNode.value = value;
                this.setFeatureValueByName(childName, value.toString());
            }
        });
    }

    resetToDefault(node) {
        node.value = '';
        this.setFeatureValueByName(node.data.name, node.data.defaultValue);
    }

    restoreValue(node) {
        node.isCustom = false;
        node.value = node.restoreValue == node.data.defaultValue ? '' : node.restoreValue;
        this.setFeatureValueByName(node.data.name, node.restoreValue);
    }
}
=======
/** Core imports */
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

/** Third party imports */
import filter from 'lodash/filter';

/** Application imports */
import { FeatureTreeEditModel } from '@app/shared/features/feature-tree-edit.model';
import { FlatFeatureDto, NameValueDto } from '@shared/service-proxies/service-proxies';
import { ArrayToTreeConverterService } from '@shared/utils/array-to-tree-converter.service';
import { TreeDataHelperService } from '@shared/utils/tree-data-helper.service';
import { ArrayHelper } from '@shared/helpers/ArrayHelper';

@Component({
    selector: 'feature-tree',
    templateUrl: './feature-tree.component.html',
    styleUrls: ['./feature-tree.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeatureTreeComponent {
    @Input() showResetToDefault: boolean = false;
    @Input() enableRestoreCustom: boolean = false;
    @Input() isReadOnly: boolean = false;
    @Input() set editData(val: FeatureTreeEditModel) {
        if (val) {
            if (!this._editData || ArrayHelper.dataChanged(val.features, this._editData.features) || ArrayHelper.dataChanged(val.featureValues, this._editData.featureValues)) {
                this._editData = val;
                this.setTreeData(val.features);
                this.setSelectedNodes(val);
            }
        }
    }

    private _editData: FeatureTreeEditModel;
    treeData: any;
    initialGrantedFeatures;

    constructor(
        private arrayToTreeConverterService: ArrayToTreeConverterService,
        private treeDataHelperService: TreeDataHelperService,
    ) {
        if (this.isReadOnly)
            this.showResetToDefault = false;
    }

    setTreeData(features: FlatFeatureDto[]) {
        this.treeData = this.arrayToTreeConverterService.createTree(
            features,
            'parentName',
            'name',
            null,
            'children',
            [
                { target: 'displayName', source: 'displayName' },
                { target: 'expanded', value: true }
            ]
        );
    }

    setSelectedNodes(val: FeatureTreeEditModel) {
        val.features.forEach((feature) => {
            let node = this.treeDataHelperService.findNode(this.treeData, { data: { name: feature.name } });
            let items = filter(val.featureValues, { name: feature.name });
            let value = '';
            if (items && items.length === 1) {
                let item = items[0];
                value = item.value;
                node.isCustom = item.isCustomValue;
                node.restoreValue = item.restoreValue || feature.defaultValue;
            } else {
                value = feature.defaultValue;
            }

            if (feature.inputType.name == 'SINGLE_LINE_STRING' && value == feature.defaultValue)
                value = '';

            node.value = feature.inputType.name == 'CHECKBOX' ? value == 'true' : value;
        });
        this.initialGrantedFeatures = this.getGrantedFeatures();
    }

    getGrantedFeatures(): NameValueDto[] {
        if (!this._editData.features) {
            return [];
        }

        let features: NameValueDto[] = [];
        for (let i = 0; i < this._editData.features.length; i++) {
            let feature = new NameValueDto();

            let featureData = this._editData.features[i];
            feature.name = featureData.name;
            feature.value = this.getFeatureValueByName(feature.name);
            features.push(feature);
        }

        return features;
    }

    onCheckboxInputChange(event, node) {
        if (event.event == null)
            return;

        this.onInputChange(node);
        if (node.value)
            this.nodeSelect(node);
        else
            this.setChildrenValue(node, false);
    }

    onInputChange(node) {
        if (this.enableRestoreCustom && node.value !== '' && node.value != node.restoreValue)
            node.isCustom = true;

        this.setFeatureValueByName(node.data.name, node.value);
    }

    findFeatureByName(featureName: string): FlatFeatureDto {
        const self = this;

        const feature = self._editData.features.find(f => f.name === featureName);

        if (!feature) {
            abp.log.warn('Could not find a feature by name: ' + featureName);
        }

        return feature;
    }

    validateInputValue(feature) {
        return event => {
            return this.isFeatureValueValid(feature.data.name, event.value);
        }
    }

    isFeatureValueValid(featureName: string, value: string): boolean {
        const self = this;
        const feature = self.findFeatureByName(featureName);
        if (!feature || !feature.inputType || !feature.inputType.validator) {
            return true;
        }

        const validator = (feature.inputType.validator as any);
        if (validator.name === 'STRING') {
            if (value === undefined || value === null) {
                return validator.attributes.AllowNull;
            }

            if (typeof value !== 'string') {
                return false;
            }

            if (validator.attributes.MinLength > 0 && value.length < validator.attributes.MinLength) {
                return false;
            }

            if (validator.attributes.MaxLength > 0 && value.length > validator.attributes.MaxLength) {
                return false;
            }

            if (validator.attributes.RegularExpression) {
                return (new RegExp(validator.attributes.RegularExpression)).test(value);
            }
        } else if (validator.name === 'NUMERIC' || validator.name === 'FLOAT') {
            if (value === undefined || value === null || value === '') {
                return true;
            }

            const numValue = parseFloat(value);
            if (isNaN(numValue)) {
                return false;
            }

            const minValue = validator.attributes.MinValue;
            if (minValue > numValue) {
                return false;
            }

            const maxValue = validator.attributes.MaxValue;
            if (maxValue > 0 && numValue > maxValue) {
                return false;
            }

            let regexStr = '^';
            if (minValue < 0) {
                regexStr += '-?';
            }
            regexStr += '\\d+';
            if (validator.name == 'FLOAT') {
                regexStr += `\\.?\\d{0,${validator.attributes.DecimalPlaces}}`;
            }
            regexStr += '$';
            return (new RegExp(regexStr)).test(value);
        }
        return true;
    }

    areAllValuesValid(): boolean {
        let result = true;

        this._editData.features.forEach((feature) => {
            let value = this.getFeatureValueByName(feature.name);
            if (!this.isFeatureValueValid(feature.name, value)) {
                result = false;
            }
        });

        return result;
    }

    setFeatureValueByName(featureName: string, value: string): void {
        const featureValue = this._editData.featureValues.find(f => f.name === featureName);
        if (!featureValue) {
            return;
        }

        featureValue.value = value == null ? value : value.toString();
    }

    getFeatureValueByName(featureName: string): string {
        let feature = this.treeDataHelperService.findNode(this.treeData, { data: { name: featureName } });
        if (!feature)
            return null;

        if (!feature.data.inputType || feature.data.inputType.name === 'CHECKBOX')
            return feature.value ? 'true' : 'false';

        if (feature.value !== '' && feature.value != null)
            return feature.value.toString();

        return feature.data.defaultValue;
    }

    nodeSelect(node) {
        var parentName = node.parent;
        while (parentName != null) {
            let parentNode = this.treeDataHelperService.findNode(this.treeData, { data: { name: node.parent } });
            if (!parentNode.value) {
                parentNode.value = true;
                this.setFeatureValueByName(parentNode.data.name, 'true');
            }
            parentName = parentNode.parent;
        }

        this.setChildrenValue(node, true);
    }

    setChildrenValue(node, value: boolean) {
        let childrenNodesNames = this.treeDataHelperService.findChildren(this.treeData, {
            data: { name: node.data.name },
        });

        childrenNodesNames.forEach(childName => {
            let childNode = this.treeDataHelperService.findNode(this.treeData, { data: { name: childName } });
            if (childNode.data.inputType.name === 'CHECKBOX') {
                childNode.value = value;
                this.setFeatureValueByName(childName, value.toString());
            }
        });
    }

    resetToDefault(node) {
        node.value = '';
        this.setFeatureValueByName(node.data.name, node.data.defaultValue);
    }

    restoreValue(node) {
        node.isCustom = false;
        node.value = node.restoreValue == node.data.defaultValue ? '' : node.restoreValue;
        this.setFeatureValueByName(node.data.name, node.restoreValue);
    }
}
>>>>>>> f999b481882149d107812286d0979872df712626
