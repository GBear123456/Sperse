import { Component, Injector, AfterViewInit, ViewEncapsulation, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { LanguageServiceProxy, ApplicationLanguageListDto, SetDefaultLanguageInput } from '@shared/service-proxies/service-proxies';
import { AppComponentBase } from '@shared/common/app-component-base';
import * as moment from "moment";
import { JTableHelper } from '@shared/helpers/JTableHelper';
import { CreateOrEditLanguageModalComponent } from './create-or-edit-language-modal.component';
import { appModuleAnimation } from '@shared/animations/routerTransition';

@Component({
    templateUrl: "./languages.component.html",
    styleUrls: ["./languages.component.less"],
    encapsulation: ViewEncapsulation.None,
    animations: [appModuleAnimation()]
})
export class LanguagesComponent extends AppComponentBase implements AfterViewInit {

    @ViewChild('languagesTable') languagesTable: ElementRef;
    @ViewChild('createOrEditLanguageModal') createOrEditLanguageModal: CreateOrEditLanguageModalComponent;

    defaultLanguageName: string;
    private _$languagesTable: JQuery;

    constructor(
        injector: Injector,
        private _languageService: LanguageServiceProxy,
        private _router: Router
    ) {
        super(injector);
    }

    ngAfterViewInit(): void {
        let self = this;

        const initTable = () => {
            this._$languagesTable = $(this.languagesTable.nativeElement);
            this._$languagesTable.jtable({

                title: this.l('Languages'),

                multiSorting: true,

                actions: {
                    listAction: () => {
                        return JTableHelper.toJTableListAction(this._languageService.getLanguages());
                    }
                },

                fields: {
                    id: {
                        key: true,
                        list: false
                    },
                    actions: {
                        title: this.l('Actions'),
                        width: '30%',
                        sorting: false,
                        type: 'record-actions',
                        cssClass: 'btn btn-xs btn-primary blue',
                        text: '<i class="fa fa-cog"></i> ' + this.l('Actions') + ' <span class="caret"></span>',
                        items: [{
                            text: this.l('Edit'),
                            visible: (data): boolean => {
                                return self.isGranted('Pages.Administration.Languages.Edit') && data.record.tenantId === this.appSession.tenantId;
                            },
                            action(data) {
                                self.createOrEditLanguageModal.show(data.record.id);
                            }
                        }, {
                            text: this.l('ChangeTexts'),
                            visible: (): boolean => {
                                return self.isGranted('Pages.Administration.Languages.ChangeTexts');
                            },
                            action(data) {
                                self.changeTexts(data.record);
                            }
                        }, {
                            text: this.l('SetAsDefaultLanguage'),
                            visible: (): boolean => {
                                return self.isGranted('Pages.Administration.Languages.Edit');
                            },
                            action(data) {
                                self.setAsDefaultLanguage(data.record);
                            }
                        }, {
                            text: this.l('Delete'),
                            visible: (data): boolean => {
                                return self.isGranted('Pages.Administration.Languages.Delete') && data.record.tenantId === this.appSession.tenantId;
                            },
                            action(data) {
                                self.deleteLanguage(data.record);
                            }
                        }]
                    },
                    displayName: {
                        title: this.l('Name'),
                        width: '30%',
                        display: (data: JTableFieldOptionDisplayData<ApplicationLanguageListDto>) => {
                            const $span = $('<span></span>');

                            $span.append('<i class="' + data.record.icon + '"></i>');
                            $span.append(' &nbsp; ');
                            $span.append('<span data-language-name="' + data.record.name + '">' + data.record.displayName + "</span>");

                            return $span;
                        }
                    },
                    name: {
                        title: this.l('Code'),
                        width: '10%'
                    },
                    tenantId: {
                        title: this.l('Default') + '*',
                        width: '10%',
                        list: abp.session.tenantId ? true : false, //this field is visible only for tenants
                        display: (data: JTableFieldOptionDisplayData<ApplicationLanguageListDto>) => {
                            const $span = $('<span></span>');

                            if (data.record.tenantId !== this.appSession.tenantId) {
                                $span.append('<span class="label label-default">' + this.l('Yes') + '</span>');
                            } else {
                                $span.append('<span class="label label-success">' + this.l('No') + '</span>');
                            }

                            return $span;
                        }
                    },
                    creationTime: {
                        title: this.l('CreationTime'),
                        width: '20%',
                        display: (data: JTableFieldOptionDisplayData<ApplicationLanguageListDto>) => moment(data.record.creationTime).format('L')
                    },
                    isEnabled: {
                        title: this.l('IsEnabled'),
                        width: '8%',
                        display: (data: JTableFieldOptionDisplayData<ApplicationLanguageListDto>) => {
                            if (!data.record.isDisabled) {
                                return '<span class="label label-success">' + this.l('Yes') + '</span>';
                            } else {
                                return '<span class="label label-default">' + this.l('No') + '</span>';
                            }
                        }
                    }
                },

                recordsLoaded: (event, data) => {
                    this.defaultLanguageName = data.serverResponse.originalResult.defaultLanguageName;
                    this._$languagesTable
                        .find('[data-language-name=' + this.defaultLanguageName + ']')
                        .addClass('text-bold')
                        .append(' (' + this.l('Default') + ')');
                }
            });

            this.getLanguages();
        };

        initTable();
    }

    getLanguages(): void {
        this._$languagesTable.jtable('load');
    }

    changeTexts(language: ApplicationLanguageListDto): void {
        this._router.navigate(['app/crm/languages', language.name, 'texts']);
    }

    setAsDefaultLanguage(language: ApplicationLanguageListDto): void {
        const input = new SetDefaultLanguageInput();
        input.name = language.name;
        this._languageService.setDefaultLanguage(input).subscribe(() => {
            this.getLanguages();
            this.notify.success(this.l('SuccessfullySaved'));
        });
    }

    deleteLanguage(language: ApplicationLanguageListDto): void {
        this.message.confirm(
            this.l('LanguageDeleteWarningMessage', language.displayName),
            isConfirmed => {
                if (isConfirmed) {
                    this._languageService.deleteLanguage(language.id).subscribe(() => {
                        this.getLanguages();
                        this.notify.success(this.l('SuccessfullyDeleted'));
                    });
                }
            }
        );
    }
}