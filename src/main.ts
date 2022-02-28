import "./main.css";

import { Platform, Plugin } from "obsidian";
import { PluginSettings } from "./@types";

export default class MyPlugin extends Plugin {
    settings: PluginSettings;
    async onload() {
        this.app.workspace.onLayoutReady(async () => {
            if (Platform.isMobile) {
                localStorage.removeItem("mobile-selected-vault");
            } else {
                const fs = require("fs");
                const path = require("path");
                const { remote } = require("electron");
                const { app } = remote;
                console.log(app.getPath("userData"));

                const data = fs.readFileSync(
                    path.join(app.getPath("userData"), "obsidian.json"),
                    { encoding: "utf8" }
                );

                const parsed = JSON.parse(data ?? {});
                if (!parsed || !parsed.vaults) return;

                if (parsed?.vaults) {
                    for (const vault in parsed.vaults) {
                        delete parsed.vaults[vault].open;
                    }
                }
                fs.writeFileSync(
                    path.join(app.getPath("userData"), "obsidian.json"),
                    JSON.stringify(parsed)
                );
            }
        });
    }

    onunload() {}
}
