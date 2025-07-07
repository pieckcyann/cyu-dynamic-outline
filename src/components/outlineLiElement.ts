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
	TREE_ITEM_COLLAPSED_ICON,
	TREE_ITEM_ICON,
	TREE_ITEM_SELF_INNER,
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
		const self = root.querySelector(`.${TREE_ITEM_SELF}`) as HTMLDivElement;
		const children = root.querySelector(
			`.${TREE_ITEM_CHILDREN}`
		) as HTMLDivElement;
		// const children = this.createTreeItem(headings[0]).children;
		// let curRoot: HTMLDivElement | null = null; // 用来追踪当前的嵌套

		this._setupEventListener(self, headings[0]);

		headings.forEach((heading, index) => {
			if (index === 0) return;
			const child = this.createTreeItem(heading);
			children?.append(child.root);
		});

		if (children.innerHTML) {
			const icon = createEl("div", {
				cls: [TREE_ITEM_ICON, TREE_ITEM_COLLAPSED_ICON],
			});
			const svgString =
				'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon right-triangle"><path d="M3 8L12 17L21 8"></path></svg>';
			icon.insertAdjacentHTML("afterbegin", svgString);
			self.prepend(icon);
		}

		return root;
	}

	public createTreeItem(heading: HeadingCache): TreeItem {
		const extractLinkText = (inputHeading: string) => {
			return (
				inputHeading
					// Extract markdown link [text](link) text
					.replace(/\[([^\]]+)\]\(.*?\)/g, "$1")
					// Extract wikilink [[link|text]] text
					.replace(/\[\[([^\]]+)\|([^\]]+)\]\]/g, "$2")
					// Extact another wikilink [[text]] text
					.replace(/\[\[([^\]]+)\]\]/g, "$1")
			);
		};

		const treeItem = createEl("div", {
			cls: [TREE_ITEM, `heading-${heading.level}`],
			attr: {
				"data-heading-line": heading.position.start.line,
			},
		});

		const TreeItemSelfInner = createEl("div", {
			cls: TREE_ITEM_SELF_INNER,
			text: extractLinkText(heading.heading),
		});

		// 检测当前标题是否是外/内链
		const internal_link_class = /\[\[([^\]]+)\]\]/.test(heading.heading)
			? "inner-internal-link"
			: "";

		const external_link_class = /\[([^\]]+)\]\(.*?\)/.test(heading.heading)
			? "inner-external-link"
			: "";

		const treeItemSelf = createEl("div", {
			cls: [
				TREE_ITEM_SELF,
				TREE_ITEM_COLLAPSED,
				`heading-${heading.level}`,
				internal_link_class,
				external_link_class,
			],
		});

		treeItemSelf.append(TreeItemSelfInner);

		if (external_link_class) {
			const treeItemLinkIcon = createEl("div", {
				cls: external_link_class,
			});
			treeItemSelf.append(treeItemLinkIcon);
		}

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
