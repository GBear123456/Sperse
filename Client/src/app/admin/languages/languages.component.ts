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
                        display: (data: JTableFieldOptionDisplayData<ApplicationLanguageListDto>) => {
                            const $span = $('<span></span>');

                            if (this.isGranted('Pages.Administration.Languages.Edit') && data.record.tenantId === this.appSession.tenantId) {
                                $('<button class="btn btn-default btn-xs" title="' + this.l('Edit') + '"><i class="fa fa-edit"></i></button>')
                                    .appendTo($span)
                                    .click(() => {
                                        this.createOrEditLanguageModal.show(data.record.id);
                                    });
                            }

                            if (this.isGranted('Pages.Administration.Languages.ChangeTexts')) {
                                $('<a class="btn btn-default btn-xs" title="' + this.l('ChangeTexts') + '"><i class="fa fa-bars"></i></a>')
                                    .appendTo($span)
                                    .click(() => {
                                        this.changeTexts(data.record);
                                    });
                            }

                            if (this.isGranted('Pages.Administration.Languages.Edit')) {
                                $('<button class="btn btn-default btn-xs" title="' + this.l('SetAsDefaultLanguage') + '"><i class="fa fa-check"></i></button>')
                                    .appendTo($span)
                                    .click(() => {
                                        this.setAsDefaultLanguage(data.record);
                                    });
                            }

                            if (this.isGranted('Pages.Administration.Languages.Delete') && data.record.tenantId === this.appSession.tenantId) {
                                $('<button class="btn btn-default btn-xs" title="' + this.l('Delete') + '"><i class="fa fa-trash-o"></i></button>')
                                    .appendTo($span)
                                    .click(() => {
                                        this.deleteLanguage(data.record);
                                    });
                            }

                            return $span;
                        }
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
        this._router.navigate(['app/admin/languages', language.name, 'texts']);
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