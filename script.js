const chatBox = document.querySelector('.chat-messages');
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const charCounter = document.getElementById('char-counter');
const suggestions = document.querySelectorAll('.suggestion');
const suggestionsBar = document.getElementById('suggestions');


// Ping the backend when the page loads to wake it up
fetch('https://davidepichler-backend.onrender.com/ping')
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

  const rawHTML = marked.parse(text);
  const cleanHTML = DOMPurify.sanitize(rawHTML);

  msg.innerHTML = cleanHTML;  // Render sanitized HTML

  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function updateCharCounter() {
  const len = userInput.value.length;
  const maxLength = userInput.maxLength;
  charCounter.textContent = `${len}/${maxLength}`;
}

function autoResizeTextarea() {
  userInput.style.height = 'auto';
  userInput.style.height = (userInput.scrollHeight) + 'px';
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
    fetch('https://davidepichler-backend.onrender.com/chat', {
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
    .catch((error) => {
      console.error('Error:', error);
      appendMessage('Sorry, there was an error contacting the server :(. You can have an overview about me here: https://www.linkedin.com/in/davide-pichler. Feel free to reach out directly if you have any questions!', 'bot');
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
      // Only focus the input if not on a mobile device
      if (!/Mobi|Android|iPhone|iPad|iPod|Opera Mini|IEMobile|BlackBerry/i.test(navigator.userAgent)) {
        userInput.focus();
      }
    });
  });
}

// Mouse drag-to-scroll for suggestions bar (smoother)
if (suggestionsBar) {
  let isDown = false;
  let startX;
  let scrollLeft;
  let animationFrame;

  suggestionsBar.style.cursor = 'grab';

  function smoothScroll(newScroll) {
    suggestionsBar.scrollLeft = newScroll;
  }

  suggestionsBar.addEventListener('mousedown', (e) => {
    isDown = true;
    suggestionsBar.classList.add('dragging');
    suggestionsBar.style.cursor = 'grabbing';
    startX = e.pageX - suggestionsBar.offsetLeft;
    scrollLeft = suggestionsBar.scrollLeft;
  });
  suggestionsBar.addEventListener('mouseleave', () => {
    isDown = false;
    suggestionsBar.classList.remove('dragging');
    suggestionsBar.style.cursor = 'grab';
    cancelAnimationFrame(animationFrame);
  });
  suggestionsBar.addEventListener('mouseup', () => {
    isDown = false;
    suggestionsBar.classList.remove('dragging');
    suggestionsBar.style.cursor = 'grab';
    cancelAnimationFrame(animationFrame);
  });
  suggestionsBar.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - suggestionsBar.offsetLeft;
    const walk = (x - startX) * 0.7; // slower, smoother
    if (animationFrame) cancelAnimationFrame(animationFrame);
    animationFrame = requestAnimationFrame(() => smoothScroll(scrollLeft - walk));
  });
}
