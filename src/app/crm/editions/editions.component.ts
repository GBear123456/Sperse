import { Component, AfterViewInit, Injector, ViewChild } from '@angular/core';
import { EditionServiceProxy, EditionListDto } from '@shared/service-proxies/service-proxies';
import { AppComponentBase } from '@shared/common/app-component-base';
import { CreateOrEditEditionModalComponent } from './create-or-edit-edition-modal.component';
import { JTableHelper } from '@shared/helpers/JTableHelper';
import { appModuleAnimation } from '@shared/animations/routerTransition';

import * as moment from 'moment';

@Component({
    templateUrl: './editions.component.html',
    styleUrls: ['./editions.component.less'],
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

        let initEditionsTable = () => {
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
                        title: this.l('Actions'),
                        width: '30%',
                        sorting: false,
                        type: 'record-actions',
                        cssClass: 'btn btn-xs btn-primary blue',
                        text: '<i class="fa fa-cog"></i> ' + this.l('Actions') + ' <span class="caret"></span>',
                        items: [{
                            text: this.l('Edit'),
                            visible: (): boolean => {
                                return self.isGranted('Pages.Editions.Edit');
                            },
                            action(data) {
                                self.createOrEditEditionModal.show(data.record.id);
                            }
                        }, {
                            text: this.l('Delete'),
                            visible: (): boolean => {
                                return self.isGranted('Pages.Editions.Delete');
                            },
                            action(data) {
                                self.deleteEdition(data.record);
                            }
                        }]
                    },
                    displayName: {
                        title: self.l('EditionName'),
                        width: '35%'
                    },
                    creationTime: {
                        title: self.l('CreationTime'),
                        width: '35%',
                        display: (data: JTableFieldOptionDisplayData<EditionListDto>) => {
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
        this.createOrEditEditionModal.show();
    };

    deleteEdition(edition: EditionListDto): void {
        this.message.confirm(
            this.l('EditionDeleteWarningMessage', edition.displayName),
            isConfirmed => {
                if (isConfirmed) {
                    this._editionService.deleteEdition(edition.id).subscribe(() => {
                        this.getEditions();
                        this.notify.success(this.l('SuccessfullyDeleted'));
                    });
                }
            }
        );
    }
}
