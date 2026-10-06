const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const messages = document.getElementById("messages");
const welcome = document.getElementById("welcome");

const newChatBtn = document.getElementById("newChatBtn");
const conversationList = document.getElementById("conversationList");

const conversationIdText =
    document.getElementById("conversationIdText");

const chatTitle =
    document.getElementById("chatTitle");

const themeBtn =
    document.getElementById("themeBtn");

const clearBtn =
    document.getElementById("clearBtn");


let conversations =
    JSON.parse(localStorage.getItem("queryx-conversations")) || [];

let currentConversationId = null;


/* ==============================
   CREATE NEW CHAT
============================== */

function createNewChat() {

    currentConversationId = crypto.randomUUID();

    const conversation = {
        id: currentConversationId,
        title: "New Conversation"
    };

    conversations.unshift(conversation);

    saveConversations();

    renderConversationList();

    clearMessages();

    updateHeader(conversation);
}


/* ==============================
   SEND MESSAGE
============================== */

async function sendMessage() {

    const text = messageInput.value.trim();

    if (!text) {
        return;
    }

    if (!currentConversationId) {
        createNewChat();
    }

    removeWelcome();

    addMessage(text, "user");

    messageInput.value = "";
    autoResize();

    updateConversationTitle(text);

    const typingElement = showTyping();

    sendBtn.disabled = true;

    try {

        const response = await fetch(
            `/api/chat?conversationId=${encodeURIComponent(currentConversationId)}`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "text/plain"
                },

                body: text
            }
        );

        if (!response.ok) {
            throw new Error(
                `Server returned ${response.status}`
            );
        }

        const answer = await response.text();

        typingElement.remove();

        addMessage(answer, "assistant");

    } catch (error) {

        typingElement.remove();

        addMessage(
            "Sorry, I couldn't connect to the server.",
            "assistant"
        );

        console.error(error);

    } finally {

        sendBtn.disabled = false;
        messageInput.focus();
    }
}


/* ==============================
   ADD MESSAGE
============================== */

function addMessage(text, role) {

    const message = document.createElement("div");

    message.className = `message ${role}`;

    const avatar = document.createElement("div");

    avatar.className = "message-avatar";

    avatar.textContent =
        role === "user" ? "N" : "Q";

    const content = document.createElement("div");

    content.className = "message-content";

    content.textContent = text;

    message.appendChild(avatar);
    message.appendChild(content);

    messages.appendChild(message);

    scrollBottom();
}


/* ==============================
   TYPING INDICATOR
============================== */

function showTyping() {

    const message = document.createElement("div");

    message.className = "message assistant";

    message.innerHTML = `

        <div class="message-avatar">
            Q
        </div>

        <div class="message-content typing">
            <span></span>
            <span></span>
            <span></span>
        </div>

    `;

    messages.appendChild(message);

    scrollBottom();

    return message;
}


/* ==============================
   CONVERSATION TITLE
============================== */

function updateConversationTitle(message) {

    const conversation =
        conversations.find(
            c => c.id === currentConversationId
        );

    if (!conversation) {
        return;
    }

    if (conversation.title === "New Conversation") {

        conversation.title =
            message.length > 30
                ? message.substring(0, 30) + "..."
                : message;

        saveConversations();

        renderConversationList();

        updateHeader(conversation);
    }
}


/* ==============================
   RENDER SIDEBAR
============================== */

function renderConversationList() {

    conversationList.innerHTML = "";

    conversations.forEach(conversation => {

        const item = document.createElement("div");

        item.className = "conversation";

        if (conversation.id === currentConversationId) {
            item.classList.add("active");
        }

        item.textContent = conversation.title;

        item.onclick = () => {

            currentConversationId =
                conversation.id;

            renderConversationList();

            updateHeader(conversation);

            /*
             Later we will call:
             GET /api/conversations/{id}/messages

             to load old messages.
            */

            clearMessages();

            addMessage(
                "Conversation selected. Message history API can be connected here.",
                "assistant"
            );
        };

        conversationList.appendChild(item);
    });
}


/* ==============================
   HEADER
============================== */

function updateHeader(conversation) {

    chatTitle.textContent =
        conversation.title;

    conversationIdText.textContent =
        "ID: " + conversation.id;
}


/* ==============================
   STORAGE
============================== */

function saveConversations() {

    localStorage.setItem(
        "queryx-conversations",
        JSON.stringify(conversations)
    );
}


/* ==============================
   CLEAR UI
============================== */

function clearMessages() {

    messages.innerHTML = `

        <div class="welcome" id="welcome">

            <div class="welcome-logo">
                Q
            </div>

            <h1>Welcome to QueryX</h1>

            <p>
                Your intelligent AI assistant.
                Ask me anything.
            </p>

        </div>

    `;
}


function removeWelcome() {

    const welcomeElement =
        document.getElementById("welcome");

    if (welcomeElement) {
        welcomeElement.remove();
    }
}


/* ==============================
   SCROLL
============================== */

function scrollBottom() {

    messages.scrollTop =
        messages.scrollHeight;
}


/* ==============================
   TEXTAREA RESIZE
============================== */

function autoResize() {

    messageInput.style.height = "auto";

    messageInput.style.height =
        Math.min(
            messageInput.scrollHeight,
            150
        ) + "px";
}


/* ==============================
   SUGGESTIONS
============================== */

function useSuggestion(text) {

    messageInput.value = text;

    sendMessage();
}


/* ==============================
   THEME
============================== */

themeBtn.onclick = () => {

    document.body.classList.toggle("dark");

    localStorage.setItem(
        "queryx-theme",
        document.body.classList.contains("dark")
            ? "dark"
            : "light"
    );
};


if (
    localStorage.getItem("queryx-theme")
    === "dark"
) {

    document.body.classList.add("dark");
}


/* ==============================
   CLEAR CHATS
============================== */

clearBtn.onclick = () => {

    conversations = [];

    currentConversationId = null;

    localStorage.removeItem(
        "queryx-conversations"
    );

    conversationList.innerHTML = "";

    chatTitle.textContent =
        "New Conversation";

    conversationIdText.textContent = "";

    clearMessages();
};


/* ==============================
   EVENTS
============================== */

sendBtn.addEventListener(
    "click",
    sendMessage
);


newChatBtn.addEventListener(
    "click",
    createNewChat
);


messageInput.addEventListener(
    "input",
    autoResize
);


messageInput.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Enter"
            && !event.shiftKey
        ) {

            event.preventDefault();

            sendMessage();
        }
    }
);


/* ==============================
   INITIALIZATION
============================== */

if (conversations.length > 0) {

    currentConversationId =
        conversations[0].id;

    updateHeader(
        conversations[0]
    );

} else {

    createNewChat();
}

renderConversationList();