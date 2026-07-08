import { BrowserWindow, ipcMain, app, shell } from "electron";
import { join } from "path";

let mainWindow: BrowserWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        height: 700,
        width: 1000,
        minWidth: 700,
        frame: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            sandbox: false,
        }
    });

    mainWindow.loadFile(join(__dirname, './pages/index.html'));
    mainWindow.on("closed", () => app.quit());
    mainWindow.on("blur", () => mainWindow.webContents.send("unfocused"));
    mainWindow.on("focus", () => mainWindow.webContents.send("focused"));
    // Prevent navigation away from the app
    mainWindow.webContents.on("will-navigate", (event) => {
        event.preventDefault();
    });
    mainWindow.webContents.setWindowOpenHandler(() => {
        return { action: "deny" };
    });
}

app.on("ready", createWindow);

ipcMain.on("debug", () => {
    mainWindow.webContents.openDevTools();
});

ipcMain.handle("getversion", () => {
    return app.getVersion();
});

ipcMain.on("close", () => app.quit());
ipcMain.on("minimize", () => {
    BrowserWindow.getFocusedWindow()?.minimize();
});
ipcMain.on("maximize", () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) {
        win.isMaximized() ? win.unmaximize() : win.maximize();
    }
});

// Open external links in the default browser
ipcMain.handle("open-external", (_event, url: string) => {
    if (url.startsWith("http://") || url.startsWith("https://")) {
        shell.openExternal(url);
    }
});

app.on("activate", () => {
    if (!mainWindow) createWindow();
});
