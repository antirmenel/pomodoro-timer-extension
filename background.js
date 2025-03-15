let timerEndTime = 0;
let isPaused = false;
let pausedTimeLeft = 0;
let isSoundEnabled = true;

// Load saved state from storage
chrome.storage.local.get(
  ["timerEndTime", "isPaused", "pausedTimeLeft", "soundEnabled"],
  (data) => {
    timerEndTime = data.timerEndTime || 0;
    isPaused = data.isPaused || false;
    pausedTimeLeft = data.pausedTimeLeft || 0;
    isSoundEnabled = data.soundEnabled !== undefined ? data.soundEnabled : true;
  }
);

// Save the current state to storage
function saveTimerState() {
  chrome.storage.local.set({
    timerEndTime,
    isPaused,
    pausedTimeLeft,
    soundEnabled: isSoundEnabled,
  });
}

// Handle messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { action, duration, soundEnabled } = message;

  switch (action) {
    case "startTimer":
      startTimer(duration);
      break;
    case "getTimeLeft":
      getTimeLeft(sendResponse);
      break;
    case "pauseTimer":
      pauseTimer();
      break;
    case "resumeTimer":
      resumeTimer();
      break;
    case "resetTimer":
      resetTimer();
      break;
    case "toggleSound":
      toggleSound(soundEnabled);
      break;
    default:
      break;
  }
  return true;
});

// Start the timer
function startTimer(duration) {
  timerEndTime = Date.now() + duration * 1000;
  isPaused = false;
  saveTimerState();
  startAlarm(duration);
  playSound("start");
}

// Get the remaining time
function getTimeLeft(sendResponse) {
  const timeLeft = isPaused
    ? pausedTimeLeft
    : Math.max(0, Math.round((timerEndTime - Date.now()) / 1000));

  sendResponse({ timeLeft, isPaused });
}

// Pause the timer
function pauseTimer() {
  isPaused = true;
  pausedTimeLeft = Math.max(0, Math.round((timerEndTime - Date.now()) / 1000));
  saveTimerState();
  chrome.alarms.clear("pomodoro");
  playSound("pause");
}

// Resume the timer
function resumeTimer() {
  isPaused = false;
  timerEndTime = Date.now() + pausedTimeLeft * 1000;
  saveTimerState();
  startAlarm(pausedTimeLeft);
  playSound("unpause");
}

// Reset the timer
function resetTimer() {
  timerEndTime = 0;
  isPaused = false;
  pausedTimeLeft = 0;
  saveTimerState();
  chrome.alarms.clear("pomodoro");
  playSound("reset");
}

// Toggle sound on/off
function toggleSound(soundEnabled) {
  isSoundEnabled = soundEnabled;
  saveTimerState();
}

// Play a sound
function playSound(action) {
  if (isSoundEnabled) {
    chrome.runtime.sendMessage({ action: "playSound", sound: action });
  }
}

// Start an alarm
function startAlarm(duration) {
  chrome.alarms.create("pomodoro", { delayInMinutes: duration / 60 });
}

// Handle alarm events
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "pomodoro") {
    showNotification();
    resetTimer();
  }
});

// Show a notification
function showNotification() {
  chrome.notifications.create({
    type: "basic",
    iconUrl: "icon.png",
    title: "Pomodoro Timer",
    message: "Time is up! Take a break.",
  });
}