let recorder;
let chunks = [];
let stream;
let isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// Show mobile message if on mobile


if (isMobile) {
  document.getElementById('mobileScreenMessage').style.display = "block";
}

// 🔁 Switch sections
function showSection(id) {
  document.querySelectorAll(".section").forEach(sec => sec.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  
  // Reset UI
  resetUI();
  
  // Update mobile message for screen section
  if (id === 'screenSection' && isMobile) {
    document.getElementById('mobileScreenMessage').classList.add('show');
  }
}

// Reset UI elements
function resetUI() {
  // Reset download links
  document.querySelectorAll('.download-link').forEach(link => {
    link.classList.remove('active');
  });
  
  // Reset buttons
  document.querySelectorAll('.controls button').forEach(btn => {
    btn.disabled = false;
  });
  document.getElementById('videoStopBtn').disabled = true;
  document.getElementById('audioStopBtn').disabled = true;
  document.getElementById('screenStopBtn').disabled = true;
  
  // Reset audio preview
  const audioPreview = document.getElementById('audioPreview');
  audioPreview.pause();
  audioPreview.currentTime = 0;
  document.getElementById('playPreviewBtn')?.classList.remove('playing');
  document.getElementById('playIcon')?.classList.remove('fa-pause');
  document.getElementById('playIcon')?.classList.add('fa-play');
  document.getElementById('audioPreviewContainer').classList.remove('active');
  document.getElementById('recordingIndicator').classList.remove('active');
}

// Show error message
function showError(message) {
  document.getElementById('errorText').textContent = message;
  document.getElementById('errorMessage').classList.add('show');
  setTimeout(() => {
    document.getElementById('errorMessage').classList.remove('show');
  }, 4000);
}

// 🎥 VIDEO RECORDING
async function startVideo() {
  try {
    resetUI();
    stream = await navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: 'user' }, 
      audio: true 
    });
    document.getElementById("videoPreview").srcObject = stream;
    document.getElementById("videoStartBtn").disabled = true;
    document.getElementById("videoStopBtn").disabled = false;
    startRecorder("videoDownload", "videoPreview");
  } catch (error) {
    showError('Camera access denied or not available');
    console.error(error);
  }
}

// 🎤 AUDIO ONLY RECORDING
async function startAudio() {
  try {
    resetUI();
    stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: true
      } 
    });
    
    document.getElementById('recordingIndicator').classList.add('active');
    document.getElementById("audioStartBtn").disabled = true;
    document.getElementById("audioStopBtn").disabled = false;
    
    startRecorder("audioDownload", "audioPreview");
  } catch (error) {
    showError('Microphone access denied or not available');
    console.error(error);
  }
}

// 🖥 SCREEN RECORDING - Mobile friendly
async function startScreen() {
  resetUI();

  // ❗ Detect mobile
  if (isMobile) {
    showError("Screen recording is not supported on mobile browsers.");
    return;
  }

  // ❗ Check support
  if (!navigator.mediaDevices.getDisplayMedia) {
    showError("Screen recording not supported in this browser.");
    return;
  }

  try {
    stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true
    });

    document.getElementById("screenPreview").srcObject = stream;
    document.getElementById("screenStartBtn").disabled = true;
    document.getElementById("screenStopBtn").disabled = false;

    // Stop when user ends sharing
    stream.getVideoTracks()[0].onended = () => stopRecording();

    startRecorder("screenDownload", "screenPreview");

  } catch (error) {
    showError("Screen recording permission denied.");
  }
}

// 🎬 Common recorder logic
function startRecorder(downloadId, previewId) {
  chunks = [];
  
  // Determine MIME type
  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus') 
    ? 'video/webm;codecs=vp9,opus'
    : 'video/webm';
  
  recorder = new MediaRecorder(stream, {
    mimeType: mimeType,
    videoBitsPerSecond: 2500000,
    audioBitsPerSecond: 128000
  });

  recorder.ondataavailable = e => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  recorder.onstop = () => {
    const blob = new Blob(chunks, { type: "video/webm" });
    const url = URL.createObjectURL(blob);

    const preview = document.getElementById(previewId);
    if (preview.tagName === 'VIDEO') {
      preview.srcObject = null;
      preview.src = url;
      preview.controls = true;
    } else if (preview.tagName === 'AUDIO') {
      preview.src = url;
      document.getElementById('audioPreviewContainer').classList.add('active');
    }

    document.getElementById(downloadId).href = url;
    document.getElementById(downloadId).classList.add('active');

    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    
    // Hide recording indicator for audio
    if (previewId === "audioPreview") {
      document.getElementById('recordingIndicator').classList.remove('active');
    }
    
    // Reset buttons
    resetButtons();
  };

  recorder.start();
}

// Reset buttons after recording
function resetButtons() {
  document.getElementById('videoStartBtn').disabled = false;
  document.getElementById('videoStopBtn').disabled = true;
  document.getElementById('audioStartBtn').disabled = false;
  document.getElementById('audioStopBtn').disabled = true;
  document.getElementById('screenStartBtn').disabled = false;
  document.getElementById('screenStopBtn').disabled = true;
}

// ⛔ Stop recording
function stopRecording() {
  if (recorder && recorder.state !== "inactive") {
    recorder.stop();
  }
}

// 🎵 Toggle audio preview
function togglePlayPreview() {
  const audio = document.getElementById('audioPreview');
  const playBtn = document.getElementById('playPreviewBtn');
  const playIcon = document.getElementById('playIcon');
  
  if (audio.paused) {
    audio.play();
    playBtn.classList.add('playing');
    playIcon.classList.remove('fa-play');
    playIcon.classList.add('fa-pause');
  } else {
    audio.pause();
    playBtn.classList.remove('playing');
    playIcon.classList.remove('fa-pause');
    playIcon.classList.add('fa-play');
  }
}

// Handle audio end
document.getElementById('audioPreview')?.addEventListener('ended', () => {
  const playBtn = document.getElementById('playPreviewBtn');
  const playIcon = document.getElementById('playIcon');
  playBtn.classList.remove('playing');
  playIcon.classList.remove('fa-pause');
  playIcon.classList.add('fa-play');
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
});


