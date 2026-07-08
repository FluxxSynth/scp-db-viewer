import { initTerminal } from "./utils/terminal";
import "./utils/access";
import "./utils/search";

let asciiMode = false;

window.addEventListener("DOMContentLoaded", () => {
    initTerminal();

    document.getElementById("close")?.addEventListener("click", () => {
        const ipc = (window as any).require?.("electron")?.ipcRenderer;
        if (ipc) ipc.send("close");
    });

    document.getElementById("minimize")?.addEventListener("click", () => {
        const ipc = (window as any).require?.("electron")?.ipcRenderer;
        if (ipc) ipc.send("minimize");
    });

    document.getElementById("maximize")?.addEventListener("click", () => {
        const ipc = (window as any).require?.("electron")?.ipcRenderer;
        if (ipc) ipc.send("maximize");
    });

    const asciiBtn = document.getElementById("ascii-toggle");
    if (asciiBtn) {
        asciiBtn.addEventListener("click", () => {
            asciiMode = !asciiMode;
            asciiBtn.textContent = asciiMode ? "[ ASCII: ON  ]" : "[ ASCII: OFF ]";
            document.getElementById("terminal-content")?.classList.toggle("ascii-mode", asciiMode);
        });
    }

    updateOnlineStatus();
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);
});

function updateOnlineStatus() {
    const statusEl = document.getElementById("onlinestatus");
    if (!statusEl) return;
    if (navigator.onLine) {
        statusEl.textContent = "ONLINE";
        statusEl.classList.add("online");
    } else {
        statusEl.textContent = "OFFLINE";
        statusEl.classList.remove("online");
    }
}
