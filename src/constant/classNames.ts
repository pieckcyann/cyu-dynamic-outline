// classNames.ts

export interface TreeItem {
	root: HTMLDivElement;
	self: HTMLDivElement;
	children: HTMLDivElement;
}

// 页面布局相关
export const TREE_ITEM = "tree-item";
export const TREE_ITEM_COLLAPSED = "is-collapsed";
export const TREE_ITEM_SELF = "tree-item-self";
export const TREE_ITEM_CHILDREN = "tree-item-children";
