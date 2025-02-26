/* eslint-disable @typescript-eslint/no-unused-vars */
import DynamicOutlinePlugin from "main";
import { HeadingCache, MarkdownView, Notice, Workspace } from "obsidian";
import OutlineWindow from "./outlineWindow";

export default class OutlineStateManager {
	private static instance: OutlineStateManager;
	private _windows: Map<string, OutlineWindow> = new Map();
	private _plugin: DynamicOutlinePlugin;

	private constructor(plugin: DynamicOutlinePlugin) {
		this._plugin = plugin;
	}

	static initialize(plugin: DynamicOutlinePlugin): OutlineStateManager {
		if (!OutlineStateManager.instance) {
			OutlineStateManager.instance = new OutlineStateManager(plugin);
		}
		return OutlineStateManager.instance;
	}

	static getInstance(): OutlineStateManager {
		if (!OutlineStateManager.instance) {
			throw new Error("OutlineStateManager not initialized");
		}
		return OutlineStateManager.instance;
	}

	getActiveMDView(): MarkdownView | null {
		const workspace: Workspace = this._plugin.app.workspace;
		return workspace.getActiveViewOfType(MarkdownView);
	}

	getWindowInView(view: MarkdownView): OutlineWindow {
		const key = this.getKey(view);
		if (!this._windows.has(key)) {
			this._windows.set(key, new OutlineWindow(this._plugin));
		}
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const window: OutlineWindow = this._windows.get(key)!;
		window.updateView(view);

		return window;
	}

	handleMetadataChanged(): void {
		const mdView = this.getActiveMDView();
		if (!mdView) return;

		const window: OutlineWindow = this.getWindowInView(mdView);
		window.update();
	}

	removeAll(): void {
		this._windows.forEach((window) => window.hide());
		this._windows.clear();
	}

	// Considering the fact that the views that are passed to the button
	// and window constructors are not passed by reference, should we bother
	// to keep a mapping of all the buttons?
	private getKey(view: MarkdownView): string {
		// @ts-ignore:2239
		// The `id` property actually exists in leaves.
		return view.leaf.id;
	}
}
