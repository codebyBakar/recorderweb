let recorder;
let chunks = [];
let stream;
let isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// Update screen info based on device
if (isMobile) {
  document.getElementById('screenInfoText').innerHTML = '📱 Android: Select "Screen Record" or "Cast" when prompted • iPhone: Screen recording requires iOS 15+';
} else {
  document.getElementById('screenInfoText').innerHTML = '🖥️ Select which window or screen you want to share';
}

// 🔁 Switch sections
function showSection(id) {
  document.querySelectorAll(".section").forEach(sec => sec.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  
  // Reset UI
  resetUI();
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
      video: { 
        facingMode: 'user',
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }, 
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
        noiseSuppression: true,
        sampleRate: 44100
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

// 🖥 SCREEN RECORDING - Works on both Android and Desktop
async function startScreen() {
  try {
    resetUI();
    
    // Check if browser supports getDisplayMedia
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      showError('Screen recording is not supported in this browser');
      return;
    }
    
    // Try screen recording with appropriate constraints for mobile/desktop
    const constraints = {
      video: true,
      audio: true
    };
    
    // On Android, we need to be more specific
    if (isMobile) {
      // For Android, this will trigger the screen recording permission
      constraints.video = {
        mediaSource: 'screen'
      };
    }
    
    // Request screen capture
    stream = await navigator.mediaDevices.getDisplayMedia(constraints);
    
    // Check if we got video tracks
    if (stream.getVideoTracks().length === 0) {
      throw new Error('No video track available');
    }
    
    // Display the stream
    document.getElementById("screenPreview").srcObject = stream;
    document.getElementById("screenStartBtn").disabled = true;
    document.getElementById("screenStopBtn").disabled = false;
    
    // Handle user cancellation (closing the share dialog)
    stream.getVideoTracks()[0].onended = () => {
      if (recorder && recorder.state === "recording") {
        stopRecording();
      }
      document.getElementById("screenStartBtn").disabled = false;
      document.getElementById("screenStopBtn").disabled = true;
    };
    
    // Try to add audio if available
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true
        }
      });
      audioStream.getAudioTracks().forEach(track => {
        stream.addTrack(track);
      });
    } catch (audioError) {
      console.log('No microphone available for screen recording');
      // Continue without audio
    }
    
    startRecorder("screenDownload", "screenPreview");
    
  } catch (error) {
    console.error('Screen recording error:', error);
    
    // Handle specific errors with user-friendly messages
    if (error.name === 'NotAllowedError' || error.message.includes('Permission')) {
      showError('Screen recording permission was denied. Please allow access to share your screen.');
    } else if (error.name === 'NotFoundError' || error.message.includes('No source')) {
      showError('No screen or window selected for sharing.');
    } else if (error.name === 'NotSupportedError' || error.message.includes('support')) {
      showError('Screen recording is not fully supported on this device/browser.');
    } else if (error.name === 'AbortError' || error.message.includes('cancelled')) {
      showError('Screen recording was cancelled.');
    } else {
      showError('Could not start screen recording: ' + (error.message || 'Unknown error'));
    }
    
    // Reset UI
    document.getElementById("screenStartBtn").disabled = false;
    document.getElementById("screenStopBtn").disabled = true;
  }
}

// 🎬 Common recorder logic
function startRecorder(downloadId, previewId) {
  chunks = [];
  
  // Determine best MIME type
  let mimeType = 'video/webm';
  if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
    mimeType = 'video/webm;codecs=vp9,opus';
  } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
    mimeType = 'video/webm;codecs=vp8,opus';
  }
  
  try {
    recorder = new MediaRecorder(stream, {
      mimeType: mimeType,
      videoBitsPerSecond: 2500000,
      audioBitsPerSecond: 128000
    });
  } catch (e) {
    // Fallback to default
    recorder = new MediaRecorder(stream);
  }

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
