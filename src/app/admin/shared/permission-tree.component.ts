import { AfterViewInit, Component, ElementRef, Input } from '@angular/core';
import { PermissionTreeEditModel } from '@app/admin/shared/permission-tree-edit.model';
import includes from 'lodash/includes';
import { FlatPermissionDto } from '@shared/service-proxies/service-proxies';

@Component({
    selector: 'permission-tree',
    template: '<div class="permission-tree"></div>'
})
export class PermissionTreeComponent implements AfterViewInit {

    @Input() set editData(val: PermissionTreeEditModel) {
        if (val) {
            this._editData = val;
            this.refreshTree();
        }
    }

    private $tree: JQuery;
    private _editData: PermissionTreeEditModel;
    private createdTreeBefore;

    constructor(private element: ElementRef) {}

    ngAfterViewInit(): void {
        this.$tree = $(this.element.nativeElement);

        this.refreshTree();
    }

    getGrantedPermissionNames(): string[] {
        if (!this.$tree || !this.createdTreeBefore) {
            return [];
        }

        let permissionNames = [];

        let selectedPermissions = this.$tree.jstree('get_selected', true);
        for (let i = 0; i < selectedPermissions.length; i++) {
            permissionNames.push(selectedPermissions[i].original.id);
        }

        return permissionNames;
    }

    refreshTree(): void {
        let self = this;

        if (this.createdTreeBefore) {
            this.$tree.jstree('destroy');
        }

        this.createdTreeBefore = false;

        if (!this._editData || !this.$tree) {
            return;
        }

        let treeData = this._editData.permissions.map((permission: FlatPermissionDto) => {
            return {
                id: permission.name,
                parent: permission.parentName ? permission.parentName : '#',
                text: permission.displayName,
                state: {
                    opened: true,
                    selected: includes(self._editData.grantedPermissionNames, permission.name)
                }
            };
        });

        this.$tree.jstree({
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
            let parent = self.$tree.jstree('get_parent', node);
            if (parent) {
                selectNodeAndAllParents(parent);
            }
        }

        this.$tree.on('changed.jstree', function (e, data) {
            if (!data.node) {
                return;
            }

            let wasInTreeChangeEvent = inTreeChangeEvent;
            if (!wasInTreeChangeEvent) {
                inTreeChangeEvent = true;
            }

            let childrenNodes;

            if (data.node.state.selected) {
                selectNodeAndAllParents(self.$tree.jstree('get_parent', data.node));

                childrenNodes = $.makeArray(self.$tree.jstree('get_node', data.node).children);
                self.$tree.jstree('select_node', childrenNodes);

            } else {
                childrenNodes = $.makeArray(self.$tree.jstree('get_node', data.node).children);
                self.$tree.jstree('deselect_node', childrenNodes);
            }

            if (!wasInTreeChangeEvent) {
                inTreeChangeEvent = false;
            }
        });
    }
}
