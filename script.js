// Query DOM Elements
const typingForm = document.querySelector(".typing-form");
const typingInput = document.querySelector(".typing-input");
const chatContainer = document.querySelector(".chat-list");
const sendButton = document.querySelector("#send-message-button");
const toggleThemeButton = document.querySelector("#theme-toggle-button");
const deleteChatButton = document.querySelector("#delete-chat-button");
const suggestions = document.querySelectorAll(".suggestion");

// State Variables
let userMessage = null;
let isResponseGenerating = false;

// API Configuration (Placeholder)
const API_KEY = "AIzaSyAjOXYEgC3bPr2W9JRyJ3ZYeO2MVrKWf4w"; // Add your APAIzaSyD12khhvCfTB6SSQQfpPIr3bSlFXqu1OwU I key
const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${API_KEY}`;

// Load data from localStorage on page load
const loadDataFromLocalstorage = () => {
  const savedChats = localStorage.getItem("saved-chats");
  const isLightMode = localStorage.getItem("themeColor") === "light_mode";

  // Apply stored theme
  document.body.classList.toggle("light_mode", isLightMode);
  toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";

  // Restore saved chats or clear chat container
  chatContainer.innerHTML = savedChats || "";
  chatContainer.scrollTo(0, chatContainer.scrollHeight); // Scroll to bottom
};

// Create a new message element
const createMessageElement = (content, ...classes) => {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = content;
  return div;
};

// Show typing effect
const showTypingEffect = (text, textElement, incomingMessageDiv) => {
  const words = text.split(" ");
  let currentWordIndex = 0;

  const typingInterval = setInterval(() => {
    textElement.innerText += (currentWordIndex === 0 ? "" : " ") + words[currentWordIndex++];
    incomingMessageDiv.querySelector(".icon").classList.add("hide");

    if (currentWordIndex === words.length) {
      clearInterval(typingInterval);
      isResponseGenerating = false;
      incomingMessageDiv.querySelector(".icon").classList.remove("hide");
      localStorage.setItem("saved-chats", chatContainer.innerHTML); // Save chats
    }
    chatContainer.scrollTo(0, chatContainer.scrollHeight);
  }, 75);
};

// Fetch API response
const generateAPIResponse = async (incomingMessageDiv) => {
  const textElement = incomingMessageDiv.querySelector(".text");
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: userMessage }] }]
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error.message);

    const apiResponse = data.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g, "$1");
    showTypingEffect(apiResponse, textElement, incomingMessageDiv);
  } catch (error) {
    isResponseGenerating = false;
    textElement.innerText = error.message;
    textElement.parentElement.closest(".message").classList.add("error");
  } finally {
    incomingMessageDiv.classList.remove("loading");
  }
};

// Show loading animation
const showLoadingAnimation = () => {
  const html = `
    <div class="message-content">
      <img class="avatar" src="images/gemini.svg" alt="Gemini avatar">
      <p class="text"></p>
      <div class="loading-indicator">
        <div class="loading-bar"></div>
        <div class="loading-bar"></div>
        <div class="loading-bar"></div>
      </div>
    </div>
    <span onclick="copyMessage(this)" class="icon material-symbols-rounded">content_copy</span>`;

  const incomingMessageDiv = createMessageElement(html, "incoming", "loading");
  chatContainer.appendChild(incomingMessageDiv);
  chatContainer.scrollTo(0, chatContainer.scrollHeight);
  generateAPIResponse(incomingMessageDiv);
};

// Copy message to clipboard
const copyMessage = (copyButton) => {
  const messageText = copyButton.parentElement.querySelector(".text").innerText;
  navigator.clipboard.writeText(messageText);
  copyButton.innerText = "done"; // Show confirmation
  setTimeout(() => (copyButton.innerText = "content_copy"), 1000);
};

// Handle outgoing chat message
const handleOutgoingChat = () => {
  userMessage = typingInput.value.trim();
  if (!userMessage || isResponseGenerating) return;

  isResponseGenerating = true;
  const html = `
    <div class="message-content">
      <img class="avatar" src="images/user.jpg" alt="User avatar">
      <p class="text">${userMessage}</p>
    </div>`;

  const outgoingMessageDiv = createMessageElement(html, "outgoing");
  chatContainer.appendChild(outgoingMessageDiv);

  typingInput.value = ""; // Clear input
  chatContainer.scrollTo(0, chatContainer.scrollHeight);
  setTimeout(showLoadingAnimation, 500);
};

// Toggle theme
toggleThemeButton.addEventListener("click", () => {
  const isLightMode = document.body.classList.toggle("light_mode");
  localStorage.setItem("themeColor", isLightMode ? "light_mode" : "dark_mode");
  toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";
});

// Delete all chats
deleteChatButton.addEventListener("click", () => {
  if (confirm("Are you sure you want to delete all chats?")) {
    localStorage.removeItem("saved-chats");
    chatContainer.innerHTML = "";
  }
});

// Handle form submission (Enter key)
typingForm.addEventListener("submit", (e) => {
  e.preventDefault();
  handleOutgoingChat();
});

// Handle send button click
sendButton.addEventListener("click", (e) => {
  e.preventDefault();
  handleOutgoingChat();
});

// Handle suggestion clicks
suggestions.forEach((suggestion) => {
  suggestion.addEventListener("click", () => {
    userMessage = suggestion.querySelector(".text").innerText;
    handleOutgoingChat();
  });
});

// Load data on page load
loadDataFromLocalstorage();
