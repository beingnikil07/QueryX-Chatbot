const messageInput =
    document.getElementById("messageInput");

const sendBtn =
    document.getElementById("sendBtn");

const messages =
    document.getElementById("messages");

const newChatBtn =
    document.getElementById("newChatBtn");

const conversationList =
    document.getElementById("conversationList");

const conversationIdText =
    document.getElementById("conversationIdText");

const chatTitle =
    document.getElementById("chatTitle");

const themeBtn =
    document.getElementById("themeBtn");

const clearBtn =
    document.getElementById("clearBtn");

const characterCount =
    document.getElementById("characterCount");


/* =====================================
   STATE
===================================== */

let conversations =
    JSON.parse(
        localStorage.getItem(
            "queryx-conversations"
        )
    ) || [];

let currentConversationId = null;


/* =====================================
   CREATE NEW QUERY
===================================== */

function createNewChat() {

    currentConversationId =
        crypto.randomUUID();

    const conversation = {

        id: currentConversationId,

        title: "New Customer Query"
    };


    conversations.unshift(
        conversation
    );


    saveConversations();

    renderConversationList();

    clearMessages();

    updateHeader(
        conversation
    );

    messageInput.focus();
}


/* =====================================
   SEND QUERY
===================================== */

async function sendMessage() {

    const text =
        messageInput.value.trim();


    if (!text) {

        return;
    }


    if (!currentConversationId) {

        createNewChat();
    }


    removeWelcome();


    /*
     Display original customer query
    */

    addMessage(
        text,
        "user"
    );


    messageInput.value = "";

    updateCharacterCount();

    autoResize();


    /*
     Use customer query as sidebar title
    */

    updateConversationTitle(
        text
    );


    const typingElement =
        showTyping();


    sendBtn.disabled = true;


    try {

        /*
         Existing Spring Boot API
        */

        const response =
            await fetch(

                `/api/chat?conversationId=${
                    encodeURIComponent(
                        currentConversationId
                    )
                }`,

                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "text/plain"
                    },

                    body: text
                }
            );


        if (!response.ok) {

            throw new Error(
                `Server returned ${
                    response.status
                }`
            );
        }


        /*
         AI generated summary
        */

        const summary =
            await response.text();


        typingElement.remove();


        addMessage(
            summary,
            "assistant"
        );


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
   LOAD QUERY HISTORY FROM MYSQL
===================================== */

async function loadConversation(
    conversationId
) {

    currentConversationId =
        conversationId;


    messages.innerHTML = "";


    try {

        const response =
            await fetch(

                `/api/chat/${
                    encodeURIComponent(
                        conversationId
                    )
                }/messages`
            );


        if (!response.ok) {

            throw new Error(
                "Unable to load query history"
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


        addMessage(

            "Unable to load previous query.",

            "assistant"
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
   TYPING / PROCESSING INDICATOR
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
   CONVERSATION TITLE
===================================== */

function updateConversationTitle(
    customerQuery
) {

    const conversation =
        conversations.find(

            conversation =>
                conversation.id ===
                currentConversationId
        );


    if (!conversation) {

        return;
    }


    if (
        conversation.title ===
        "New Customer Query"
    ) {

        conversation.title =

            customerQuery.length > 32

                ? customerQuery.substring(
                    0,
                    32
                ) + "..."

                : customerQuery;


        saveConversations();

        renderConversationList();

        updateHeader(
            conversation
        );
    }
}


/* =====================================
   SIDEBAR
===================================== */

function renderConversationList() {

    conversationList.innerHTML =
        "";


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


                    renderConversationList();


                    updateHeader(
                        conversation
                    );


                    await loadConversation(
                        conversation.id
                    );
                };


            conversationList.appendChild(
                item
            );
        }
    );
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
   LOCAL STORAGE
===================================== */

function saveConversations() {

    localStorage.setItem(

        "queryx-conversations",

        JSON.stringify(
            conversations
        )
    );
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
   CLEAR LOCAL QUERIES
===================================== */

clearBtn.onclick = () => {

    conversations = [];

    currentConversationId = null;


    localStorage.removeItem(
        "queryx-conversations"
    );


    conversationList.innerHTML =
        "";


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

    if (
        conversations.length > 0
    ) {

        const conversation =
            conversations[0];


        currentConversationId =
            conversation.id;


        updateHeader(
            conversation
        );


        renderConversationList();


        /*
         Restore messages from MySQL
        */

        await loadConversation(
            conversation.id
        );


    } else {

        createNewChat();
    }
}


initializeApp();