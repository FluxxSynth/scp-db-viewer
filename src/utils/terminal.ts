import { commands, addToHistory, getHistory } from "./commands";
import type { CommandResult } from "./commands";
import { renderAsText } from "./commandUtils";

let currentInput = "";
let cursorPos = 0;
let historyIndex = -1;
let commandBuffer = "";
let isProcessing = false;

const PROMPT = "\n╭─[SCP DATABASE]─►\n╰─[~] $ ";
function getTerminal(): HTMLElement | null {
    return document.getElementById("terminal-content");
}

function scrollToBottom(el: HTMLElement) {
    el.scrollTop = el.scrollHeight;
}

export function initTerminal() {
    const term = getTerminal();
    if (!term) return;

    term.innerHTML = `
SCP Foundation Database Terminal v1.0
Type 'help' for available commands. Type 'access SCP-XXX' to begin.
    `;
    renderPrompt();
    document.addEventListener("keydown", handleKeyDown);

    const ipcRenderer = (window as any).require?.("electron")?.ipcRenderer;
    if (ipcRenderer) {
        ipcRenderer.on("unfocused", () => {
            term.classList.add("pause-cursor-unfocused");
        });
        ipcRenderer.on("focused", () => {
            term.classList.remove("pause-cursor-unfocused");
        });
    }
}

function renderPrompt() {
    const term = getTerminal();
    if (!term) return;

    const cursorEl = term.querySelector(".cursor-block");
    if (cursorEl) cursorEl.remove();

    const beforeCursor = currentInput.slice(0, cursorPos);
    const atChar = currentInput[cursorPos];
    const atCursor = atChar === undefined ? "\u00A0" : atChar === " " ? "\u00A0" : atChar;
    const afterCursor = currentInput.slice(cursorPos + 1);

    const line = document.createElement("div");
    line.className = "terminal-line";
    line.innerHTML = `${PROMPT}${escapeHtml(beforeCursor)}<span class="cursor-block">${escapeHtml(atCursor)}</span>${escapeHtml(afterCursor)}`;
    term.appendChild(line);
    scrollToBottom(term);

    if (!document.hasFocus()) {
        term.classList.add("pause-cursor-unfocused");
    } else {
        term.classList.remove("pause-cursor-unfocused");
    }
}

function escapeHtml(str: string): string {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function insertAtCursor(char: string) {
    currentInput = currentInput.slice(0, cursorPos) + char + currentInput.slice(cursorPos);
    cursorPos++;
    refreshLine();
}

function deleteBeforeCursor() {
    if (cursorPos <= 0) return;
    currentInput = currentInput.slice(0, cursorPos - 1) + currentInput.slice(cursorPos);
    cursorPos--;
    refreshLine();
}

function deleteAtCursor() {
    if (cursorPos >= currentInput.length) return;
    currentInput = currentInput.slice(0, cursorPos) + currentInput.slice(cursorPos + 1);
    refreshLine();
}

function refreshLine() {
    const term = getTerminal();
    if (!term) return;
    const lastLine = term.querySelector(".terminal-line:last-child");
    if (lastLine) lastLine.remove();
    renderPrompt();
}

async function executeCommand(input: string) {
    if (isProcessing) return;
    isProcessing = true;

    const term = getTerminal();
    if (!term) { isProcessing = false; return; }

    const trimmed = input.trim();
    if (!trimmed) {
        renderPrompt();
        isProcessing = false;
        return;
    }

    addToHistory(trimmed);
    historyIndex = -1;

    const parts = trimmed.split(/\s+/);
    const cmdName = parts[0].toLowerCase();
    const args = parts.slice(1);

    const cursorEl = term.querySelector(".cursor-block");
    if (cursorEl) cursorEl.classList.remove("cursor-block");

    let result: CommandResult;

    if (commands[cmdName]) {
        try {
            result = await commands[cmdName].execute(args);
        } catch (err) {
            result = {
                type: "error",
                content: `Command error: ${err instanceof Error ? err.message : "Unknown error"}`,
            };
        }
    } else {
        result = { type: "error", content: `Unknown command: ${cmdName}. Type 'help' for a list.` };
    }

    const lastLine = term.querySelector(".terminal-line:last-child");
    if (lastLine) lastLine.remove();

    if (result.type === "clear") {
        term.innerHTML = "";
        renderPrompt();
    } else if (result.type === "exit") {
        term.innerHTML += `\n  Closing terminal...\n`;
        const ipcRenderer = (window as any).require?.("electron")?.ipcRenderer;
        if (ipcRenderer) ipcRenderer.send("close");
        else {
            term.innerHTML += `  [Exit requested — running outside Electron]\n`;
        }
        renderPrompt();
    } else {
        const text = renderAsText(result);
        term.innerHTML += text;
        renderPrompt();
    }

    scrollToBottom(term);
    isProcessing = false;

    term.focus();
}

function tabComplete() {
    const word = currentInput.split(/\s+/).pop() || "";
    if (!word) return;

    const cmdNames = Object.keys(commands);
    const matches = cmdNames.filter((name) => name.startsWith(word));

    if (matches.length === 1) {
        const parts = currentInput.split(/\s+/);
        parts[parts.length - 1] = matches[0];
        currentInput = parts.join(" ") + " ";
        cursorPos = currentInput.length;
        refreshLine();
    } else if (matches.length > 1) {
        const term = getTerminal();
        if (!term) return;
        const lastLine = term.querySelector(".terminal-line:last-child");
        if (lastLine) lastLine.remove();
        term.innerHTML += `\n  ${matches.join("  ")}\n`;
        renderPrompt();
    }
}

function handleKeyDown(e: KeyboardEvent) {
    const term = getTerminal();
    if (!term) return;

    if (e.ctrlKey || e.metaKey) {
        if (e.key === "l" || e.key === "L") {
            e.preventDefault();
            term.innerHTML = "";
            renderPrompt();
            return;
        }
        return;
    }

    switch (e.key) {
        case "Enter":
            e.preventDefault();
            executeCommand(currentInput);
            currentInput = "";
            cursorPos = 0;
            break;

        case "Backspace":
            e.preventDefault();
            deleteBeforeCursor();
            break;

        case "Delete":
            e.preventDefault();
            deleteAtCursor();
            break;

        case "ArrowLeft":
            e.preventDefault();
            if (cursorPos > 0) {
                cursorPos--;
                refreshLine();
            }
            break;

        case "ArrowRight":
            e.preventDefault();
            if (cursorPos < currentInput.length) {
                cursorPos++;
                refreshLine();
            }
            break;

        case "ArrowUp":
            e.preventDefault();
            {
                const history = getHistory();
                if (history.length === 0) break;
                if (historyIndex === -1) {
                    commandBuffer = currentInput;
                    historyIndex = history.length - 1;
                } else if (historyIndex > 0) {
                    historyIndex--;
                }
                currentInput = history[historyIndex];
                cursorPos = currentInput.length;
                refreshLine();
            }
            break;

        case "ArrowDown":
            e.preventDefault();
            {
                const history = getHistory();
                if (historyIndex === -1) break;
                if (historyIndex < history.length - 1) {
                    historyIndex++;
                    currentInput = history[historyIndex];
                } else {
                    historyIndex = -1;
                    currentInput = commandBuffer;
                    commandBuffer = "";
                }
                cursorPos = currentInput.length;
                refreshLine();
            }
            break;

        case "Tab":
            e.preventDefault();
            tabComplete();
            break;

        case "Home":
            e.preventDefault();
            cursorPos = 0;
            refreshLine();
            break;

        case "End":
            e.preventDefault();
            cursorPos = currentInput.length;
            refreshLine();
            break;

        default:
            if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                e.preventDefault();
                insertAtCursor(e.key);
            }
            break;
    }
}
