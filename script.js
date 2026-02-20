let recorder;
let chunks = [];
let stream;

// 🔁 Switch sections
function showSection(id) {
  document.querySelectorAll(".section").forEach(sec => sec.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  
  // Reset audio preview when switching sections
  if (id !== 'audioSection') {
    const audioPreview = document.getElementById('audioPreview');
    audioPreview.pause();
    audioPreview.currentTime = 0;
    document.getElementById('playPreviewBtn')?.classList.remove('playing');
    document.getElementById('playIcon')?.classList.remove('fa-pause');
    document.getElementById('playIcon')?.classList.add('fa-play');
  }
}

// 🎥 VIDEO RECORDING
async function startVideo() {
  stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  document.getElementById("videoPreview").srcObject = stream;
  startRecorder("videoDownload", "videoPreview");
  
  // Disable download link until recording stops
  document.getElementById("videoDownload").classList.remove("active");
}

// 🎤 AUDIO ONLY RECORDING
async function startAudio() {
  // Reset audio preview
  const audioPreview = document.getElementById('audioPreview');
  audioPreview.pause();
  audioPreview.currentTime = 0;
  document.getElementById('playPreviewBtn')?.classList.remove('playing');
  document.getElementById('playIcon')?.classList.remove('fa-pause');
  document.getElementById('playIcon')?.classList.add('fa-play');
  
  // Hide preview container
  document.getElementById('audioPreviewContainer').classList.remove('active');
  
  stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  
  // Show recording indicator
  document.getElementById('recordingIndicator').classList.add('active');
  
  startRecorder("audioDownload", "audioPreview");
  
  // Disable download link until recording stops
  document.getElementById("audioDownload").classList.remove("active");
}

// 🖥 SCREEN RECORDING
async function startScreen() {
  stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
  document.getElementById("screenPreview").srcObject = stream;
  startRecorder("screenDownload", "screenPreview");
  
  // Disable download link until recording stops
  document.getElementById("screenDownload").classList.remove("active");
}

// 🎬 Common recorder logic
function startRecorder(downloadId, previewId) {
  chunks = [];
  recorder = new MediaRecorder(stream);

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
    } else if (preview.tagName === 'AUDIO') {
      preview.src = url;
      // Show preview container for audio
      document.getElementById('audioPreviewContainer').classList.add('active');
    }

    // Enable download link
    document.getElementById(downloadId).href = url;
    document.getElementById(downloadId).classList.add('active');

    stream.getTracks().forEach(track => track.stop());
    
    // Hide recording indicator for audio
    if (previewId === "audioPreview") {
      document.getElementById('recordingIndicator').classList.remove('active');
    }
  };

  recorder.start();
}

// ⛔ Stop recording
function stopRecording() {
  if (recorder && recorder.state !== "inactive") {
    recorder.stop();
  }
}

// 🎵 Toggle audio preview play/pause
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