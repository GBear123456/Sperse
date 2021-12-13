/** Core imports */
import { Component, Injector, Input, Output, EventEmitter, ViewChild, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { Store, select } from '@ngrx/store';
import { MatHorizontalStepper } from '@angular/material/stepper';
import { Papa } from 'ngx-papaparse';
import { NgxFileDropEntry } from 'ngx-file-drop';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { DxProgressBarComponent } from 'devextreme-angular/ui/progress-bar';
import { Observable } from 'rxjs';
import { first, filter } from 'rxjs/operators';
import * as _ from 'underscore';
import capitalize from 'underscore.string/capitalize';

/** Application imports */
import { PhoneFormatPipe } from '@shared/common/pipes/phone-format/phone-format.pipe';
import { CountriesStoreActions, CountriesStoreSelectors, RootStore } from '@root/store';
import { AppComponentBase } from '@shared/common/app-component-base';
import { ConfirmImportDialog } from './confirm-import-dialog/confirm-import-dialog.component';
import { AppConsts } from '@shared/AppConsts';
import { PhoneNumberService } from '@shared/common/phone-numbers/phone-number.service';
import { RecurringPaymentFrequency, ImportServiceProxy, 
    ImportFieldInfoDto, CountryDto } from '@shared/service-proxies/service-proxies';
import { StringHelper } from '@root/shared/helpers/StringHelper';
import { ToolbarGroupModel } from '@app/shared/common/toolbar/toolbar.model';
import { LeftMenuService } from '@app/cfo/shared/common/left-menu/left-menu.service';
import { PapaParseResult } from '@node_modules/ngx-papaparse/lib/interfaces/papa-parse-result';

@Component({
    selector: 'import-wizard',
    templateUrl: 'import-wizard.component.html',
    styleUrls: ['import-wizard.component.less'],
    providers: [ PhoneNumberService, PhoneFormatPipe ]
})
export class ImportWizardComponent extends AppComponentBase implements AfterViewInit {

    public static readonly FieldSeparator = '_';
    public static readonly NameSeparator = ' > ';
    public static readonly FieldLocalizationPrefix = 'Import';

    @ViewChild(MatHorizontalStepper) stepper: MatHorizontalStepper;
    @ViewChild('mapGrid') mapGrid: DxDataGridComponent;
    @ViewChild('reviewGrid') reviewGrid: DxDataGridComponent;
    @ViewChild(DxProgressBarComponent) reviewProgress: DxProgressBarComponent;

    @Input() title: string;
    @Input() icon: string;
    @Input() checkSimilarFields: Array<any>;
    @Input() phoneRelatedCountryFields = {};
    @Input() columnsConfig: any = {};
    @Input() preProcessFieldBeforeReview: Function;
    @Input() validateFieldsMapping: Function;
    @Input() validateFieldsValues: any = {};
    @Input() showLeftMenuToggleButton = false;
    @Input() set fields(list: any[]) {
        this.lookupFields = list.map((field) => {
            field.normalizedId = this.normalizeFieldName(field.id);
            return field;
        });
    }
    @Input()
    set toolbarConfig(config: any[]) {
        this._toolbarConfig = config;
    }

    @Output() onCancel: EventEmitter<any> = new EventEmitter();
    @Output() onComplete: EventEmitter<any> = new EventEmitter();
    @Output() onMappingChanged: EventEmitter<any> = new EventEmitter();
    @Output() onSelectionChanged: EventEmitter<any> = new EventEmitter();


    lookupFields: any[];
    uploadFile: FormGroup;
    dataMapping: FormGroup;

    _toolbarConfig: ToolbarGroupModel[];
    private files: NgxFileDropEntry[] = [];
    private duplicateCounts: any = {};
    private reviewGroups: any = [];
    private invalidRowKeys: any = {};
    private validateFieldList: string[] = [
        'url',
        'email',
        'phone',
        'revenue',
        'countryName',
        'countryId',
        'stateId',
        'rating',
        'gender',
        'stage',
        'paymentPeriodType'
    ];
    private excludeCCValidation = ['UK'];
    private similarFieldsIndex: any = {};

    readonly UPLOAD_STEP_INDEX = 0;
    readonly MAPPING_STEP_INDEX = 1;
    readonly REVIEW_STEP_INDEX = 2;
    readonly FINISH_STEP_INDEX = 3;

    countries: CountryDto[];
    selectedStepIndex = 0;
    showSteper = true;
    loadProgress = 0;
    dropZoneProgress = 0;

    fileData: any;
    fileName = '';
    fileSize = '';
    fileContent = '';
    fileOrigSize = 0;
    fileHasHeader = false;
    fileHeaderWasGenerated = false;

    selectedPreviewRows: any = [];
    reviewDataSource: any;
    mapDataSource: any;
    selectedMapRowKeys: number[] = [];
    isNextButtonHidden = false;

    selectModeItems = [
        { text: this.l('AffectOnPageItems'), mode: 'page' },
        { text: this.l('AffectAllPagesItems'), mode: 'allPages' }
    ];
    formatting = AppConsts.formatting;
    leftMenuCollapsed$: Observable<boolean> = this.leftMenuService.collapsed$;

    constructor(
        injector: Injector,
        private parser: Papa,
        private dialog: MatDialog,
        private formBuilder: FormBuilder,
        private phoneFormat: PhoneFormatPipe,
        private store$: Store<RootStore.State>,
        private importProxy: ImportServiceProxy,
        private phoneNumberService: PhoneNumberService,
        private leftMenuService: LeftMenuService
    ) {
        super(injector);
        this.uploadFile = formBuilder.group({
            url: ['', Validators.pattern(/((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/)],
            valid: ['', () => {
                return this.checkFileDataValid() ? null : { 'required': true };
            }]
        });
        this.dataMapping = formBuilder.group({
            valid: ['', () => {
                let validationResult: any = { 'required': true };
                if (this.validateFieldsMapping)
                    _.extend(validationResult, this.validateFieldsMapping(this.getMappedFields()));
                return validationResult && validationResult.isMapped && !validationResult.error ? null : validationResult;
            }]
        });

        this.store$.dispatch(new CountriesStoreActions.LoadRequestAction());
        this.store$.pipe(select(CountriesStoreSelectors.getCountries), filter(Boolean), first())
            .subscribe((countries: CountryDto[]) => this.countries = countries);
    }

    public static getFieldLocalizationName(dataField: string): string {
        let parts = dataField.split(ImportWizardComponent.FieldSeparator);
        let partsCapitalized = parts.map(p => capitalize(p));
        partsCapitalized.unshift(ImportWizardComponent.FieldLocalizationPrefix);
        return partsCapitalized.join(ImportWizardComponent.FieldSeparator);
    }

    ngAfterViewInit() {
        this.selectedStepChanged(null);
    }

    reset(callback = null) {
        this.fileData = null;
        this.dropZoneProgress = 0;
        this.loadProgress = 0;
        this.showSteper = false;
        this.uploadFile.reset();
        this.dataMapping.reset();
        this.mapDataSource = [];
        this.emptyReviewData();
        this.selectedStepIndex = 0;

        setTimeout(() => {
            this.showSteper = true;
            callback && callback();
        });
    }

    next() {
        if (this.stepper.selectedIndex == this.UPLOAD_STEP_INDEX) {
            this.uploadFile.controls.valid.updateValueAndValidity();
            if (this.uploadFile.valid)
                this.buildMappingDataSource().then(() => this.stepper.next());
            else
                this.message.error(this.l('ChooseCorrectCSV'));
        } else if (this.stepper.selectedIndex == this.MAPPING_STEP_INDEX) {
            this.dataMapping.controls.valid.updateValueAndValidity();
            if (this.dataMapping.valid) {
                this.initReviewDataSource(this.getMappedFields());
                this.stepper.next();
            } else {
                this.highlightUnmappedFields(this.getMappedFields());
                this.message.error(this.dataMapping.controls.valid.errors.error || this.l('MapAllRecords'));
            }
        } else if (this.stepper.selectedIndex == this.REVIEW_STEP_INDEX) {
            let dialogData = { importAll: true };
            this.dialog.open(ConfirmImportDialog, {
                data: dialogData
            }).afterClosed().subscribe(result => {
                if (result) {
                    let records = this.reviewGrid.instance.getSelectedRowsData();
                    records = records.length && records || this.reviewDataSource;
                    this.complete(records, dialogData.importAll);
                }
            });
        }
    }

    getMappedFields() {
        let mappedFields = this.mapGrid &&
            this.mapGrid.instance.getSelectedRowsData() || [];
        if (!mappedFields.length) {
            mappedFields = this.mapDataSource && this.mapDataSource.store &&
                this.mapDataSource.store.data.filter((row) => {
                    return !!row.mappedField;
                }) || [];
        }
        return mappedFields;
    }

    cancel() {
        this.reset(() => {
            this.onCancel.emit();
        });
    }

    complete(rows = null, importAll = false) {
        if (rows && !rows.length)
            return this.message.info(this.l('Import_NoRecordsAvailable'));

        let data = rows || this.reviewGrid.instance.getSelectedRowsData();
        this.onComplete.emit({
            fields: this.fileHeaderWasGenerated ? undefined :
                this.getMappedFields().map((entity) => {
                    return ImportFieldInfoDto.fromJS({
                        inputFieldName: entity.sourceField,
                        outputFieldName: entity.mappedField
                    });
                }
            ),
            records: data.length && data || this.reviewDataSource,
            importAll: importAll,
        });
    }

    showFinishStep() {
        this.stepper.selectedIndex =
            this.selectedStepIndex =
                this.FINISH_STEP_INDEX;
    }

    emptyReviewData() {
        this.reviewDataSource = [];
        this.selectedPreviewRows = [];
        this.duplicateCounts = {};
        this.reviewGroups = [];
        this.invalidRowKeys = {};
        this.similarFieldsIndex = {};
    }

    initReviewDataSource(mappedFields) {
        this.isNextButtonHidden = true;
        this.emptyReviewData();
        setTimeout(() => {
            let dataSource = [], progress = 0, totalCount = this.fileData.data.length - (this.fileHasHeader ? 0 : 1),
                mappedFieldsSorted = mappedFields.slice().sort((prev, next) => prev.mappedField.localeCompare(next.mappedField)),
                onePercentCount = totalCount < 100 ? totalCount : Math.ceil(totalCount / 100), columnCount = 0;
            let processPartially = () => {
                let index = onePercentCount * progress;
                for (index; index < Math.min(onePercentCount * (progress + 1), totalCount); index++) {
                    let row = this.fileData.data[index];
                    if (index) {
                        if (row.length == columnCount) {
                            let data = {}, dataSorted = {};
                            mappedFieldsSorted.forEach(field => {
                                let value = (row[field.id] || '').trim();
                                if (!(this.preProcessFieldBeforeReview && this.preProcessFieldBeforeReview(field, value, data))
                                    && !data[field.mappedField]) data[field.mappedField] = value;
                            });
                            if (!this.checkDuplicate(row, data)) {
                                this.checkSimilarGroups(data);
                                this.validateRowFields(data);
                                dataSource.push(data);
                            }
                        }
                    } else
                        columnCount = row.length;
                }

                if (index < totalCount) {
                    this.reviewProgress.instance.option('value', ++progress);
                    setTimeout(() => processPartially(), 100);
                } else {
                    this.updateGroupNames();
                    this.reviewDataSource = dataSource;
                    this.reviewProgress.instance.option('value', 100);
                    this.reviewProgress.instance.option('visible', false);
                    this.isNextButtonHidden = false;
                }
            };

            this.reviewProgress.instance.option('visible', true);
            setTimeout(() => processPartially(), 100);
        });
    }

    updateGroupNames() {
        let reviewGroupsName = [],
            showFields = this.checkSimilarFields[0][0].split(':');
        this.reviewGroups.forEach((group) => {
            if (group && group.length) {
                let item = group[group.length - 1];
                if (group.length > 1) {
                    let groupName = showFields.map((fld) => item[fld]).join(' ');
                    reviewGroupsName.push(groupName);
                    group.forEach((item) => {
                        item.compared = groupName;
                    });
                } else
                    item.compared = this.l('Unique records');
                this.selectedPreviewRows.push(item.uniqueIdent);
            }
        });
        this.reviewGroups = reviewGroupsName;
    }

    getUniqueIdent(list) {
        let id = 0;
        list.forEach((value) => {
            if (value)
                for (let i = 0; i < value.length; i++)
                    id = (id << 5) - id + value[i].toLowerCase().charCodeAt(0);
        });
        return id;
    }

    checkDuplicate(raw, row) {
        let ident = this.getUniqueIdent(raw),
            count = this.duplicateCounts[ident];

        return !(row.uniqueIdent = ident) ||
            (this.duplicateCounts[ident] = (count || 0) + 1) > 1;
    }

    checkSimilarGroups(row) {
        let newGroup = [row], newGroupIndex = 0;
        if (newGroupIndex = this.reviewGroups.length) {
            let mergeGroupsIndex = [], fieldsIndex = [];

            this.checkSimilarFields.forEach((fields) => {
                fields.forEach((field) => {
                    let conditionValues = field.split(':').map((fld) => {
                        return row[fld] || '';
                    }), fieldIndex = conditionValues.every(Boolean) ?
                        this.getUniqueIdent(conditionValues) : 0;
                    if (fieldIndex) {
                        fieldsIndex.push(fieldIndex);
                        let groupIndex = this.similarFieldsIndex[fieldIndex];
                        if (groupIndex) {
                            mergeGroupsIndex.push(groupIndex);
                            row.highliteFields = conditionValues;

                            let group = this.reviewGroups[groupIndex];
                            if (group && group.length == 1)
                                group[0].highliteFields = conditionValues;
                        } else
                            this.similarFieldsIndex[fieldIndex] = newGroupIndex;
                    }
                });
            });

            if (mergeGroupsIndex.length) {
                mergeGroupsIndex.forEach((index) => {
                    if (this.reviewGroups[index])
                        newGroup = newGroup.concat(this.reviewGroups[index]);
                    delete this.reviewGroups[index];
                });
                fieldsIndex.forEach((index) => {
                    this.similarFieldsIndex[index] = newGroupIndex;
                });
                this.reviewGroups.push(newGroup);

                return;
            }
        }

        this.reviewGroups.push(newGroup);
    }

    highlightUnmappedFields(rows) {
        rows.forEach(row => {
            if (!row.mappedField)
                this.highlightUnmappedField(row);
        });
    }

    highlightUnmappedField(row) {
        let rowIndex = this.mapGrid.instance.getRowIndexByKey(row.id);
        let cellElement = this.mapGrid.instance.getCellElement(rowIndex, 'mappedField') || null;
        let rows = cellElement ? cellElement.closest('.dx-datagrid-rowsview').querySelectorAll(`tr:nth-of-type(${rowIndex + 1})`) : [];
        for (let i = 0; i < rows.length; i++) {
            rows[i].classList.add(`unmapped-field`);
        }
    }

    checkFileDataValid() {
        let errors = this.fileData && this.fileData.errors || [];
        return this.fileData
            && (!errors.length || (errors.length == 1 && errors[0].code == 'UndetectableDelimiter'))
            && this.fileData.data.length;
    }

    parse(content) {
        this.fileContent = content;
        this.parser.parse(this.fileContent, {
            complete: (results: PapaParseResult) => {
                this.fileData = results;
                if (!this.checkFileDataValid())
                    this.message.error(this.l('IncorrectFileFormatError'));
                else {
                    this.fileHeaderWasGenerated = false;
                    this.checkIfFileHasHeaders();
                }
            }
        });
    }

    getFileSize(size) {
        return (size / 1024).toFixed(2) + 'KB';
    }

    loadFileContent(file) {
        if (file.size > 25 * 1024 * 1024) {
            abp.message.warn(this.l('FilesizeLimitWarn', 25));
            this.files = [];
            return;
        }

        this.loadProgress = 0;
        this.fileName = file.name;
        let reader = new FileReader();
        reader.onload = () => {
            let bytes = StringHelper.convertToBytes(reader.result.toString());
            this.fileOrigSize = bytes.length;
            this.fileSize = this.getFileSize(bytes.length);
            this.dropZoneProgress = 101;
            this.parse(reader.result);
        };
        reader.onprogress = (event) => {
            if (event.total > event.loaded)
                this.dropZoneProgress = Math.round(
                    event.loaded / event.total * 100);
        };
        reader.readAsText(file);
    }

    fileDropped(files: NgxFileDropEntry[]) {
        this.files = files;
        if (this.files.length) {
            let file = this.files[0];
            if (file.fileEntry)
                file.fileEntry['file'](this.loadFileContent.bind(this));
            else
                this.loadFileContent(file);
        }
    }

    getColumnsMappingSuggestions(callback) {
        this.importProxy.getMappedFields(this.fileData.data[0].filter(Boolean)).subscribe(callback);
    }

    checkFileHeaderAvailability() {
        if (!this.fileHasHeader && !this.fileHeaderWasGenerated) {
            let columnsCount = this.fileData.data[0].length;
            let headers: string[] = [];
            for (let i = 0; i < columnsCount; i++) {
                headers.push(`Column ${i + 1}`);
            }

            this.fileData.data.unshift(headers);
            this.fileHeaderWasGenerated = true;
        } else if (this.fileHasHeader && this.fileHeaderWasGenerated) {
            this.fileData.data.shift();
            this.fileHeaderWasGenerated = false;
        }
    }

    buildMappingDataSource() {
        return new Promise<void>((resolve, reject) => {
            if (this.fileData && this.fileData.data && this.fileData.data.length) {
                this.checkFileHeaderAvailability();
                let createDataSourceInternal = (mappingSuggestions = []) => {
                    let noNameCount = 0, usedMapFields = {}, usedSourceFields = {},
                        data: any[] = this.fileData.data[0].map((field, index) => {
                            let foundItem;
                            let normalizedFieldName;
                            if (field) {
                                if (isNaN(usedSourceFields[field]))
                                    usedSourceFields[field] = 1;
                                else {
                                    usedSourceFields[field]++;
                                    field = field + ' ' + usedSourceFields[field];
                                }

                                normalizedFieldName = this.normalizeFieldName(field);
                                let suggestionField = _.findWhere(mappingSuggestions, { inputFieldName: field }) ||
                                    mappingSuggestions.find(v => this.normalizeFieldName(v.inputFieldName) == normalizedFieldName);
                                if (suggestionField) {
                                    foundItem = this.lookupFields.find(item => suggestionField.outputFieldName == item.id);
                                }

                                if (!foundItem) {
                                    foundItem = this.findFieldInLookupFields(normalizedFieldName, usedMapFields);
                                }

                                if (foundItem)
                                    usedMapFields[foundItem.id] = true;
                            }

                            return {
                                id: index,
                                sourceField: field || this.l('NoName', [++noNameCount]),
                                sampleValue: this.lookForValueExample(index),
                                mappedField: foundItem ? foundItem.id : undefined,
                                normalizedSourceField: normalizedFieldName
                            };
                        });

                    this.mapField(data, s => 'contact' + s, usedMapFields);
                    this.mapField(data, s => 'lead' + s, usedMapFields);
                    this.mapField(data, s => 'lead' + s + 'name', usedMapFields);
                    this.mapField(data, s => 'user' + s, usedMapFields);
                    this.mapField(data, s => 'personalinfo' + s, usedMapFields);
                    this.mapField(data, s => 'personalinfois' + s, usedMapFields);
                    this.mapField(data, s => 'personalinfo' + s + '1', usedMapFields);
                    this.mapField(data, s => 'personalinfo' + s + 'url', usedMapFields);
                    this.mapField(data, s => 'personalinfofullname' + s, usedMapFields);
                    this.mapField(data, s => 'personalinfofullname' + s + 'name', usedMapFields);
                    this.mapField(data, s => 'personalinfofullnamename' + s, usedMapFields);
                    this.mapField(data, s => 'personalinfofulladdress' + s, usedMapFields);
                    this.mapField(data, s => 'personalinfofulladdress' + s + 'name', usedMapFields);
                    this.mapField(data, s => 'personalinfofulladdressaddress' + s, usedMapFields);
                    this.mapField(data, s => 'personalinfofulladdress' + s, usedMapFields, s => s + 'address');
                    this.mapField(data, s => 'personalinfocustomfields' + s.replace('contactcustom', 'custom').replace('contact', 'custom'), usedMapFields);
                    this.mapField(data, s => 'businessinfo' + s, usedMapFields);
                    this.mapField(data, s => 'businessinfo' + s + 'name', usedMapFields);
                    this.mapField(data, s => 'businessinfo' + s + 'url', usedMapFields);
                    this.mapField(data, s => 'businessinfo' + s + '1', usedMapFields);
                    this.mapField(data, s => 'businessinfo' + s.replace('companyaddress', 'companyfulladdress'), usedMapFields);
                    this.mapField(data, s => 'businessinfo' + s.replace('company', 'companyfulladdress'), usedMapFields);
                    this.mapField(data, s => 'businessinfo' + s.replace('company', 'companyfulladdress') + 'name', usedMapFields);
                    this.mapField(data, s => 'businessinfo' + s.replace('company', 'companyfulladdress'), usedMapFields, s => s + 'address');
                    this.mapField(data, s => 'businessinfo' + s.replace('workaddress', 'workfulladdress'), usedMapFields);
                    this.mapField(data, s => 'businessinfo' + s.replace('work', 'workfulladdress'), usedMapFields);
                    this.mapField(data, s => 'businessinfo' + s.replace('work', 'workfulladdress') + 'name', usedMapFields);
                    this.mapField(data, s => 'businessinfo' + s.replace('work', 'workfulladdress'), usedMapFields, s => s + 'address');
                    this.mapField(data, s => 'trackinginfo' + s, usedMapFields);
                    this.mapField(data, s => 'trackinginfo' + s + 'url', usedMapFields);
                    this.mapField(data, s => 'trackinginfo' + s + 'id', usedMapFields);
                    this.mapField(data, s => 'trackinginfo' + s + 'created', usedMapFields);
                    this.mapField(data, s => 'requestcustominfo' + s.replace('requestcustom', 'custom').replace('request', 'custom')
                         .replace('leadcustom', 'custom').replace('lead', 'custom'), usedMapFields);

                    this.mapDataSource = {
                        store: {
                            type: 'array',
                            key: 'id',
                            data: data
                        }
                    };

                    let selectedMapRowKeys = [];
                    data.forEach(v => {
                        if (v.mappedField)
                            selectedMapRowKeys.push(v.id);
                    });
                    this.selectedMapRowKeys = selectedMapRowKeys;
                    resolve();
                };

                if (this.fileHeaderWasGenerated)
                    createDataSourceInternal();
                else this.getColumnsMappingSuggestions((res) => {
                    createDataSourceInternal(res);
                });

            } else
                resolve();
        });
    }

    normalizeFieldName(name: string): string {
        if (name)
            return name.replace(/\s|_|-|\./g, '').toLowerCase();

        return null;
    }

    findFieldInLookupFields(field: string, usedMapFields, lookupFieldModifyFunc: (s: string) => string = null) {
        if (lookupFieldModifyFunc) {
            return this.lookupFields.find(item => !usedMapFields[item.id] && lookupFieldModifyFunc(item.normalizedId) == field);
        } else {
            return this.lookupFields.find(item => !usedMapFields[item.id] && item.normalizedId == field);
        }
    }

    mapField(data: any[], sourceFieldModifyFunc: (s: string) => string, usedMapFields, lookupFieldModifyFunc: (s: string) => string = null) {
        data.forEach(fieldData => {
            if (!fieldData.mappedField && fieldData.normalizedSourceField) {
                let fieldToFind = sourceFieldModifyFunc(fieldData.normalizedSourceField);
                let foundItem = this.findFieldInLookupFields(fieldToFind, usedMapFields, lookupFieldModifyFunc);

                if (foundItem) {
                    usedMapFields[foundItem.id] = true;
                    fieldData.mappedField = foundItem.id;
                }
            }
        });
    }

    checkIfFileHasHeaders() {
        if (this.fileData.data.length) {
            const constNames = ['name', 'email', 'number', 'phone'];
            let namesFoundCount = 0;

            for (let i = 0; i < constNames.length; i++) {
                let nameIsPresent = false;
                this.fileData.data[0].forEach((val: string) => {
                    if (val.toLowerCase().indexOf(constNames[i]) != -1)
                        nameIsPresent = true;
                });
                if (nameIsPresent) {
                    namesFoundCount++;
                }
            }

            this.fileHasHeader = namesFoundCount >= 2;
        }
    }

    lookForValueExample(fieldIndex) {
        let notEmptyIndex = 1;
        this.fileData.data.every((record, index) => {
            notEmptyIndex = index || notEmptyIndex;
            return !index || !record[fieldIndex];
        });
        return this.fileData.data[notEmptyIndex][fieldIndex];
    }

    downloadFromURL() {
        if (!this.uploadFile.get('url').invalid) {
            let url = this.uploadFile.value.url;
            if (url)
                this.getFile(url, (result) => {
                    if (result.target.status == 200) {
                        this.fileName = decodeURI(url.split('?')[0].split('/').pop());
                        this.fileSize = this.getFileSize(result.loaded);
                        this.parse(result.target.responseText);
                    } else {
                        this.message.error(result.target.statusText);
                    }
                });
            else
                this.message.error(this.l('FieldEmptyError', [this.l('URL')]));
        }
    }

    getFile(path: string, callback: Function) {
        this.dropZoneProgress = 0;
        let request = new XMLHttpRequest();
        request.addEventListener('load', (event) => {
            this.loadProgress = 101;
            callback(event);
        });
        request.addEventListener('progress', (event) => {
            if (event.total > event.loaded)
                this.loadProgress = Math.round(event.loaded / event.total * 100);
        });
        request.open('GET', path, true);
        request.setRequestHeader('Accept', '*/*');
        request.setRequestHeader('Content-Type', 'application/*');

        request.send();
    }

    onRowValidating($event) {
        if ($event.newData.mappedField) {
            $event.component.selectRows([$event.key], true);
            this.mapDataSource.store.data.forEach((row) => {
                if ($event.oldData.sourceField != row.sourceField &&
                    $event.newData.mappedField && $event.newData.mappedField == row.mappedField) {
                    $event.isValid = false;
                    $event.errorText = this.l('FieldMapError', [row.sourceField]);
                }
            });
        } else
            $event.component.deselectRows([$event.key]);

        if ($event.isValid && this.mapGrid)
            this.mapGrid.instance.closeEditCell();
    }

    selectionModeChanged($event) {
        this.reviewGrid.instance.option(
            'selection.selectAllMode', $event.itemData.mode);
    }

    onMapSelectionChanged($event) {
        setTimeout(() => {
            let rowIdsToDeselect = [];
            $event.selectedRowsData.forEach((row) => {
                if (!row.mappedField)
                    rowIdsToDeselect.push(row.id);
            });

            if (rowIdsToDeselect.length)
                $event.component.deselectRows(rowIdsToDeselect);
            this.onMappingChanged.emit($event);
        }, 300);
    }

    onLookupFieldsContentReady($event, cell) {
        $event.component.unselectAll();
        $event.component.selectItem(cell.value);
    }

    onLookupFieldsItemRendered($event) {
        if (this.mapGrid)
            this.mapGrid.instance.getSelectedRowsData().forEach((row) => {
                if (row.mappedField == $event.node.key)
                    $event.itemElement.classList.add('mapped');
            });
    }

    mappedFieldChanged(event, cell) {
        if (event.previousValue && !event.value) {
            cell.component.deselectRows(cell.key);
            cell.setValue(event.value);
        }
    }

    customizePreviewColumns = (columns) => {
        let mappedFileds = this.getMappedFields();
        columns.forEach((column, index) => {
            if (['uniqueIdent', 'highliteFields'].indexOf(column.dataField) >= 0)
                return column.visible = false;

            let columnConfig = this.columnsConfig[column.dataField];
            if (column.dataField == 'compared') {
                if (this.reviewGroups.length)
                    column.groupIndex = 0;
                else {
                    column.visible = false;
                    this.selectedPreviewRows = [];
                }
            } else {
                if (columnConfig)
                    _.extend(column, columnConfig);
                this.initColumnTemplate(column);
                column.calculateDisplayValue = this.calculateDisplayValue;
                column.visibleIndex = _.findIndex(mappedFileds, item => column.dataField == item.mappedField);
                if (column.visibleIndex == -1) {
                    let dataField = column.dataField.split('_').slice(0, -1).join('_');
                    column.visibleIndex = _.findIndex(mappedFileds, item => dataField == item.mappedField);
                }
            }

            if (!columnConfig || !columnConfig['caption'])
                column.caption = this.l(ImportWizardComponent.getFieldLocalizationName(column.dataField));
        });
    }

    initColumnTemplate(column) {
        this.validateFieldList.some((fld) => {
            if (column.dataField.toLowerCase().includes(fld.toLowerCase()))
                return !!(column.cellTemplate = column.cellTemplate || 'commonCell');
        });
    }

    validateRowFields(data) {
        this.validateFieldList.forEach((fld) => {
            Object.keys(data).forEach((field) => {
                if (field.toLowerCase().includes(fld.toLowerCase()) &&
                    !this.checkFieldValid(fld, data, field)
                )
                    this.addInvalidField(data.uniqueIdent, field);
            });
        });
    }

    addInvalidField(key, field) {
        let invalidRowFields = this.invalidRowKeys[key];
        if (invalidRowFields && invalidRowFields.indexOf(field) < 0)
            invalidRowFields.push(field);
        else
            this.invalidRowKeys[key] = [field];
    }

    checkFieldValid(key, data, field): boolean {
        let value = data[field] && data[field].trim ? data[field].trim() : data[field];
        if (!value)
            return true;
        if (key == 'phone') {
            let isValid = this.phoneNumberService.isPhoneNumberValid(
                value, this.getFieldCountryCode(data, field));
            if (isValid)
                data[field] = this.phoneFormat.transform(
                    value, this.getFieldDefaultCountry(data, field)).replace(/[^\d+]/g, '');
            return isValid;
        } else if (key == 'revenue')
            return !value || !isNaN(value) || !isNaN(parseFloat(value.replace(/[^0-9.]/g, '')));
        else if (key == 'countryName')
            return value.trim().length > 3;
        else if (key == 'countryId') {
            value = data[field] = value.toUpperCase();
            return this.excludeCCValidation.indexOf(value) >= 0
                || !!_.findWhere(this.countries, {code: value});
        } else if (key == 'stateId') {
            value = data[field] = value.toUpperCase();
            return value.length >= 2 && value.length <= 3;
        } else if (key == 'rating')
            return !isNaN(value) && value >= 1 && value <= 10;
        else if (key == 'gender')
            return ['f', 'm', 'female', 'male', '0', '1'].indexOf(value.toLowerCase()) >= 0;
        else if (key == 'stage')
            return this.validateFieldsValues.stages.some(
                item => item.name.toLowerCase() == value.toLowerCase());
        else if (key == 'paymentPeriodType')
            return [
                RecurringPaymentFrequency.Monthly.toLowerCase(), 
                RecurringPaymentFrequency.Annual.toLowerCase(), 
                RecurringPaymentFrequency.LifeTime.toLowerCase()
            ].includes(value.trim().toLowerCase());
        else

            return AppConsts.regexPatterns[key].test(value);
    }

    getPhoneDefaultCountry(cellData) {
        return this.getFieldDefaultCountry(cellData.data, cellData.column.dataField);
    }

    getFieldDefaultCountry(data, field) {
        let countryCode = this.getFieldCountryCode(data, field);        
        if (countryCode)
            return {defaultCountry: countryCode};
    }

    getFieldCountryCode(data, field) {
        let country = this.phoneRelatedCountryFields[field];
        if (country) {
            let contryFieldValue = this.getCheckFieldRefValue(data, country.code);
            if (contryFieldValue && _.findWhere(this.countries, {code: contryFieldValue}))
                return contryFieldValue;
            contryFieldValue = this.getCheckFieldRefValue(data, country.name);
            if (contryFieldValue)
                return this.getCountryCodeByCountryName(contryFieldValue);
        }
    }

    getCheckFieldRefValue(data, ref) {
        if (ref instanceof Array) {
            return data[_.find(ref, val => data[val])];
        } else
            return ref && data[ref];
    }

    getCountryCodeByCountryName(name) {
        let country = _.findWhere(this.countries, {name: name});
        return country && country.code;
    }

    checkFieldInvalid(cellData) {
        let invalidList = this.invalidRowKeys[cellData.data.uniqueIdent];
        return invalidList && invalidList.indexOf(cellData.column.dataField) >= 0;
    }

    calculateDisplayValue(data) {
        const MAX_LEN = 80;
        let value = data[this['dataField']];
        if (value && value.length > MAX_LEN)
            return value.substr(0, MAX_LEN) + '...';
        return value;
    }

    onReviewCellPrepared($event) {
        if ($event.data && $event.data.highliteFields &&
            $event.data.highliteFields.indexOf($event.value) >= 0
        ) $event.cellElement.classList.add('bold');
    }

    toggleLeftMenu() {
        this.leftMenuService.toggle();
    }

    selectedStepChanged(event) {
        this.onSelectionChanged.emit(event);
        if (event)
            this.selectedStepIndex = event.selectedIndex;
    }
}