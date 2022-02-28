import "./main.css";

import {
    FileSystemAdapter,
    Notice,
    Platform,
    Plugin,
    PluginSettingTab,
    Setting
} from "obsidian";
import { PluginSettings } from "./@types";

const DEFAULT_SETTINGS: PluginSettings = {
    mobile: false,
    desktop: false
};

export default class VaultPicker extends Plugin {
    settings: PluginSettings;
    async onload() {
        this.settings = { ...DEFAULT_SETTINGS, ...(await this.loadData()) };
        this.addSettingTab(new VaultPickerSettings(this));
        this.app.workspace.onLayoutReady(async () => {
            this.tryToReset();
        });
    }
    tryToReset() {
        try {
            if (Platform.isMobile && this.settings.mobile) {
                localStorage.removeItem("mobile-selected-vault");
            } else if (this.settings.desktop) {
                const fs = require("fs");
                const path = require("path");
                const { remote } = require("electron");
                const { app } = remote;

                const data = fs.readFileSync(
                    path.join(app.getPath("userData"), "obsidian.json"),
                    { encoding: "utf8" }
                );

                const parsed = JSON.parse(data ?? {});
                if (!parsed || !parsed.vaults) return;

                if (parsed?.vaults) {
                    for (const vault in parsed.vaults) {
                        if (
                            parsed.vaults[vault].path ==
                            (
                                this.app.vault.adapter as FileSystemAdapter
                            ).getBasePath()
                        ) {
                            delete parsed.vaults[vault].open;
                        }
                    }
                }
                fs.writeFileSync(
                    path.join(app.getPath("userData"), "obsidian.json"),
                    JSON.stringify(parsed)
                );
            }
        } catch (e) {
            console.error(e);
            new Notice(
                "Vault Picker: There was an issue removing this vault from the stored open vaults."
            );
        }
    }
    onunload() {}
}

class VaultPickerSettings extends PluginSettingTab {
    constructor(public plugin: VaultPicker) {
        super(plugin.app, plugin);
    }
    display() {
        this.containerEl.empty();
        this.containerEl.createEl("h3", { text: "Vault Picker" });

        this.containerEl.createSpan({
            cls: "setting-item",
            text: "Turning these settings on is effective immediately - the next time Obsidian opens, the vault picker will be shown. Turning them off, however, will still show the vault picker on the next restart."
        });

        new Setting(this.containerEl)
            .setName("Desktop")
            .setDesc("Vault picker will always open on desktop.")
            .addToggle((t) =>
                t.setValue(this.plugin.settings.desktop).onChange(async (v) => {
                    this.plugin.settings.desktop = v;
                    await this.plugin.saveData(this.plugin.settings);
                    if (!Platform.isMobile) this.plugin.tryToReset();
                })
            );
        new Setting(this.containerEl)
            .setName("Mobile")
            .setDesc("Vault picker will always open on mobile.")
            .addToggle((t) =>
                t.setValue(this.plugin.settings.mobile).onChange(async (v) => {
                    this.plugin.settings.mobile = v;
                    await this.plugin.saveData(this.plugin.settings);
                    if (Platform.isMobile) this.plugin.tryToReset();
                })
            );
    }
}
