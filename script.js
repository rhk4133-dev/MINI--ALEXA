const chat = document.getElementById("chat");
const talkBtn = document.getElementById("talkBtn");
const statusEl = document.getElementById("status");

const synth = window.speechSynthesis;
let recognition;

// Your Gemini API key (do NOT share publicly for real use)
const API_KEY = "AIzaSyDRBsA1iFrgrtF_QNRSkGsJ468ZmDfmPJ4";

function addMessage(text, cls) {
  const div = document.createElement("div");
  div.className = "msg " + cls;
  div.textContent = text;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

function speak(text) {
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "en-IN";
  synth.cancel();
  synth.speak(utter);
}

async function askGemini(prompt) {
  addMessage(prompt, "user");
  addMessage("Thinking...", "bot");

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      }
    );

    const data = await res.json();

    chat.lastChild.remove(); // remove "Thinking..."

    if (data.candidates && data.candidates.length > 0) {
      const reply = data.candidates[0].content.parts[0].text;
      addMessage(reply, "bot");
      speak(reply);
    } else {
      addMessage("No response received.", "bot");
      speak("Sorry, I didn't get a response.");
    }
  } catch (err) {
    chat.lastChild.remove();
    addMessage("Error: " + err.message, "bot");
    speak("An error occurred.");
  }
}

function startListening() {
  if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
    alert("Speech Recognition not supported in this browser.");
    return;
  }

  recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = "en-IN";
  recognition.continuous = false;

  recognition.onstart = () => {
    statusEl.textContent = "Status: Listening...";
    talkBtn.disabled = true;
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript.trim();
    statusEl.textContent = "Status: Processing...";
    askGemini(transcript);
  };

  recognition.onerror = (event) => {
    statusEl.textContent = "Status: Error - " + event.error;
    talkBtn.disabled = false;
  };

  recognition.onend = () => {
    statusEl.textContent = "Status: Not listening";
    talkBtn.disabled = false;
  };

  recognition.start();
}

talkBtn.addEventListener("click", () => {
  startListening();
});
