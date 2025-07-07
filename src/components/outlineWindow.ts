/* eslint-disable @typescript-eslint/no-unused-vars */
import DynamicOutlinePlugin, { WINDOW_ID } from "main";
import { HeadingCache, MarkdownView, Notice } from "obsidian";
import OutlineHeadings from "./outlineHeadings";
import DynamicLiElement from "./outlineLiElement";
import OutlineStateManager from "./outlineStateManager";
import * as fuzzysort from "fuzzysort";
import {
	TREE_ITEM,
	TREE_ITEM_CHILDREN,
	TREE_ITEM_COLLAPSED_ICON,
	TREE_ITEM_ICON,
	TREE_ITEM_SELF,
} from "src/constant/classNames";

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

		// 先删除
		this._containerEl.findAll(".highlight").map((h) => {
			h.classList.remove("highlight");
		});

		const scrollOffset = 5;

		const currentScrollPosition: number =
			this._view.currentMode.getScroll();

		// TODO: Should cache it and not call every time. (?)
		const headings = this.getHeadings();

		const oneHeadings: HeadingCache[] = headings.filter(
			(h) => h.level === 1
		);

		const closestIndex1: number = binarySearchClosestHeading(
			oneHeadings,
			currentScrollPosition + scrollOffset
		);

		const allH1Elements = this._containerEl.findAll(
			`.${TREE_ITEM_SELF}.heading-1`
		);

		allH1Elements.forEach((h1, index) => {
			h1.classList.toggle("highlight", index === closestIndex1);
		});

		const twoHeadings: HeadingCache[] = headings.filter(
			(h) => h.level === 2
		);

		const closestIndex2: number = binarySearchClosestHeading(
			twoHeadings,
			currentScrollPosition + scrollOffset
		);

		// TODO: Should cache this thing and not call it every time. (?)
		const h2Roots = this._containerEl.findAll(`.${TREE_ITEM}.heading-2`);
		const h2Selfs = this._containerEl.findAll(
			`.${TREE_ITEM_SELF}.heading-2`
		);
		const h2Children = h2Roots[closestIndex2].find(
			`.${TREE_ITEM_CHILDREN}`
		);

		h2Selfs.forEach((h2, index) => {
			h2.classList.toggle("highlight", index === closestIndex2);
		});

		// 将 headings 分组
		const threeHeadings: HeadingCache[] = [];
		let h2Count = 0;
		let h3start = false;

		for (let i = 0; i < headings.length; i++) {
			const heading = headings[i];

			// 发现目标 H2
			if (heading.level === 2) {
				h2Count++;
				if (h2Count - 1 === closestIndex2) {
					h3start = true; // 开始收集 h3
					continue;
				}
				if (h3start) break; // 碰到新的 H2，停止收集
			}

			// 只收集 H3，遇到其他层级停止
			if (h3start) {
				if (heading.level === 3) {
					threeHeadings.push(heading);
				} else {
					break;
				}
			}
		}

		const closestIndex3: number = binarySearchClosestHeading(
			threeHeadings,
			currentScrollPosition + scrollOffset
		);

		const allH3Elements = h2Children.findAll(
			`.${TREE_ITEM_SELF}.heading-3`
		);

		allH3Elements.forEach((h3, index) => {
			h3.classList.toggle("highlight", index === closestIndex3);
		});

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
		const treeItemRoot: HTMLDivElement | null = this._containerEl.find(
			".dynamic-outline-content-container"
		) as HTMLDivElement;
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

		let isHasH1Heading = false;

		headings.forEach((heading) => {
			if (heading.level === 1) {
				// 遇到 H1，先把之前的 currentGroup 存起来（如果有内容的话）
				if (currentGroup.length) {
					groupedHeadings.push(currentGroup);
				}

				// H1 独立成一组
				groupedHeadings.push([heading]);

				// 清空 currentGroup，防止 H1 误入后续 H2-H6 的组
				currentGroup = [];

				isHasH1Heading = true;
				return;
			}

			if (heading.level === 2) {
				// 遇到新的 H2，把之前的 currentGroup 存进去（如果有内容的话）
				if (currentGroup.length) groupedHeadings.push(currentGroup);

				// 重新创建 H2 组
				currentGroup = [heading];
			} else {
				currentGroup.push(heading);
			}
		});

		// 确保最后的 currentGroup 被加入
		if (currentGroup.length) groupedHeadings.push(currentGroup);

		let lastH1Element: HTMLDivElement | null;
		let currH1Element: HTMLDivElement | null;

		if (isHasH1Heading) {
			groupedHeadings.forEach((headings) => {
				if (headings[0].level === 1) {
					// 创建新的 H1 容器，并存储
					currH1Element = dynamicLi.createTreeItem(headings[0]).root;
					treeItemRoot.append(currH1Element);
				}

				if (lastH1Element != currH1Element) {
					lastH1Element = currH1Element;
				}

				if (headings[0].level === 2 && currH1Element) {
					const h2Element = dynamicLi.createItemElement(headings);
					if (!h2Element) return;

					const self = currH1Element?.querySelector(
						`.${TREE_ITEM_SELF}`
					);

					const children = currH1Element?.querySelector(
						`.${TREE_ITEM_CHILDREN}`
					);
					if (!children || !self) return;

					children.append(h2Element);

					if (
						children.innerHTML &&
						!self.find(`.${TREE_ITEM_ICON}`)
					) {
						const icon = createEl("div", {
							cls: [TREE_ITEM_ICON, TREE_ITEM_COLLAPSED_ICON],
						});
						const svgString =
							'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon right-triangle"><path d="M3 8L12 17L21 8"></path></svg>';
						icon.insertAdjacentHTML("afterbegin", svgString);
						self.prepend(icon);
					}
				}
			});
		} else {
			groupedHeadings.forEach((headings) => {
				const h2Element = dynamicLi.createItemElement(headings);
				if (!h2Element) return;
				treeItemRoot.append(h2Element);
			});
		}

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
