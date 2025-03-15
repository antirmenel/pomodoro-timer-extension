let isRunning = false;
let isSoundEnabled = true;

const timerDisplay = document.getElementById("timer");
const startButton = document.getElementById("start");
const resetButton = document.getElementById("reset");
const soundToggleButton = document.getElementById("soundToggle");

const sounds = {
  start: new Audio("sounds/start.mp3"),
  pause: new Audio("sounds/pause.mp3"),
  reset: new Audio("sounds/reset.mp3"),
  unpause: new Audio("sounds/unpause.mp3"),
};

// Load sound preference from storage
chrome.storage.local.get(["soundEnabled"], (data) => {
  if (data.soundEnabled !== undefined) {
    isSoundEnabled = data.soundEnabled;
  }
  updateSoundButton();
});

// Play a sound
function playSound(type) {
  if (isSoundEnabled && sounds[type]) {
    sounds[type].play();
  }
}

// Update the timer display
function updateTimerDisplay(timeLeft) {
  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const seconds = String(timeLeft % 60).padStart(2, "0");
  timerDisplay.textContent = `${minutes}:${seconds}`;
}

// Update the sound button icon
function updateSoundButton() {
  soundToggleButton.innerHTML = isSoundEnabled
    ? '<i class="fas fa-volume-up"></i>'
    : '<i class="fas fa-volume-mute"></i>';
}

// Fetch the remaining time from the background script
function fetchTimeLeft() {
  chrome.runtime.sendMessage({ action: "getTimeLeft" }, (response) => {
    if (response) {
      if (response.isPaused) {
        handlePause(response.timeLeft);
      } else if (response.timeLeft > 0) {
        handleRunning(response.timeLeft);
      } else {
        handleCompletion();
      }
    }
  });
}

// Handle paused state
function handlePause(timeLeft) {
  isRunning = false;
  startButton.innerHTML = '<i class="fas fa-play"></i>';
  updateTimerDisplay(timeLeft);
}

// Handle running state
function handleRunning(timeLeft) {
  isRunning = true;
  startButton.innerHTML = '<i class="fas fa-pause"></i>';
  updateTimerDisplay(timeLeft);
  setTimeout(fetchTimeLeft, 1000);
}

// Handle completed state
function handleCompletion() {
  isRunning = false;
  startButton.innerHTML = '<i class="fas fa-play"></i>';
  updateTimerDisplay(25 * 60);
}

// Start or resume the timer
function startTimer() {
  if (!isRunning) {
    // Check if the timer is paused
    chrome.runtime.sendMessage({ action: "getTimeLeft" }, (response) => {
      if (response && response.isPaused) {
        // If paused, resume the timer
        chrome.runtime.sendMessage({ action: "resumeTimer" });
        playSound("unpause");
        startButton.innerHTML = '<i class="fas fa-pause"></i>';
      } else {
        // If not paused, start a new timer
        const duration = 25 * 60;
        chrome.runtime.sendMessage({ action: "startTimer", duration });
        playSound("start");
        startButton.innerHTML = '<i class="fas fa-pause"></i>';
      }
      isRunning = true;
      fetchTimeLeft();
    });
  } else {
    // If running, pause the timer
    isRunning = false;
    startButton.innerHTML = '<i class="fas fa-play"></i>';
    chrome.runtime.sendMessage({ action: "pauseTimer" });
    playSound("pause");
  }
}

// Reset the timer
function resetTimer() {
  isRunning = false;
  startButton.innerHTML = '<i class="fas fa-play"></i>';
  chrome.runtime.sendMessage({ action: "resetTimer" });
  updateTimerDisplay(25 * 60);
  playSound("reset");
}

// Toggle sound on/off
function toggleSound() {
  isSoundEnabled = !isSoundEnabled;
  updateSoundButton();
  chrome.storage.local.set({ soundEnabled: isSoundEnabled });
}

// Initialize the timer display
fetchTimeLeft();

// Add event listeners
startButton.addEventListener("click", startTimer);
resetButton.addEventListener("click", resetTimer);
soundToggleButton.addEventListener("click", toggleSound);