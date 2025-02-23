import { ButtonComponent, Setting } from "obsidian";
import DynamicOutlineSetting from "../settingsOption";
import { htmlDescription } from "../settings";

export default class DynamicHeadingIndentationSetting extends DynamicOutlineSetting {
	public display(): void {
		let restartButton: ButtonComponent;
		const initialToggleValue: boolean =
			this.plugin.settings.dynamicHeadingIndentation;

		new Setting(this.containerEl)
			// .setName("Dynamic heading indentation")
			// .setDesc(
			// 	htmlDescription("Adjusts heading indentation based on the previous heading level for improved visual hierarchy.")
			// )
			.setName("动态标题缩进")
			.setDesc(
				htmlDescription(
					"根据前一个标题的级别调整标题缩进，以改善视觉层次感。"
				)
			)
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
					.setValue(this.plugin.settings.dynamicHeadingIndentation)
					.onChange(async (value) => {
						this.plugin.settings.dynamicHeadingIndentation = value;
						await this.plugin.saveSettings();

						restartButton.setDisabled(value === initialToggleValue);
					});
			});
	}
}
