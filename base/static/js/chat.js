document.addEventListener("DOMContentLoaded", function () {
    const chatForm = document.getElementById("chat-form");
    const chatBox = document.getElementById("chat-box");
    const messageInput = document.getElementById("message-input");
    const chatBtn = document.getElementById("chat-btn");
    const chatPopup = document.getElementById("chat-popup");

  
    const roomName = document.getElementById("room-name").textContent.trim();

    const chatSocket = new WebSocket(
        `ws://${window.location.host}/ws/chat/${roomName}/`
    );

    // Receive messages from WebSocket (messages from all users)
    chatSocket.onmessage = function(e) {
        const data = JSON.parse(e.data);
        const p = document.createElement("p");
        p.textContent = data.message;
        chatBox.appendChild(p);
        chatBox.scrollTop = chatBox.scrollHeight;
    };

    chatSocket.onclose = function(e) {
        console.error("Chat socket closed unexpectedly");
    };

    // Send message to WebSocket when form is submitted
    if (chatForm) {
        chatForm.addEventListener("submit", function(e) {
            e.preventDefault();

            const message = messageInput.value.trim();
            if (!message) return;

            // Send to WebSocket
             chatSocket.send(JSON.stringify({
            'message': message,
            'username': username
        }));

            // Clear input
            messageInput.value = "";
        });
    }

    
});
