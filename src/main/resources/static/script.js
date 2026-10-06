const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const messages = document.getElementById("messages");
const newChatBtn = document.getElementById("newChatBtn");
const conversationList = document.getElementById("conversationList");
const conversationIdText = document.getElementById("conversationIdText");
const chatTitle = document.getElementById("chatTitle");
const themeBtn = document.getElementById("themeBtn");
const clearBtn = document.getElementById("clearBtn");
const characterCount = document.getElementById("characterCount");


/* =====================================
   STATE
===================================== */

let currentConversationId = null;


/* =====================================
   CREATE NEW QUERY
===================================== */

async function createNewChat() {

    try {

        const response = await fetch(
            "/api/conversations",
            {
                method: "POST"
            }
        );

        if (!response.ok) {
            throw new Error(
                `Unable to create conversation: ${response.status}`
            );
        }

        const conversation = await response.json();

        currentConversationId = conversation.id;

        clearMessages();

        updateHeader(conversation);

        await loadConversations();

        messageInput.value = "";

        updateCharacterCount();

        autoResize();

        messageInput.focus();

    } catch (error) {

        console.error(
            "Create conversation error:",
            error
        );
    }
}


/* =====================================
   SEND CUSTOMER QUERY
===================================== */

async function sendMessage() {

    const text = messageInput.value.trim();

    if (!text) {
        return;
    }


    /*
     If no conversation exists,
     create one first.
    */

    if (!currentConversationId) {

        await createNewChat();

        if (!currentConversationId) {
            return;
        }
    }


    removeWelcome();

    addMessage(
        text,
        "user"
    );


    messageInput.value = "";

    updateCharacterCount();

    autoResize();


    const typingElement = showTyping();

    sendBtn.disabled = true;


    try {

        const response = await fetch(

            `/api/chat?conversationId=${
                encodeURIComponent(
                    currentConversationId
                )
            }`,

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


        const summary = await response.text();


        typingElement.remove();


        addMessage(
            summary,
            "assistant"
        );


        /*
         Backend updates conversation title,
         so reload sidebar from MySQL.
        */

        await loadConversations();


        /*
         Update header using fresh conversation
         information.
        */

        await updateCurrentConversationHeader();


    } catch (error) {

        typingElement.remove();


        addMessage(
            "Unable to generate summary. Please try again.",
            "assistant"
        );


        console.error(
            "QueryX API error:",
            error
        );

    } finally {

        sendBtn.disabled = false;

        messageInput.focus();
    }
}


/* =====================================
   LOAD ALL CONVERSATIONS FROM MYSQL
===================================== */

async function loadConversations() {

    try {

        const response = await fetch(
            "/api/conversations"
        );


        if (!response.ok) {

            throw new Error(
                `Unable to load conversations: ${response.status}`
            );
        }


        const conversations =
            await response.json();


        conversationList.innerHTML = "";


        conversations.forEach(
            conversation => {

                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "conversation";


                if (
                    conversation.id ===
                    currentConversationId
                ) {

                    item.classList.add(
                        "active"
                    );
                }


                item.textContent =
                    conversation.title;


                item.onclick =
                    async () => {

                        currentConversationId =
                            conversation.id;


                        updateHeader(
                            conversation
                        );


                        await loadConversation(
                            conversation.id
                        );


                        /*
                         Re-render so selected item
                         becomes active.
                        */

                        await loadConversations();
                    };


                conversationList.appendChild(
                    item
                );
            }
        );


        return conversations;


    } catch (error) {

        console.error(
            "Sidebar loading error:",
            error
        );

        return [];
    }
}


/* =====================================
   LOAD SELECTED CONVERSATION MESSAGES
===================================== */

async function loadConversation(
    conversationId
) {

    currentConversationId =
        conversationId;


    messages.innerHTML = "";


    try {

        const response = await fetch(

            `/api/chat/${
                encodeURIComponent(
                    conversationId
                )
            }/messages`
        );


        if (!response.ok) {

            throw new Error(
                `Unable to load history: ${response.status}`
            );
        }


        const history =
            await response.json();


        if (history.length === 0) {

            clearMessages();

            return;
        }


        history.forEach(
            chatMessage => {

                if (
                    chatMessage.role ===
                    "USER"
                ) {

                    addMessage(
                        chatMessage.content,
                        "user"
                    );

                } else if (
                    chatMessage.role ===
                    "ASSISTANT"
                ) {

                    addMessage(
                        chatMessage.content,
                        "assistant"
                    );
                }
            }
        );


        scrollBottom();


    } catch (error) {

        console.error(
            "History loading error:",
            error
        );


        messages.innerHTML = "";


        addMessage(
            "Unable to load previous query.",
            "assistant"
        );
    }
}


/* =====================================
   UPDATE CURRENT HEADER
===================================== */

async function updateCurrentConversationHeader() {

    if (!currentConversationId) {
        return;
    }


    try {

        const response =
            await fetch(
                "/api/conversations"
            );


        if (!response.ok) {
            return;
        }


        const conversations =
            await response.json();


        const conversation =
            conversations.find(
                conversation =>
                    conversation.id ===
                    currentConversationId
            );


        if (conversation) {

            updateHeader(
                conversation
            );
        }


    } catch (error) {

        console.error(
            "Header update error:",
            error
        );
    }
}


/* =====================================
   ADD MESSAGE
===================================== */

function addMessage(
    text,
    role
) {

    const message =
        document.createElement(
            "div"
        );


    message.className =
        `message ${role}`;


    const avatar =
        document.createElement(
            "div"
        );


    avatar.className =
        "message-avatar";


    avatar.textContent =
        role === "user"
            ? "C"
            : "Q";


    const content =
        document.createElement(
            "div"
        );


    content.className =
        "message-content";


    content.textContent =
        text;


    message.appendChild(
        avatar
    );


    message.appendChild(
        content
    );


    messages.appendChild(
        message
    );


    scrollBottom();
}


/* =====================================
   TYPING INDICATOR
===================================== */

function showTyping() {

    const message =
        document.createElement(
            "div"
        );


    message.className =
        "message assistant";


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


    messages.appendChild(
        message
    );


    scrollBottom();


    return message;
}


/* =====================================
   HEADER
===================================== */

function updateHeader(
    conversation
) {

    chatTitle.textContent =
        conversation.title;


    conversationIdText.textContent =
        "Query ID: " +
        conversation.id;
}


/* =====================================
   WELCOME SCREEN
===================================== */

function clearMessages() {

    messages.innerHTML = `

        <div
            class="welcome"
            id="welcome">

            <div class="welcome-icon">
                Q
            </div>

            <h1>
                Customer Query Summarizer
            </h1>

            <p>
                Paste a customer's food delivery
                query and QueryX will generate
                a short, clear support summary.
            </p>


            <div class="feature-cards">


                <button
                    class="feature-card"
                    onclick="useSuggestion(
                    'My order was supposed to arrive 45 minutes ago but it is still showing preparing and I cannot contact the delivery partner.'
                    )">

                    <span class="feature-icon">
                        ⏱
                    </span>

                    <div>

                        <strong>
                            Delayed Order
                        </strong>

                        <small>
                            Try an example
                        </small>

                    </div>

                </button>


                <button
                    class="feature-card"
                    onclick="useSuggestion(
                    'I ordered two burgers and fries but received only one burger and the fries are missing.'
                    )">

                    <span class="feature-icon">
                        🍔
                    </span>

                    <div>

                        <strong>
                            Missing Items
                        </strong>

                        <small>
                            Try an example
                        </small>

                    </div>

                </button>


                <button
                    class="feature-card"
                    onclick="useSuggestion(
                    'My payment was deducted but the order failed and I have not received my refund yet.'
                    )">

                    <span class="feature-icon">
                        ₹
                    </span>

                    <div>

                        <strong>
                            Payment Issue
                        </strong>

                        <small>
                            Try an example
                        </small>

                    </div>

                </button>

            </div>

        </div>
    `;
}


/* =====================================
   REMOVE WELCOME
===================================== */

function removeWelcome() {

    const welcomeElement =
        document.getElementById(
            "welcome"
        );


    if (welcomeElement) {

        welcomeElement.remove();
    }
}


/* =====================================
   EXAMPLE QUERY
===================================== */

function useSuggestion(
    text
) {

    messageInput.value =
        text;


    updateCharacterCount();

    autoResize();

    messageInput.focus();
}


/* =====================================
   CHARACTER COUNTER
===================================== */

function updateCharacterCount() {

    characterCount.textContent =
        messageInput.value.length +
        " characters";
}


/* =====================================
   AUTO RESIZE
===================================== */

function autoResize() {

    messageInput.style.height =
        "auto";


    messageInput.style.height =

        Math.min(
            messageInput.scrollHeight,
            160
        ) + "px";
}


/* =====================================
   SCROLL
===================================== */

function scrollBottom() {

    messages.scrollTop =
        messages.scrollHeight;
}


/* =====================================
   THEME
===================================== */

themeBtn.onclick = () => {

    document.body.classList.toggle(
        "dark"
    );


    const theme =
        document.body.classList.contains(
            "dark"
        )
            ? "dark"
            : "light";


    localStorage.setItem(
        "queryx-theme",
        theme
    );
};


if (
    localStorage.getItem(
        "queryx-theme"
    ) === "dark"
) {

    document.body.classList.add(
        "dark"
    );
}


/* =====================================
   CLEAR UI
===================================== */

clearBtn.onclick = () => {

    /*
     This currently clears only the UI.

     It does NOT delete conversations
     from MySQL.
    */

    currentConversationId =
        null;


    chatTitle.textContent =
        "New Customer Query";


    conversationIdText.textContent =
        "Ready to summarize";


    clearMessages();
};


/* =====================================
   EVENTS
===================================== */

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

    () => {

        autoResize();

        updateCharacterCount();
    }
);


messageInput.addEventListener(

    "keydown",

    event => {

        if (
            event.key === "Enter"
            &&
            !event.shiftKey
        ) {

            event.preventDefault();

            sendMessage();
        }
    }
);


/* =====================================
   INITIALIZATION
===================================== */

async function initializeApp() {

    /*
     Get previous conversations
     directly from MySQL.
    */

    const conversations =
        await loadConversations();


    /*
     If conversations exist,
     automatically open latest one.
    */

    if (conversations.length > 0) {

        const latestConversation =
            conversations[0];


        currentConversationId =
            latestConversation.id;


        updateHeader(
            latestConversation
        );


        await loadConversation(
            latestConversation.id
        );


        await loadConversations();

    } else {

        /*
         Don't create an empty DB row
         automatically.

         Just show welcome screen.
        */

        currentConversationId =
            null;

        clearMessages();
    }
}


initializeApp();