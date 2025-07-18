/* eslint-disable @typescript-eslint/no-unused-vars */
import DynamicOutlinePlugin from "main";
import { HeadingCache, MarkdownView, TFile, htmlToMarkdown } from "obsidian";

export default class DynamicHeadings {
	private _plugin: DynamicOutlinePlugin;
	private _view: MarkdownView;

	constructor(plugin: DynamicOutlinePlugin, view: MarkdownView) {
		this._plugin = plugin;
		this._view = view;
	}

	get headings(): HeadingCache[] {
		return this._getHeadingsForView(this._view);
	}

	updateView(view: MarkdownView): void {
		this._view = view;
	}

	private _getHeadingsForView(view: MarkdownView): HeadingCache[] {
		const file: TFile | null | undefined = view?.file;
		if (!file) return [];

		const fileMetadata =
			this._plugin.app.metadataCache.getFileCache(file) || {};
		const fileHeadings: HeadingCache[] = fileMetadata.headings ?? [];

		const cleanedHeadings = this._cleanupHeadings(fileHeadings);

		return cleanedHeadings;
	}

	private _cleanupHeadings(headings: HeadingCache[]) {
		const cleanMarkdown = (inputHeading: string) => {
			// return htmlToMarkdown(inputHeading)
			// 	.replaceAll("\\*", "")
			// 	.replaceAll("\\_", "")
			// 	.replaceAll("\\`", "")
			// 	.replaceAll("\\<", "")
			// 	.replaceAll("==", "")
			// 	.replaceAll("~~", "");
			return inputHeading.replaceAll(/\\([*`_<>])/g, "$1");
		};

		const cleanedHeadings: HeadingCache[] = headings;
		cleanedHeadings.forEach((headingData) => {
			let cleanedHeading: string = headingData.heading;
			cleanedHeading = cleanMarkdown(cleanedHeading);
			// cleanedHeading = extractLinkText(cleanedHeading);
			headingData.heading = cleanedHeading;
		});

		return cleanedHeadings;
	}
}
