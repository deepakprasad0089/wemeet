document.addEventListener("DOMContentLoaded", function () {
    const chatForm = document.getElementById("chat-form");
    const chatBox = document.getElementById("chat-box");
    const messageInput = document.getElementById("message-input");
    const chatBtn = document.getElementById("chat-btn");
    const chatPopup = document.getElementById("chat-popup");

    // Handle message send
    if (chatForm) {
        chatForm.addEventListener("submit", function (e) {
            e.preventDefault();

            const message = messageInput.value.trim();
            if (!message) return;

            const p = document.createElement("p");
            p.textContent = "Me: " + message;
            chatBox.appendChild(p);
            chatBox.scrollTop = chatBox.scrollHeight;

            messageInput.value = "";
        });
    }

    
    
});
