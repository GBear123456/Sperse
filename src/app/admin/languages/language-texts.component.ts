import { Component, Injector, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { LanguageServiceProxy, ApplicationLanguageListDto, LanguageTextListDto } from '@shared/service-proxies/service-proxies';
import { AppComponentBase } from '@shared/common/app-component-base';
import { JTableHelper } from '@shared/helpers/JTableHelper';
import { EditTextModalComponent } from './edit-text-modal.component';

import * as _ from 'lodash';

@Component({
    templateUrl: "./language-texts.component.html",
    styleUrls: ["./language-texts.component.less"]
})
export class LanguageTextsComponent extends AppComponentBase implements AfterViewInit, OnInit {

    @ViewChild('targetLanguageNameCombobox') targetLanguageNameCombobox: ElementRef;
    @ViewChild('baseLanguageNameCombobox') baseLanguageNameCombobox: ElementRef;
    @ViewChild('sourceNameCombobox') sourceNameCombobox: ElementRef;
    @ViewChild('targetValueFilterCombobox') targetValueFilterCombobox: ElementRef;

    @ViewChild('textsTable') textsTable: ElementRef;

    @ViewChild('editTextModal') editTextModal: EditTextModalComponent;

    sourceNames: string[] = [];
    languages: abp.localization.ILanguageInfo[] = [];

    targetLanguageName: string;
    sourceName: string;
    baseLanguageName: string;
    targetValueFilter: string;
    filterText: string;

    private _$textsTable: JQuery;

    constructor(
        injector: Injector,
        private _languageService: LanguageServiceProxy,
        private _router: Router,
        private _activatedRoute: ActivatedRoute
    ) {
        super(injector);
    }

    ngOnInit(): void {
        this.sourceNames = _.map(_.filter(abp.localization.sources, source => source.type === 'MultiTenantLocalizationSource'), value => value.name);
        this.languages = abp.localization.languages;
    }

    ngAfterViewInit(): void {
        setTimeout(() => {
            this.init();
        });
    }

    init(): void {
        this._$textsTable = $(this.textsTable.nativeElement);
        this._$textsTable.jtable({

            title: this.l('LanguageTexts'),

            paging: true,
            sorting: true,

            actions: {
                listAction: (postData, jtParams: JTableParams) => {
                    return JTableHelper.toJTableListAction(
                        this._languageService.getLanguageTexts(
                            jtParams.jtPageSize,
                            jtParams.jtStartIndex,
                            jtParams.jtSorting,
                            this.sourceName,
                            this.baseLanguageName,
                            this.targetLanguageName,
                            this.targetValueFilter,
                            this.filterText
                        )
                    );
                }
            },

            fields: {
                key: {
                    key: true,
                    list: true,
                    title: this.l('Key'),
                    width: '30%',
                    display: (data: JTableFieldOptionDisplayData<LanguageTextListDto>) => '<span title="' + data.record.key + '">' + abp.utils.truncateString(data.record.key, 32) + '</span>'
                },
                baseValue: {
                    title: this.l('BaseValue'),
                    width: '30%',
                    display: (data: JTableFieldOptionDisplayData<LanguageTextListDto>) => '<span title="' + (data.record.baseValue || '') + '">' + (abp.utils.truncateString(data.record.baseValue, 32) || '') + '</span>'
                },
                targetValue: {
                    title: this.l('TargetValue'),
                    width: '30%',
                    display: (data: JTableFieldOptionDisplayData<LanguageTextListDto>) => '<span title="' + (data.record.targetValue || '') + '">' + (abp.utils.truncateString(data.record.targetValue, 32) || '') + '</span>'
                },
                actions: {
                    title: '',
                    width: '10%',
                    sorting: false,
                    display: (data: JTableFieldOptionDisplayData<LanguageTextListDto>) => {
                        var $span = $('<span></span>');

                        $('<button class="btn btn-default btn-xs" title="' + this.l('Edit') + '"><i class="fa fa-edit"></i></button>')
                            .appendTo($span)
                            .click(() => {
                                this.editTextModal.show(
                                    this.baseLanguageName,
                                    this.targetLanguageName,
                                    this.sourceName,
                                    data.record.key,
                                    data.record.baseValue,
                                    data.record.targetValue
                                );
                            });

                        return $span;
                    }
                }
            }

        });

        this._activatedRoute.params.subscribe((params: Params) => {
            this.baseLanguageName = params['baseLanguageName'] || abp.localization.currentLanguage.name;
            this.targetLanguageName = params['name'];
            this.sourceName = params['sourceName'] || 'Platform';
            this.targetValueFilter = params['targetValueFilter'] || 'ALL';
            this.filterText = params['filterText'] || '';

            setTimeout(() => {
                $(this.baseLanguageNameCombobox.nativeElement).selectpicker('refresh');
                $(this.targetLanguageNameCombobox.nativeElement).selectpicker('refresh');
                $(this.sourceNameCombobox.nativeElement).selectpicker('refresh');
                $(this.targetValueFilterCombobox.nativeElement).selectpicker('refresh');
            }, 0);

            this.getTexts();
        });
    }

    getTexts(): void {
        this._$textsTable.jtable('load');
    }

    applyFilters(): void {
        this._router.navigate(['app/admin/languages', this.targetLanguageName, 'texts', {
            sourceName: this.sourceName,
            baseLanguageName: this.baseLanguageName,
            targetValueFilter: this.targetValueFilter,
            filterText: this.filterText
        }]);
    }

    refreshTextValueFromModal(): void {
        this._$textsTable.jtable('updateRecord',
            {
                record: {
                    key: this.editTextModal.model.key,
                    targetValue: this.editTextModal.model.value
                },
                clientOnly: true
            });
    }
}