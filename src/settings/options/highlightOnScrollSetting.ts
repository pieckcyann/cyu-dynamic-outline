import { ButtonComponent, Setting } from "obsidian";
import { htmlDescription } from "../settings";
import DynamicOutlineSetting from "../settingsOption";

export default class HighlightOnScrollSetting extends DynamicOutlineSetting {
	public display(): void {
		let restartButton: ButtonComponent;
		const initialToggleValue: boolean =
			this.plugin.settings.highlightCurrentHeading;

		new Setting(this.containerEl)
			// .setName("Highlight active heading")
			// .setDesc(
			// 	htmlDescription(
			// 		`Highlight current outline heading while scrolling down the file.`
			// 	)
			// )
			.setName("高亮当前标题")
			.setDesc(htmlDescription(`在滚动文件时高亮当前大纲标题。`))
			.addButton((button) => {
				restartButton = button;
				// button.setButtonText("Reload plugin");
				// button.setTooltip("Requires a plugin reload to take effect.");
				button.setButtonText("重新加载插件");
				button.setTooltip("需要重新加载插件才能生效。");
				button.setDisabled(true);
				button.setClass("dynamic-outline-reload");
				button.setCta();

				button.onClick(() => {
					this.plugin.reloadPlugin();
				});
			})
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.highlightCurrentHeading)
					.onChange(async (value) => {
						this.plugin.settings.highlightCurrentHeading = value;
						await this.plugin.saveSettings();

						restartButton.setDisabled(value === initialToggleValue);
					});
			});
	}
}
