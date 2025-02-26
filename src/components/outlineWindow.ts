/* eslint-disable @typescript-eslint/no-unused-vars */
import DynamicOutlinePlugin, { WINDOW_ID } from "main";
import { HeadingCache, MarkdownView, Notice } from "obsidian";
import OutlineHeadings from "./outlineHeadings";
import DynamicLiElement from "./outlineLiElement";
import OutlineStateManager from "./outlineStateManager";
import * as fuzzysort from "fuzzysort";
import { TREE_ITEM, TREE_ITEM_SELF } from "src/constant/classNames";

export default class OutlineWindow {
	public static hideTimeout: NodeJS.Timeout | null = null;

	private _stateManager: OutlineStateManager;
	private _plugin: DynamicOutlinePlugin;
	private _view: MarkdownView;
	private _containerEl: HTMLDivElement;
	private _dynamicHeadings: OutlineHeadings;
	private _latestHeadings: HeadingCache[] = [];
	private _pinned = false;

	constructor(plugin: DynamicOutlinePlugin) {
		this._plugin = plugin;
		// this._view = view;
		this._stateManager = OutlineStateManager.getInstance();
		this._containerEl = this.createElement();
		this._dynamicHeadings = new OutlineHeadings(this._plugin, this._view); // !

		this.setupEventListeners();

		// this._plugin.app.workspace.onLayoutReady(() => {});
	}

	get visible(): boolean {
		const windowInView: HTMLElement | null =
			this._view.containerEl.querySelector(`#${WINDOW_ID}`);
		return !!windowInView;
	}

	get pinned(): boolean {
		return this._pinned;
	}

	set pinned(value: boolean) {
		this._pinned = value;

		if (!value) {
			this.hide();
		}
	}

	toggleShow(): void {
		const window = this._stateManager.getWindowInView(this._view);

		if (window.visible) {
			window.hide();
		} else {
			window.show({
				scrollBlock: "start",
			});
			window.pinned = true;
		}
	}

	private setupEventListeners() {
		// if (this._plugin.settings.toggleOnHover) {
		this._plugin.registerDomEvent(this._containerEl, "mouseenter", () =>
			this.handleMouseEnter()
		);
		this._plugin.registerDomEvent(this._containerEl, "mouseleave", () =>
			this.handleMouseLeave()
		);
		// }
	}

	private getVisibleLiItems(): Array<HTMLElement> {
		return Array.from(
			// this._containerEl.querySelectorAll("li:not(.outline-item-hidden")
			this._containerEl.querySelectorAll(
				`.${TREE_ITEM_SELF}:not(.outline-item-hidden)`
			)
		);
	}

	private handleMouseEnter(): void {
		this.clearHideTimeout();

		const itemList: Array<HTMLElement> = this.getVisibleLiItems();
		itemList.forEach((item) => {
			item.classList.remove("hovered");
		});
	}

	private handleMouseLeave(): void {
		if (!this.pinned) {
			OutlineWindow.hideTimeout = setTimeout(() => {
				this.hide();
			}, 100);
		}
	}

	public getContainerElement(): HTMLDivElement {
		return this._containerEl;
	}

	public clearHideTimeout(): void {
		if (OutlineWindow.hideTimeout) {
			clearTimeout(OutlineWindow.hideTimeout);
			OutlineWindow.hideTimeout = null;
		}
	}

	private createElement(): HTMLDivElement {
		const mainElement: HTMLDivElement = createEl("div", {
			attr: {
				id: "dynamic-outline",
			},
		});

		const contentElement: HTMLDivElement = createEl("div", {
			cls: "dynamic-outline-content-container",
		});
		contentElement.createEl("div", { cls: TREE_ITEM });
		mainElement.appendChild(contentElement);

		return mainElement;
	}

	private checkForObstructions(): void {
		// Check for Editing Toolbar at the top of the screen
		const editingToolbar: HTMLElement | null = document.getElementById(
			"cMenuToolbarModalBar"
		);
		const isTop: boolean =
			editingToolbar !== null && editingToolbar.classList.contains("top");

		this._containerEl.classList.toggle("obstruction-top", isTop);
	}

	private checkForLocation(): void {
		this._containerEl.classList.toggle(
			"location-left",
			this._plugin.settings.windowLocation === "left"
		);
	}

	removeHovered(): void {
		const itemList = this.getVisibleLiItems();
		itemList.forEach((liElement) => {
			liElement.classList.remove("hovered");
		});
	}

	updateView(view: MarkdownView) {
		this._view = view;
		this._dynamicHeadings.updateView(view);
	}

	highlightCurrentHeading(scrollBlock: ScrollLogicalPosition = "nearest") {
		const binarySearchClosestHeading = (
			headings: HeadingCache[],
			targetLine: number
		): number => {
			let closestIndex = 0; // 默认值为-1，表示未找到合适的标题
			let low = 0;
			let high = headings.length - 1;

			// 使用二分查找来找到第一个比目标行号小的标题
			while (low <= high) {
				const mid = Math.floor((low + high) / 2);
				const midLine = headings[mid].position.start.line;

				// 如果当前标题的行号小于目标行号，更新closestIndex并继续查找右侧区域
				if (midLine < targetLine) {
					closestIndex = mid; // 记录当前标题的索引
					low = mid + 1; // 继续在右半部分查找
				} else {
					high = mid - 1; // 在左半部分查找
				}
			}

			// 返回第一个比目标行号小的标题索引
			return closestIndex;
		};

		const currentScrollPosition: number =
			this._view.currentMode.getScroll();

		// TODO: Should cache it and not call every time. (?)
		const headings = this.getHeadings();
		const twoHeadings: HeadingCache[] = headings.filter(
			(h) => h.level === 2
		);

		if (twoHeadings.length == 0) return;

		const closestIndex2: number = binarySearchClosestHeading(
			twoHeadings,
			currentScrollPosition + 2.5
		);

		// TODO: Should cache this thing and not call it every time. (?)
		const allH2Elements = this._containerEl.findAll(
			`.${TREE_ITEM_SELF}.heading-2`
		);

		allH2Elements.forEach((h2, index) =>
			h2.classList.toggle("highlight", index === closestIndex2)
		);

		// 将 headings 分组
		const threeHeadings: HeadingCache[] = [];

		for (let i = closestIndex2 + 1; i < headings.length; i++) {
			const heading = headings[i];
			if (heading.level === 3) {
				threeHeadings.push(heading);
			} else break;
		}

		console.debug(threeHeadings);

		const closestIndex3: number = binarySearchClosestHeading(
			threeHeadings,
			currentScrollPosition
		);

		const allH3Elements = this._containerEl.findAll(
			`.${TREE_ITEM_SELF}.heading-3`
		);

		allH3Elements.forEach((h3, index) =>
			h3.classList.toggle(
				"highlight",
				index + closestIndex2 === closestIndex3
			)
		);

		// Check if there is a highlighted heading, and scroll to it
		// 检查是否有突出显示的标题，并滚动到它
		const element: HTMLElement | null = this._containerEl.querySelector(
			`.${TREE_ITEM_SELF}.highlight`
		);
		element?.scrollIntoView({
			behavior: "instant" as ScrollBehavior,
			block: scrollBlock,
		});
	}

	getHeadings(): HeadingCache[] {
		return this._dynamicHeadings.headings;
	}

	update(): void {
		const arraysAreEqual = (
			a: HeadingCache[],
			b: HeadingCache[]
		): boolean => {
			return (
				a.length === b.length &&
				a.every(
					(item, index) =>
						item.heading === b[index].heading &&
						item.level === b[index].level
				)
			);
		};

		// It should always be present as the .containerEl is always created (is it?).
		const treeItemRoot: HTMLDivElement | null = this._containerEl;
		if (!treeItemRoot) return;

		const dynamicLi: DynamicLiElement = new DynamicLiElement(
			this._plugin,
			this._view
		);
		const headings: HeadingCache[] = this.getHeadings();

		// Check if the headings are the same as before and, if so,
		// update only the positions of the li elements.
		// 检查标题是否与之前相同，如果是，
		// 仅更新 li 元素的位置。
		if (
			headings.length > 0 &&
			arraysAreEqual(headings, this._latestHeadings)
		) {
			const currentLi = treeItemRoot.querySelectorAll(
				`.${TREE_ITEM_SELF}`
			);
			currentLi.forEach((liElement: HTMLDivElement, index) => {
				dynamicLi.updateLiElementLine(liElement, headings[index]);
			});
			return;
		}

		this._latestHeadings = headings;
		treeItemRoot.empty();

		// 将 headings 分组
		const groupedHeadings: HeadingCache[][] = [];
		let currentGroup: HeadingCache[] = [];

		headings.forEach((heading) => {
			if (heading.level === 2) {
				if (currentGroup.length) groupedHeadings.push(currentGroup);
				currentGroup = [heading];
			} else {
				currentGroup.push(heading);
			}
		});

		if (currentGroup.length) groupedHeadings.push(currentGroup);

		groupedHeadings.forEach((headings) => {
			const liElement = dynamicLi.createItemElement(headings);
			if (!liElement) return;
			treeItemRoot.append(liElement);
		});

		// new Notice(`${treeItemRoot.outerHTML}`);

		this.highlightCurrentHeading();

		const window = this._stateManager.getWindowInView(this._view);
		window.show({
			scrollBlock: "start",
		});
		window.pinned = true;
	}

	show(options?: { scrollBlock?: ScrollLogicalPosition }): void {
		if (this.visible) return;

		this.checkForObstructions();
		this.checkForLocation();
		this.update();
		this._view.contentEl.append(this._containerEl);

		this.highlightCurrentHeading(options?.scrollBlock);
	}

	// TODO: should trigger clearInput() for the search field
	hide(): void {
		if (!this.visible) return;

		// Remove the container.
		this._containerEl.remove();

		// Remove the "hovered" effect on each heading.
		this.removeHovered();

		// Call "Focus on last note" Obsidian built-in method
		this._plugin.runCommand("editor:focus");

		// Remove optional pinning.
		// if (this._plugin.settings.toggleOnHover) {
		this.pinned = false;
		// }
	}

	toggle(): void {
		this.visible ? this.hide() : this.show();
	}
}
