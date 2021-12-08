/** Core imports */
import { AfterViewInit, Component, ElementRef, EventEmitter, Output, ViewChild } from '@angular/core';

/** Third party imports */
import { catchError } from 'rxjs/operators';
import { throwError as observableThrowError,  Observable } from 'rxjs';

/** Application imports */
import { HtmlHelper } from '@shared/helpers/HtmlHelper';
import { OrganizationUnitDtoListResultDto, MoveOrganizationUnitInput, OrganizationUnitDto, OrganizationUnitServiceProxy } from '@shared/service-proxies/service-proxies';
import { IBasicOrganizationUnitInfo } from '../basic-organization-unit-info';
import { CreateOrEditUnitModalComponent } from '../create-or-edit-unit-modal/create-or-edit-unit-modal.component';
import { IUserWithOrganizationUnit } from '../user-with-organization-unit';
import { IUsersWithOrganizationUnit } from '../users-with-organization-unit';
import { AppPermissions } from '@shared/AppPermissions';
import { PermissionCheckerService } from '@abp/auth/permission-checker.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { MessageService } from '@abp/message/message.service';
import { NotifyService } from '@abp/notify/notify.service';

export interface IOrganizationUnitOnTree extends IBasicOrganizationUnitInfo {
    id: number;
    parent: string | number;
    code: string;
    displayName: string;
    memberCount: number;
    text: string;
    state: any;
}

@Component({
    selector: 'organization-tree',
    templateUrl: './organization-tree.component.html',
    styleUrls: ['./organization-tree.component.less']
})
export class OrganizationTreeComponent implements AfterViewInit {
    @ViewChild('tree') tree: ElementRef;
    @ViewChild('createOrEditOrganizationUnitModal') createOrEditOrganizationUnitModal: CreateOrEditUnitModalComponent;
    @Output() ouSelected = new EventEmitter<IBasicOrganizationUnitInfo>();

    private $tree: JQuery;
    private updatingNode: any;
    permissions = AppPermissions;
    organizationsListHeight = 'calc(100vh - 294px)';

    constructor(
        private organizationUnitService: OrganizationUnitServiceProxy,
        private message: MessageService,
        private notify: NotifyService,
        public permissionChecker: PermissionCheckerService,
        public ls: AppLocalizationService
    ) {}

    totalUnitCount = 0;

    set selectedOu(ou: IOrganizationUnitOnTree) {
        this._selectedOu = ou;
        this.ouSelected.emit(ou);
    }

    private _selectedOu: IOrganizationUnitOnTree;

    ngAfterViewInit(): void {
        const self = this;
        this.$tree = $(this.tree.nativeElement);
        this.getTreeDataFromServer(treeData => {
            this.totalUnitCount = treeData.length;

            const jsTreePlugins = [
                'types',
                'contextmenu',
                'wholerow',
                'sort'
            ];

            if (this.permissionChecker.isGranted(AppPermissions.AdministrationOrganizationUnitsManageOrganizationTree)) {
                jsTreePlugins.push('dnd');
            }

            this.$tree
                .on('changed.jstree', (e, data) => {
                    if (data.selected.length !== 1) {
                        this.selectedOu = null;
                    } else {
                        this.selectedOu = data.instance.get_node(data.selected[0]).original;
                    }
                })
                .on('move_node.jstree', (e, data) => {
                    if (!this.permissionChecker.isGranted(AppPermissions.AdministrationOrganizationUnitsManageOrganizationTree)) {
                        this.$tree.jstree('refresh'); //rollback
                        return;
                    }

                    const parentNodeName = (!data.parent || data.parent === '#')
                        ? this.ls.l('Root')
                        : this.$tree.jstree('get_node', data.parent).original.displayName;

                    this.message.confirm(
                        this.ls.l('OrganizationUnitMoveConfirmMessage', data.node.original.displayName, parentNodeName),
                        this.ls.l('AreYouSure'),
                        isConfirmed => {
                            if (isConfirmed) {
                                const input = new MoveOrganizationUnitInput();
                                input.id = data.node.id;
                                input.newParentId = (!data.parent || data.parent === '#') ? undefined : data.parent;
                                this.organizationUnitService.moveOrganizationUnit(input)
                                    .pipe(catchError(error => {
                                        this.$tree.jstree('refresh'); //rollback
                                        return observableThrowError(error);
                                    }))
                                    .subscribe(() => {
                                        this.notify.success(this.ls.l('SuccessfullyMoved'));
                                        this.reload();
                                    });
                            } else {
                                this.$tree.jstree('refresh'); //rollback
                            }
                        }
                    );
                })
                .jstree({
                    'core': {
                        data: treeData,
                        multiple: false,
                        check_callback: () => true
                    },
                    types: {
                        'default': {
                            'icon': 'fa fa-folder m--font-warning'
                        },
                        'file': {
                            'icon': 'fa fa-file m--font-warning'
                        }
                    },
                    contextmenu: {
                        items: function (node) { return self.contextMenu(node, self); }
                    },
                    sort: function (node1, node2) {
                        if (this.get_node(node2).original.displayName < this.get_node(node1).original.displayName) {
                            return 1;
                        }

                        return -1;
                    },
                    plugins: jsTreePlugins
                });

            this.$tree.on('click', '.ou-text .fa-caret-down', function (e) {
                e.preventDefault();

                const ouId = $(this).closest('.ou-text').attr('data-ou-id');
                setTimeout(() => {
                    self.$tree.jstree('show_contextmenu', ouId);
                }, 100);
            });
        });
    }

    reload(): void {
        this.getTreeDataFromServer(treeData => {
            this.totalUnitCount = treeData.length;
            (<any>this.$tree.jstree(true)).settings.core.data = treeData;
            this.$tree.jstree('refresh');
        });
    }

    private getTreeDataFromServer(callback: (ous: IOrganizationUnitOnTree[]) => void): void {
        this.organizationUnitService.getOrganizationUnits().subscribe((result: OrganizationUnitDtoListResultDto) => {
            const treeData = result.items.map(item => (<IOrganizationUnitOnTree>{
                id: item.id,
                parent: item.parentId ? item.parentId : '#',
                code: item.code,
                displayName: item.displayName,
                memberCount: item.memberCount,
                text: this.generateTextOnTree(item),
                dto: item,
                state: {
                    opened: true
                }
            }));

            callback(treeData);
        });
    }

    private generateTextOnTree(ou: IOrganizationUnitOnTree | OrganizationUnitDto) {
        const itemClass = ou.memberCount > 0 ? ' ou-text-has-members' : ' ou-text-no-members';
        return '<span title="' + ou.code + '" class="ou-text' + itemClass + '" data-ou-id="' + ou.id + '">' + HtmlHelper.encodeText(ou.displayName) + ' (<span class="ou-text-member-count">' + ou.memberCount + '</span>) <i class="fa fa-caret-down text-muted"></i></span>';
    }

    private contextMenu(node: any, self: OrganizationTreeComponent) {
        const canManageOrganizationTree = self.permissionChecker.isGranted(AppPermissions.AdministrationOrganizationUnitsManageOrganizationTree);
        return {
            editUnit: {
                label: self.ls.l('Edit'),
                _disabled: !canManageOrganizationTree,
                action: () => {
                    self.updatingNode = node;
                    self.createOrEditOrganizationUnitModal.show({
                        id: node.id,
                        displayName: node.original.displayName
                    });
                }
            },
            addSubUnit: {
                label: self.ls.l('AddSubUnit'),
                _disabled: !canManageOrganizationTree,
                action: () => {
                    self.addUnit(node.id);
                }
            },
            'delete': {
                label: self.ls.l('Delete'),
                _disabled: !canManageOrganizationTree || node.original.code == '00001',
                action: data => {
                    const instance = $.jstree.reference(data.reference);

                    this.message.confirm(
                        this.ls.l('OrganizationUnitDeleteWarningMessage', node.original.displayName),
                        this.ls.l('AreYouSure'),
                        isConfirmed => {
                            if (isConfirmed) {
                                this.organizationUnitService.deleteOrganizationUnit(node.id).subscribe(() => {
                                    this.selectedOu = null;
                                    this.notify.success(this.ls.l('SuccessfullyDeleted'));
                                    instance.delete_node(node);
                                });
                            }
                        }
                    );
                }
            }
        };
    }

    addUnit(parentId?: number): void {
        this.createOrEditOrganizationUnitModal.show({
            parentId: parentId
        });
    }

    unitCreated(ou: OrganizationUnitDto): void {
        const instance = $.jstree.reference(this.$tree);
        instance.create_node(
            ou.parentId ? instance.get_node(ou.parentId) : '#',
            {
                id: ou.id,
                parent: ou.parentId ? ou.parentId : '#',
                code: ou.code,
                displayName: ou.displayName,
                memberCount: 0,
                text: this.generateTextOnTree(ou),
                state: {
                    opened: true
                }
            });

        this.totalUnitCount += 1;
    }

    unitUpdated(ou: OrganizationUnitDto): void {
        const instance = $.jstree.reference(this.$tree);
        this.updatingNode.original.displayName = ou.displayName;
        instance.rename_node(this.updatingNode, this.generateTextOnTree(ou));
    }

    membersAdded(data: IUsersWithOrganizationUnit): void {
        this.incrementMemberCount(data.ouId, data.userIds.length);
    }

    memberRemoved(data: IUserWithOrganizationUnit): void {
        this.incrementMemberCount(data.ouId, -1);
    }

    incrementMemberCount(ouId: number, incrementAmount: number): void {
        const treeNode = this.$tree.jstree('get_node', ouId);
        treeNode.original.memberCount = treeNode.original.memberCount + incrementAmount;
        this.$tree.jstree('rename_node', treeNode, this.generateTextOnTree(treeNode.original));
    }
}
