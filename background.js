let timerEndTime = 0;
let isPaused = false;
let pausedTimeLeft = 0;
let isSoundEnabled = true;

chrome.storage.local.get(
  ["timerEndTime", "isPaused", "pausedTimeLeft", "soundEnabled"],
  (data) => {
    timerEndTime = data.timerEndTime || 0;
    isPaused = data.isPaused || false;
    pausedTimeLeft = data.pausedTimeLeft || 0;
    isSoundEnabled = data.soundEnabled !== undefined ? data.soundEnabled : true;
  }
);

function saveTimerState() {
  chrome.storage.local.set({
    timerEndTime,
    isPaused,
    pausedTimeLeft,
    soundEnabled: isSoundEnabled,
  });
}

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

function startTimer() {
  if (!isRunning) {
    chrome.runtime.sendMessage({ action: "getTimeLeft" }, (response) => {
      if (response && response.isPaused) {
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
    });
  } else {
    isRunning = false;
    startButton.innerHTML = '<i class="fas fa-play"></i>';
    chrome.runtime.sendMessage({ action: "pauseTimer" });
    playSound("pause");
  }
}

function getTimeLeft(sendResponse) {
  const timeLeft = isPaused
    ? pausedTimeLeft
    : Math.max(0, Math.round((timerEndTime - Date.now()) / 1000));

  sendResponse({ timeLeft, isPaused });
}

function pauseTimer() {
  isPaused = true;
  pausedTimeLeft = Math.max(0, Math.round((timerEndTime - Date.now()) / 1000));
  saveTimerState();
  chrome.alarms.clear("pomodoro");
  playSound("pause");
}

function resumeTimer() {
  isPaused = false;
  timerEndTime = Date.now() + pausedTimeLeft * 1000;
  saveTimerState();
  startAlarm(pausedTimeLeft);
  playSound("unpause");
}

function resetTimer() {
  timerEndTime = 0;
  isPaused = false;
  pausedTimeLeft = 0;
  saveTimerState();
  chrome.alarms.clear("pomodoro");
  playSound("reset");
}

function toggleSound(soundEnabled) {
  isSoundEnabled = soundEnabled;
  saveTimerState();
}

function playSound(action) {
  if (isSoundEnabled) {
    chrome.runtime.sendMessage({ action: "playSound", sound: action });
  }
}

function startAlarm(duration) {
  chrome.alarms.create("pomodoro", { delayInMinutes: duration / 60 });
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "pomodoro") {
    showNotification();
    resetTimer();
  }
});

function showNotification() {
  chrome.notifications.create({
    type: "basic",
    iconUrl: "icon.png",
    title: "Pomodoro Timer",
    message: "Time is up! Take a break.",
  });
}
