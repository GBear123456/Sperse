/** Core imports */
import { ChangeDetectionStrategy, AfterViewInit, Component, ElementRef, Input } from '@angular/core';

/** Third party imports */
import some from 'lodash/some';
import each from 'lodash/each';

/** Application imports */
import { FeatureTreeEditModel } from '@app/shared/features/feature-tree-edit.model';
import { FlatFeatureDto, NameValueDto } from '@shared/service-proxies/service-proxies';

@Component({
    selector: 'feature-tree',
    template: `<div class="feature-tree"></div>`,
    styleUrls: ['./feature-tree.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeatureTreeComponent implements AfterViewInit {
    @Input() showResetToDefault: boolean = false;
    @Input() set editData(val: FeatureTreeEditModel) {
        if (val) {
            this._editData = val;
            this.refreshTree();
        }
    }
    @Input() isReadOnly: boolean = false;

    private _editData: FeatureTreeEditModel;
    private $tree: JQuery;
    private createdTreeBefore;
    initialGrantedFeatures;

    constructor(private element: ElementRef) {
        if (this.isReadOnly)
            this.showResetToDefault = false;
    }

    ngAfterViewInit(): void {
        this.$tree = $(this.element.nativeElement);
        this.refreshTree();
    }

    getGrantedFeatures(): NameValueDto[] {
        if (!this.$tree || !this.createdTreeBefore) {
            return [];
        }

        const selectedFeatures = this.$tree.jstree('get_selected', true);

        return this._editData.features.map(item => {
            const feature = new NameValueDto();

            feature.name = item.name;

            if (!item.inputType || item.inputType.name === 'CHECKBOX') {
                feature.value = some(selectedFeatures, { original: { id: item.name } }) ? 'true' : 'false';
            } else {
                feature.value = this.getFeatureValueByName(item.name);
            }

            return feature;
        });
    }

    refreshTree(): void {
        const self = this;

        if (this.createdTreeBefore) {
            this.$tree.jstree('destroy');
        }

        this.createdTreeBefore = false;
        if (!this._editData || !this.$tree) {
            return;
        }

        const treeData = this._editData.features.map(item => ({
            id: item.name,
            parent: item.parentName ? item.parentName : '#',
            text: item.displayName,
            state: {
                opened: true,
                selected: some(this._editData.featureValues, { name: item.name, value: 'true' })
            }
        }));
        this.$tree
            .on('ready.jstree', () => {
                this.customizeTreeNodes();
                this.initialGrantedFeatures = this.getGrantedFeatures();
            })
            .on('redraw.jstree', () => {
                this.customizeTreeNodes();
            })
            .on('after_open.jstree', () => {
                this.customizeTreeNodes();
            })
            .on('create_node.jstree', () => {
                this.customizeTreeNodes();
            })
            .on('changed.jstree', (e, data) => {
                if (!data.node) {
                    return;
                }

                const wasInTreeChangeEvent = inTreeChangeEvent;
                if (!wasInTreeChangeEvent) {
                    inTreeChangeEvent = true;
                }

                let childrenNodes;

                if (data.node.state.selected) {
                    selectNodeAndAllParents(this.$tree.jstree('get_parent', data.node));

                    childrenNodes = $.makeArray(this.$tree.jstree('get_node', data.node).children);
                    this.$tree.jstree('select_node', childrenNodes);

                } else {
                    childrenNodes = $.makeArray(this.$tree.jstree('get_node', data.node).children);
                    this.$tree.jstree('deselect_node', childrenNodes);
                }

                if (!wasInTreeChangeEvent) {
                    const $nodeLi = this.getNodeLiByFeatureName(data.node.id);
                    const feature = this.findFeatureByName(data.node.id);
                    if (feature && (!feature.inputType || feature.inputType.name === 'CHECKBOX')) {
                        const value = this.$tree.jstree('is_checked', $nodeLi) ? 'true' : 'false';
                        this.setFeatureValueByName(data.node.id, value);
                    }

                    inTreeChangeEvent = false;
                }
            })
            .jstree({
                'core': {
                    data: treeData
                },
                'types': {
                    'default': {
                        'icon': 'fa fa-folder m--font-warning'
                    },
                    'file': {
                        'icon': 'fa fa-file m--font-warning'
                    }
                },
                'checkbox': {
                    keep_selected_style: false,
                    three_state: false,
                    cascade: ''
                },
                plugins: ['checkbox', 'types']
            });

        this.createdTreeBefore = true;

        let inTreeChangeEvent = false;

        function selectNodeAndAllParents(node) {
            self.$tree.jstree('select_node', node, true);
            const parent = self.$tree.jstree('get_parent', node);
            if (parent) {
                selectNodeAndAllParents(parent);
            }
        }

        this.$tree.on('changed.jstree', (e, data) => {
            if (!data.node) {
                return;
            }

            const wasInTreeChangeEvent = inTreeChangeEvent;
            if (!wasInTreeChangeEvent) {
                inTreeChangeEvent = true;
            }

            let childrenNodes;

            if (data.node.state.selected) {
                selectNodeAndAllParents(this.$tree.jstree('get_parent', data.node));

                childrenNodes = $.makeArray(this.$tree.jstree('get_node', data.node).children);
                this.$tree.jstree('select_node', childrenNodes);

            } else {
                childrenNodes = $.makeArray(this.$tree.jstree('get_node', data.node).children);
                this.$tree.jstree('deselect_node', childrenNodes);
            }

            if (!wasInTreeChangeEvent) {
                inTreeChangeEvent = false;
            }
        });
    }

    customizeTreeNodes(): void {
        const self = this;
        self.$tree.find('.jstree-node').each(function () {
            const $nodeLi = $(this);
            const $nodeA = $nodeLi.find('.jstree-anchor');

            const featureName = $nodeLi.attr('id');
            const feature = self.findFeatureByName(featureName);
            const featureDefaultValue = feature.defaultValue || '';
            let featureValue = self.findFeatureValueByName(featureName) || '';
            if (featureValue == featureDefaultValue)
                featureValue = '';

            if (!feature || !feature.inputType) {
                return;
            }

            if (feature.inputType.name === 'CHECKBOX') {
                //no change for checkbox
            } else if (feature.inputType.name === 'SINGLE_LINE_STRING') {
                if (!$nodeLi.find('.feature-tree-textbox').length) {
                    $nodeA.find('.jstree-checkbox').hide();

                    let inputType = 'text';
                    let inputDecimalPlaces = 0;
                    const validator = (feature.inputType.validator as any);
                    if (feature.inputType.validator) {
                        if (feature.inputType.validator.name === 'NUMERIC' || feature.inputType.validator.name === 'FLOAT') {
                            inputType = 'number';
                            if (feature.inputType.validator.name === 'FLOAT')
                                inputDecimalPlaces = feature.inputType.validator.attributes['DecimalPlaces'];
                        }
                    }

                    const $textbox = $(
                        '<input class="feature-tree-textbox" type="' + inputType +
                        '" placeholder="' + featureDefaultValue + '"' +
                        (self.showResetToDefault ? ' required' : '') + '/>'
                    ).val(featureValue);
                    if (self.isReadOnly)
                        $textbox.attr('disabled', 'disabled');

                    if (inputType === 'number') {
                        $textbox.attr('min', validator.minValue || validator.attributes['MinValue']);
                        $textbox.attr('max', validator.maxValue || validator.attributes['MaxValue']);

                        if (inputDecimalPlaces === 0) {
                            $textbox.attr('step', '1');
                        } else
                            if (inputDecimalPlaces) {
                                let step = '.';
                                let k = 1;
                                while (k < inputDecimalPlaces) {
                                    step += '0';
                                    k++;
                                }
                                step += '1';
                                $textbox.attr('step', step);
                            }
                    } else {
                        if (feature.inputType.validator && feature.inputType.validator.name === 'STRING') {
                            if (validator.maxLength > 0) {
                                $textbox.attr('maxlength', validator.maxLength || validator.attributes['MaxLength']);
                            }
                            if (validator.minLength > 0) {
                                $textbox.attr('required', 'required');
                            }
                            if (validator.regularExpression) {
                                $textbox.attr('pattern', validator.regularExpression || validator.attributes['RegularExpression']);
                            }
                        }
                    }

                    $textbox.on('input propertychange paste', () => {
                        const value = $textbox.val() as string;

                        if (self.isFeatureValueValid(featureName, value)) {
                            self.setFeatureValueByName(featureName, value);
                            $textbox.removeClass('feature-tree-textbox-invalid');
                        } else {
                            if (value) {
                                $textbox.val(self.getFeatureValueByName(featureName));
                            }
                            else {
                                $textbox.addClass('feature-tree-textbox-invalid');
                            }
                        }
                    });

                    if (self.showResetToDefault) {
                        let $form = $('<form></form>'),
                            $reset = $('<button type="reset">');
                        $textbox.appendTo($form);
                        $reset.appendTo($form);
                        $form.appendTo($nodeLi);
                        $form.on('reset', () => {
                            self.setFeatureValueByName(featureName, featureDefaultValue);
                        });
                    } else
                        $textbox.appendTo($nodeLi);
                }
            } else if (feature.inputType.name === 'COMBOBOX') {
                if (!$nodeLi.find('.feature-tree-combobox').length) {
                    $nodeA.find('.jstree-checkbox').hide();

                    const $combobox = $('<select class="feature-tree-combobox" />');
                    const inputType = (feature.inputType as any);
                    each(inputType.itemSource.items, (opt: any) => {
                        $('<option></option>')
                            .attr('value', opt.value)
                            .text(opt.displayText)
                            .appendTo($combobox);
                    });
                    if (self.isReadOnly)
                        $combobox.attr('disabled', 'disabled');
                    $combobox
                        .val(featureValue)
                        .on('change', () => {
                            const value = $combobox.val() as string;
                            self.setFeatureValueByName(featureName, value);
                        })
                        .appendTo($nodeLi);
                }
            }

            if (self.isReadOnly) {
                self.$tree.jstree().disable_node($(this));
            }
        });
    }

    getNodeLiByFeatureName(featureName: string): JQuery {
        return $('#' + featureName.replace('.', '\\.'));
    }

    selectNodeAndAllParents(node: any): void {
        const self = this;
        self.$tree.jstree('select_node', node, true);
        const parent = self.$tree.jstree('get_parent', node);
        if (parent) {
            self.selectNodeAndAllParents(parent);
        }
    }

    findFeatureByName(featureName: string): FlatFeatureDto {
        const self = this;

        const feature = self._editData.features.find(f => f.name === featureName);

        if (!feature) {
            abp.log.warn('Could not find a feature by name: ' + featureName);
        }

        return feature;
    }

    findFeatureValueByName(featureName: string) {
        const self = this;
        const feature = self.findFeatureByName(featureName);
        if (!feature) {
            return '';
        }

        const featureValue = self._editData.featureValues.find(f => f.name === featureName);
        if (!featureValue) {
            return feature.defaultValue;
        }

        return featureValue.value;
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
                return validator.allowNull;
            }

            if (typeof value !== 'string') {
                return false;
            }

            if (validator.minLength > 0 && value.length < validator.minLength) {
                return false;
            }

            if (validator.maxLength > 0 && value.length > validator.maxLength) {
                return false;
            }

            if (validator.regularExpression) {
                return (new RegExp(validator.regularExpression)).test(value);
            }
        } else if (validator.name === 'NUMERIC' || validator.name === 'FLOAT') {
            if (feature.inputType.validator.attributes.AllowNulls && (value === undefined || value === null || value == '')) {
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
        const self = this;
        self.$tree.find('.jstree-node').each(function () {
            const $nodeLi = $(this);
            const featureName = $nodeLi.attr('id');
            const feature = self.findFeatureByName(featureName);

            if (feature && (!feature.inputType || feature.inputType.name === 'CHECKBOX')) {
                const value = self.$tree.jstree('is_checked', $nodeLi) ? 'true' : 'false';
                self.setFeatureValueByName(featureName, value);
            }
        });

        return self.$tree.find('.feature-tree-textbox-invalid').length <= 0;
    }

    setFeatureValueByName(featureName: string, value: string): void {
        const featureValue = this._editData.featureValues.find(f => f.name === featureName);
        if (!featureValue) {
            return;
        }

        featureValue.value = value;
    }

    getFeatureValueByName(featureName: string): string {
        const featureValue = this._editData.featureValues.find(f => f.name === featureName);
        if (!featureValue) {
            return null;
        }

        return featureValue.value;
    }

}
