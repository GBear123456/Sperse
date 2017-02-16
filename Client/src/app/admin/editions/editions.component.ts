import { Component, AfterViewInit, Injector, ViewEncapsulation, ViewChild } from '@angular/core';
import { EditionServiceProxy, EditionListDto } from '@shared/service-proxies/service-proxies';
import { AppComponentBase } from '@shared/common/app-component-base';
import { Observable } from 'rxjs/Observable';
import { CreateOrEditEditionModalComponent } from './create-or-edit-edition-modal.component';
import { JTableHelper } from '@shared/helpers/JTableHelper';
import { appModuleAnimation } from '@shared/animations/routerTransition';

import * as moment from "moment";

@Component({
    templateUrl: "./editions.component.html",
    styleUrls: ["./editions.component.less"],
    animations: [appModuleAnimation()]
})
export class EditionsComponent extends AppComponentBase implements AfterViewInit {

    @ViewChild('createOrEditEditionModal') createOrEditEditionModal: CreateOrEditEditionModalComponent;

    private _$editionsTable: JQuery;
    loading: boolean = false;

    constructor(
        injector: Injector,
        private _editionService: EditionServiceProxy
    ) {
        super(injector);
    }

    ngAfterViewInit(): void {
        let self = this;

        var initEditionsTable = () => {
            self._$editionsTable = $('#EditionsTable');

            self._$editionsTable.jtable({

                title: self.l('Editions'),

                actions: {
                    listAction(postData, jtParams: JTableParams) {
                        return JTableHelper.toJTableListAction(self._editionService.getEditions());
                    }
                },

                fields: {
                    id: {
                        key: true,
                        list: false
                    },
                    actions: {
                        title: self.l('Actions'),
                        width: '30%',
                        display: function (data) {
                            var $span = $('<span></span>');

                            if (self.permission.isGranted("Pages.Editions.Edit")) {
                                $('<button class="btn btn-default btn-xs" title="' + self.l('Edit') + '"><i class="fa fa-edit"></i></button>')
                                    .appendTo($span)
                                    .click(function () {
                                        self.createOrEditEditionModal.show(data.record.id);
                                    });
                            }

                            if (self.permission.isGranted("Pages.Editions.Delete")) {
                                $('<button class="btn btn-default btn-xs" title="' + self.l('Delete') + '"><i class="fa fa-trash-o"></i></button>')
                                    .appendTo($span)
                                    .click(function () {
                                        self.deleteEdition(data.record);
                                    });
                            }

                            return $span;
                        }
                    },
                    displayName: {
                        title: self.l('EditionName'),
                        width: '35%'
                    },
                    creationTime: {
                        title: self.l('CreationTime'),
                        width: '35%',
                        display: function (data) {
                            return moment(data.record.creationTime).format('L');
                        }
                    }
                }

            });

            self.getEditions();
        };

        initEditionsTable();
    }

    getEditions(): void {
        this._$editionsTable.jtable('load');
    }

    createEdition(): void {
        let self = this;
        self.createOrEditEditionModal.show();
    };

    deleteEdition(edition: EditionListDto): void {
        let self = this;
        self.message.confirm(
            self.l('EditionDeleteWarningMessage', edition.displayName),
            function (isConfirmed) {
                if (isConfirmed) {
                    self._editionService.deleteEdition(edition.id).subscribe((resul) => {
                        self.getEditions();
                        self.notify.success(self.l('SuccessfullyDeleted'));
                    });
                }
            }
        );
    }
}