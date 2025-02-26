/* eslint-disable @typescript-eslint/no-unused-vars */
import {
	debounce,
	MarkdownPostProcessorContext,
	Notice,
	Plugin,
} from "obsidian";
import OutlineStateManager from "src/components/outlineStateManager";
import OutlineWindow from "src/components/outlineWindow";
import {
	DEFAULT_SETTINGS,
	DynamicOutlinePluginSettings,
	DynamicOutlineSettingTab,
} from "src/settings/settings";

export const WINDOW_ID = "dynamic-outline";
export const LUCID_ICON_NAME = "list";

export default class DynamicOutlinePlugin extends Plugin {
	private stateManager: OutlineStateManager;
	settings: DynamicOutlinePluginSettings;

	private debounceHandler = debounce((event: Event) => {
		const target = event.target as HTMLElement;
		if (!target?.classList.contains("dynamic-outline-content-container")) {
			const mdView = this.stateManager.getActiveMDView();
			if (mdView) {
				const window: OutlineWindow =
					this.stateManager.getWindowInView(mdView);
				window.highlightCurrentHeading();
			}
		}
	}, 0);

	async onload(): Promise<void> {
		await this.loadSettings();
		this.addSettingTab(new DynamicOutlineSettingTab(this.app, this));
		this.stateManager = OutlineStateManager.initialize(this);

		this.registerEvent(
			this.app.workspace.on("active-leaf-change", () => {
				this.stateManager.handleMetadataChanged();
			})
		);

		// 为了在修改文件内容后更新大纲
		this.registerEvent(
			this.app.metadataCache.on("changed", () => {
				this.stateManager.handleMetadataChanged();
			})
		);

		// this.app.workspace.onLayoutReady(() => {
		// 	const mdView = this.stateManager.getActiveMDView();
		// 	if (mdView) {
		// 		const window: OutlineWindow =
		// 			this.stateManager.getWindowInView(mdView);
		// 		window.toggleShow();
		// 	}
		// });

		activeWindow.document.addEventListener(
			"scroll",
			this.debounceHandler,
			true
		);

		this.registerEvent(
			this.app.metadataCache.on("changed", () => {
				const mdView = this.stateManager.getActiveMDView();
				if (mdView) {
					this.stateManager
						.getWindowInView(mdView)
						.highlightCurrentHeading();
				}
			})
		);

		this.addCommand({
			id: "toggle-dynamic-outline",
			name: "Toggle for current file",
			checkCallback: (checking: boolean) => {
				const mdView = this.stateManager.getActiveMDView();
				if (mdView) {
					if (!checking) {
						const window: OutlineWindow =
							this.stateManager.getWindowInView(mdView);
						window.toggleShow();
					}
					return true;
				}
				return false;
			},
		});
	}

	onunload() {
		this.stateManager.removeAll();
		activeWindow.document.removeEventListener(
			"scroll",
			this.debounceHandler,
			true
		);
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async reloadPlugin() {
		//@ts-ignore:2239
		const plugins = this.app.plugins;
		//@ts-ignore:2239
		const setting = this.app.setting;

		// Don't reload disabled plugins
		if (!plugins.enabledPlugins.has(WINDOW_ID)) return;

		await plugins.disablePlugin(WINDOW_ID);
		await plugins.enablePlugin(WINDOW_ID);
		await setting.openTabById(WINDOW_ID);
		new Notice(`Dynamic Outline has been reloaded`);
	}

	runCommand(commandId: string) {
		//@ts-ignore:2239
		this.app.commands.executeCommandById(commandId);
	}
}
