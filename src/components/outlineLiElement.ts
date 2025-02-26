/* eslint-disable @typescript-eslint/no-unused-vars */
import DynamicOutlinePlugin from "main";
import { HeadingCache, MarkdownView, Notice } from "obsidian";
import OutlineStateManager from "./outlineStateManager";
import {
	TREE_ITEM,
	TREE_ITEM_COLLAPSED,
	TREE_ITEM_CHILDREN,
	TREE_ITEM_SELF,
	TreeItem,
} from "src/constant/classNames";

export default class DynamicLiElement {
	private _plugin: DynamicOutlinePlugin;
	private _view: MarkdownView;
	// private _stateManager: OutlineStateManager;

	constructor(plugin: DynamicOutlinePlugin, view: MarkdownView) {
		this._plugin = plugin;
		this._view = view;
		// this._stateManager = OutlineStateManager.getInstance();
	}

	public createItemElement(headings: HeadingCache[]): HTMLDivElement | null {
		const root = this.createTreeItem(headings[0]).root;
		// const children = this.createTreeItem(headings[0]).children;
		const children = root.querySelector(`.${TREE_ITEM_CHILDREN}`);
		// let curRoot: HTMLDivElement | null = null; // 用来追踪当前的嵌套

		this._setupEventListener(root, headings[0]);

		headings.forEach((heading, index) => {
			if (index === 0) return;
			const child = this.createTreeItem(heading);
			children?.append(child.root);
		});

		return root;
	}

	public createTreeItem(heading: HeadingCache): TreeItem {
		const treeItem = createEl("div", {
			cls: [TREE_ITEM, `heading-${heading.level}`],
			attr: {
				"data-heading-line": heading.position.start.line,
			},
		});

		const treeItemSelf = createEl("div", {
			cls: [
				TREE_ITEM_SELF,
				TREE_ITEM_COLLAPSED,
				`heading-${heading.level}`,
			],
			text: heading.heading,
		});

		const treeItemChildren = createEl("div", {
			cls: TREE_ITEM_CHILDREN,
		});

		treeItem.append(treeItemSelf);
		treeItem.append(treeItemChildren);

		return {
			root: treeItem,
			self: treeItemSelf,
			children: treeItemChildren,
		};
	}

	public updateLiElementLine(
		liElement: HTMLDivElement,
		heading: HeadingCache
	): void {
		liElement.setAttribute(
			"data-heading-line",
			heading.position.start.line.toString()
		);
		this._setupEventListener(liElement, heading);
	}

	// TODO: the highlighted index should be on the top (scrollBlock="start")
	private _setupEventListener(
		itemSelf: HTMLDivElement,
		heading: HeadingCache
	) {
		itemSelf.onclick = () => {
			if (!this._view.file) return;

			this._view.leaf.openFile(this._view.file, {
				eState: { line: heading.position.start.line },
			});

			setTimeout(() => {
				this._view.currentMode.applyScroll(heading.position.start.line);
			}, 0);

			// 可能应该有一个更好的选项。
			this._plugin.runCommand("editor:focus");
		};
	}
}
