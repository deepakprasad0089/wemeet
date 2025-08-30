document.addEventListener("DOMContentLoaded", function() {
    const chatForm = document.getElementById("chat-form");
    const chatBox = document.getElementById("chat-box");
    const messageInput = document.getElementById("message-input");

    if (chatForm) {
        chatForm.addEventListener("submit", function(e) {
            e.preventDefault(); // ⛔ stop page refresh

            const message = messageInput.value.trim();
            if (!message) return;

            // TODO: Replace this with your WebSocket send
            // Example append:
            const p = document.createElement("p");
            p.textContent = "Me: " + message;
            chatBox.appendChild(p);
            chatBox.scrollTop = chatBox.scrollHeight;

            messageInput.value = "";
        });
    }

    // Chat popup toggle
    const chatBtn = document.getElementById("chat-btn");
    const chatPopup = document.getElementById("chat-popup");

    if (chatBtn && chatPopup) {
        chatBtn.addEventListener("click", function() {
            chatPopup.style.display = chatPopup.style.display === "none" ? "block" : "none";
        });
    }
});
