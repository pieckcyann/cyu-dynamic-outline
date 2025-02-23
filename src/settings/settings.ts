/* eslint-disable @typescript-eslint/no-unused-vars */
import DynamicOutlinePlugin from "main";
import { App, PluginSettingTab, sanitizeHTMLToDom, Setting } from "obsidian";
import HighlightOnScrollSetting from "./options/highlightOnScrollSetting";
import WindowLocationSetting from "./options/windowLocationSetting";
import DynamicHeadingIndentationSetting from "./options/dynamicHeadingIndentationSetting";

export { DEFAULT_SETTINGS, DynamicOutlineSettingTab };
export type { DynamicOutlinePluginSettings };

interface DynamicOutlinePluginSettings {
	dynamicHeadingIndentation: boolean;
	highlightCurrentHeading: boolean;
	minimumHeadings: number;
	toggleAutomatically: boolean;
	contentOverlap: string;
	toggleOnHover: boolean;
	windowLocation: string;
}

const DEFAULT_SETTINGS: DynamicOutlinePluginSettings = {
	dynamicHeadingIndentation: true,
	highlightCurrentHeading: true,
	minimumHeadings: 1,
	toggleAutomatically: false,
	contentOverlap: "allow",
	toggleOnHover: false,
	windowLocation: "right",
};

export function htmlDescription(text: string): DocumentFragment {
	const desc: DocumentFragment = sanitizeHTMLToDom(text);
	return desc;
}

class DynamicOutlineSettingTab extends PluginSettingTab {
	plugin: DynamicOutlinePlugin;

	constructor(app: App, plugin: DynamicOutlinePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName(htmlDescription("窗口行为"))
			.setHeading()
			.setDesc(
				// "Customize the visibility and behavior of the outline window."
				"自定义大纲窗口的可见性和行为。"
			);

		// new Setting(containerEl)
		// 	.setName("TODO: Hide (don't show?) when not enough space")
		// 	.setDesc(
		// 		'Also will not trigger the "Toggle Automatically" setting if the window is too narrow.'
		// 	)
		// 	.addToggle(() => {});
		// new Setting(containerEl)
		// 	.setName("TODO: Hide on jump")
		// 	.setDesc("Close the window when you jump to a heading.")
		// 	.addToggle(() => {});
		// new Setting(containerEl)
		// 	.setName("TODO: Hide automatically in view")
		// 	.setDesc(
		// 		"Choose when the outline window should appear in different views."
		// 	)
		// 	.addDropdown((dropdown) => {
		// 		dropdown
		// 			.addOption("never", "Never")
		// 			.addOption("editing", "Editing view")
		// 			.addOption("reading", "Reading view");
		// 	});

		new DynamicHeadingIndentationSetting(
			this.plugin,
			containerEl
		).display();
		new WindowLocationSetting(this.plugin, containerEl).display();
	}
}
