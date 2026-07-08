document.addEventListener("DOMContentLoaded", () => {
    const content = document.getElementById("terminal-content");
    if (content) {
        content.innerHTML = `
<div class="rendered-content">
<h2>SCP Foundation Database Terminal</h2>
<p>Welcome to the SCP Foundation Database Terminal v1.0.</p>
<p>Type <code>help</code> for a list of commands, or <code>access SCP-XXX</code> to retrieve an article.</p>
<p>Available commands: help, clear, exit, history, manual, access, search</p>
</div>`;
    }
});
