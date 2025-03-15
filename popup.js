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

chrome.storage.local.get(["soundEnabled"], (data) => {
  if (data.soundEnabled !== undefined) {
    isSoundEnabled = data.soundEnabled;
  }
  updateSoundButton();
});

function playSound(type) {
  if (isSoundEnabled && sounds[type]) {
    sounds[type].play();
  }
}

function updateTimerDisplay(timeLeft) {
  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const seconds = String(timeLeft % 60).padStart(2, "0");
  timerDisplay.textContent = `${minutes}:${seconds}`;
}

function updateSoundButton() {
  soundToggleButton.innerHTML = isSoundEnabled
    ? '<i class="fas fa-volume-up"></i>'
    : '<i class="fas fa-volume-mute"></i>';
}

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

function handlePause(timeLeft) {
  isRunning = false;
  startButton.innerHTML = '<i class="fas fa-play"></i>';
  updateTimerDisplay(timeLeft);
}

function handleRunning(timeLeft) {
  isRunning = true;
  startButton.innerHTML = '<i class="fas fa-pause"></i>';
  updateTimerDisplay(timeLeft);
  setTimeout(fetchTimeLeft, 1000);
}

function handleCompletion() {
  isRunning = false;
  startButton.innerHTML = '<i class="fas fa-play"></i>';
  updateTimerDisplay(25 * 60);
}

function startTimer() {
  if (!isRunning) {
    if (startButton.innerHTML.includes("Resume")) {
      chrome.runtime.sendMessage({ action: "resumeTimer" });
      playSound("unpause");
      startButton.innerHTML = '<i class="fas fa-pause"></i>';
    } else {
      const duration = 25 * 60;
      chrome.runtime.sendMessage({ action: "startTimer", duration });
      playSound("start");
      startButton.innerHTML = '<i class="fas fa-pause"></i>';
    }
    isRunning = true;
    fetchTimeLeft();
  } else {
    isRunning = false;
    startButton.innerHTML = '<i class="fas fa-play"></i>';
    chrome.runtime.sendMessage({ action: "pauseTimer" });
    playSound("pause");
  }
}

function resetTimer() {
  isRunning = false;
  startButton.innerHTML = '<i class="fas fa-play"></i>';
  chrome.runtime.sendMessage({ action: "resetTimer" });
  updateTimerDisplay(25 * 60);
  playSound("reset");
}

function toggleSound() {
  isSoundEnabled = !isSoundEnabled;
  updateSoundButton();
  chrome.storage.local.set({ soundEnabled: isSoundEnabled });
}

fetchTimeLeft();

startButton.addEventListener("click", startTimer);
resetButton.addEventListener("click", resetTimer);
soundToggleButton.addEventListener("click", toggleSound);
