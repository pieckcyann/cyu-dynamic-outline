import { ButtonComponent, Setting } from "obsidian";
import { htmlDescription } from "../settings";
import DynamicOutlineSetting from "../settingsOption";

export default class WindowLocationSetting extends DynamicOutlineSetting {
	public display(): void {
		let restartButton: ButtonComponent;
		const initialToggleValue: string = this.plugin.settings.windowLocation;

		new Setting(this.containerEl)
			.setName("Outline location")
			// .setDesc(
			// 	htmlDescription(
			// 		`Set the location for both the window and the button.`
			// 	)
			// )
			.setDesc(htmlDescription(`设置窗口和按钮的位置。`))
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
			.addDropdown((dropdown) =>
				dropdown
					.addOption("right", "Right")
					.addOption("left", "Left")
					.setValue(this.plugin.settings.windowLocation)
					.onChange(async (value) => {
						this.plugin.settings.windowLocation = value;
						await this.plugin.saveSettings();

						restartButton.setDisabled(value === initialToggleValue);
					})
			);
	}
}
