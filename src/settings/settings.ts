/* eslint-disable @typescript-eslint/no-unused-vars */
import DynamicOutlinePlugin from "main";
import { App, PluginSettingTab, sanitizeHTMLToDom, Setting } from "obsidian";
import WindowLocationSetting from "./options/windowLocationSetting";

export { DEFAULT_SETTINGS, DynamicOutlineSettingTab };
export type { DynamicOutlinePluginSettings };

interface DynamicOutlinePluginSettings {
	minimumHeadings: number;
	contentOverlap: string;
	windowLocation: string;
}

const DEFAULT_SETTINGS: DynamicOutlinePluginSettings = {
	minimumHeadings: 1,
	contentOverlap: "allow",
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
		new WindowLocationSetting(this.plugin, containerEl).display();
	}
}
