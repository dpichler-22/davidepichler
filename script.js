const chatBox = document.querySelector('.chat-messages');
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const charCounter = document.getElementById('char-counter');
const suggestions = document.querySelectorAll('.suggestion');


// Ping the backend when the page loads to wake it up
fetch('http://127.0.0.1:5000/ping')
  .then(res => res.json())
  .then(data => {
    console.log('Backend awake:', data.status);
  })
  .catch(err => {
    console.warn('Backend ping failed:', err);
  });


function appendMessage(text, sender) {
  if (!chatBox) return;
  const msg = document.createElement('div');
  msg.className = 'message ' + sender;
  msg.textContent = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function updateCharCounter() {
  const len = userInput.value.length;
  charCounter.textContent = `${len}/100`;
}

function autoResizeTextarea() {
  userInput.style.height = 'auto';
  userInput.style.height = userInput.scrollHeight + 'px';
  // Center placeholder if empty

}

if (userInput && charCounter) {
  userInput.addEventListener('input', () => {
    updateCharCounter();
    autoResizeTextarea();
  });
  // Submit on Enter, allow Shift+Enter for newline
  userInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      chatForm.requestSubmit();
    }
  });
  updateCharCounter();
  autoResizeTextarea();
}

if (chatForm) {
  chatForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const text = userInput.value.trim();
    if (!text) return;
    if (text.length > 100) return;
    appendMessage(text, 'user');
    userInput.value = '';
    updateCharCounter();
    autoResizeTextarea();

    // Send to Flask backend
    fetch('http://127.0.0.1:5000/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: text })
    })
    .then(response => response.json())
    .then(data => {
      appendMessage(data.reply, 'bot');
    })
    .catch(() => {
      appendMessage('Sorry, there was an error contacting the server :(. You can view an overview about me here: https://www.linkedin.com/in/davide-pichler. Feel free to reach out directly if you have any questions!', 'bot');
    });
  });
}

// Suggestion click: fill textarea and focus
if (suggestions && userInput) {
  suggestions.forEach(suggestion => {
    suggestion.addEventListener('click', () => {
      userInput.value = suggestion.textContent;
      updateCharCounter();
      autoResizeTextarea();
      userInput.focus();
    });
  });
}
