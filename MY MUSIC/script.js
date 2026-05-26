// SONG LIST
const songs = [
    "TILL I COLLAPSE.mp3",
    "AINT NO LOVE IN ALCOHOMA.mp3",
    "BULLETPROOF.mp3",
    "DESIRE.mp3",
    "IM GOOD.mp3",
    "The Old World Is Real (Cover).mp3",
    "TURN DOWN FOR WHAT.mp3",
    "THIS IS THE LIFE.mp3"   // ⭐ NEW SONG ADDED
];



let currentSongIndex = null;
let audio = document.getElementById("audioElement");
let isPlaying = false;

let audioContext = null;
let analyser = null;
let track = null;

// NEW EFFECT NODES
let volumeNode = null;
let bassFilter = null;
let reverbNode = null;
let reverbGain = null;

const songListDiv = document.getElementById("songList");
const playPauseBtn = document.getElementById("playPause");
const seekBar = document.getElementById("seekBar");
const currentSongLabel = document.getElementById("currentSong");

// BUILD SONG LIST
songs.forEach((song, index) => {
    const div = document.createElement("div");
    div.textContent = song.replace(".mp3", "");
    div.onclick = () => loadSong(index);
    songListDiv.appendChild(div);
});

function loadSong(index) {
    currentSongIndex = index;
    audio.src = "songs/" + songs[index];
    currentSongLabel.textContent = songs[index].replace(".mp3", "");
    audio.play();
    isPlaying = true;
    playPauseBtn.textContent = "Pause";

    // CREATE AUDIO CONTEXT + ANALYSER HERE
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;

        track = audioContext.createMediaElementSource(audio);

        // 🔥 BASS FILTER
        bassFilter = audioContext.createBiquadFilter();
        bassFilter.type = "lowshelf";
        bassFilter.frequency.value = 200;
        bassFilter.gain.value = 0;

        // 🔥 VOLUME NODE
        volumeNode = audioContext.createGain();
        volumeNode.gain.value = 1;

        // 🔥 REVERB NODE
        reverbNode = audioContext.createConvolver();

        // Create impulse response (small room)
        const impulse = audioContext.createBuffer(2, audioContext.sampleRate * 2, audioContext.sampleRate);
        for (let c = 0; c < impulse.numberOfChannels; c++) {
            let channel = impulse.getChannelData(c);
            for (let i = 0; i < channel.length; i++) {
                channel[i] = (Math.random() * 2 - 1) * (1 - i / channel.length);
            }
        }
        reverbNode.buffer = impulse;

        // 🔥 REVERB MIX CONTROL
        reverbGain = audioContext.createGain();
        reverbGain.gain.value = 0; // default: no reverb

        // 🔥 ROUTING:
        // DRY PATH
        track.connect(bassFilter);
        bassFilter.connect(volumeNode);
        volumeNode.connect(analyser);
        analyser.connect(audioContext.destination);

        // WET PATH (reverb)
        track.connect(reverbNode);
        reverbNode.connect(reverbGain);
        reverbGain.connect(audioContext.destination);

        audioContext.resume();

        drawWaveform();
        reactiveBackground();
    }

    audio.onloadedmetadata = () => {
        seekBar.max = audio.duration;
    };

    audio.ontimeupdate = () => {
        seekBar.value = audio.currentTime;
    };
}

playPauseBtn.onclick = () => {
    if (!audio.src) return;

    if (isPlaying) {
        audio.pause();
        playPauseBtn.textContent = "Play";
    } else {
        audio.play();
        playPauseBtn.textContent = "Pause";
        if (audioContext) audioContext.resume();
    }
    isPlaying = !isPlaying;
};

seekBar.oninput = () => {
    audio.currentTime = seekBar.value;
};

// SPEED CONTROL
const speedControl = document.getElementById("speedControl");
const speedValue = document.getElementById("speedValue");

speedControl.oninput = () => {
    audio.playbackRate = speedControl.value;
    speedValue.textContent = speedControl.value + "x";
};

//  VOLUME CONTROL
const volumeControl = document.getElementById("volumeControl");
volumeControl.oninput = () => {
    if (volumeNode) volumeNode.gain.value = volumeControl.value;
};

//  BASS CONTROL
const bassControl = document.getElementById("bassControl");
bassControl.oninput = () => {
    if (bassFilter) bassFilter.gain.value = bassControl.value;
};

//  REVERB CONTROL
const reverbControl = document.getElementById("reverbControl");
reverbControl.oninput = () => {
    if (reverbGain) reverbGain.gain.value = reverbControl.value;
};

// VISUALIZER
const canvas = document.getElementById("visualizer");
const ctx = canvas.getContext("2d");

// WAVEFORM VISUALIZER (ORANGE)
function drawWaveform() {
    requestAnimationFrame(drawWaveform);

    if (!analyser) return;

    const bufferLength = analyser.fftSize;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteTimeDomainData(dataArray);

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.lineWidth = 2;
    ctx.strokeStyle = "#ff7b00";
    ctx.beginPath();

    const sliceWidth = canvas.width / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * (canvas.height / 2);

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);

        x += sliceWidth;
    }

    ctx.stroke();
}

// BACKGROUND REACTS TO MUSIC (BLACK + ORANGE GLOW)
function reactiveBackground() {
    requestAnimationFrame(reactiveBackground);

    if (!analyser) return;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);

    const bass = dataArray[1] + dataArray[2] + dataArray[3] + dataArray[4];
    const intensity = Math.min(100, bass / 4);
    const alpha = (intensity / 100) * 0.4;

    document.body.style.background = `
        radial-gradient(circle,
            rgba(255,123,0,${alpha}),
            rgba(0,0,0,1)
        )
    `;
}

/* MINI PLAYER LOGIC ---------------------------------------- */

const miniBtn = document.getElementById("miniPlayerBtn");
const miniPlayer = document.getElementById("miniPlayer");
const miniSongName = document.getElementById("miniSongName");
const miniPlayPause = document.getElementById("miniPlayPause");
const miniSeek = document.getElementById("miniSeek");
const exitMini = document.getElementById("exitMini");

// OPEN MINI PLAYER
miniBtn.onclick = () => {
    miniPlayer.style.display = "block";
    miniSongName.textContent = currentSongLabel.textContent;
};

// EXIT MINI PLAYER
exitMini.onclick = () => {
    miniPlayer.style.display = "none";
};

// MINI PLAY/PAUSE BUTTON
miniPlayPause.onclick = () => {
    playPauseBtn.click(); // syncs with main button
};

// MINI SEEK BAR
miniSeek.oninput = () => {
    audio.currentTime = miniSeek.value;
};

// SYNC SEEK BARS
audio.ontimeupdate = () => {
    seekBar.value = audio.currentTime;
    miniSeek.value = audio.currentTime;
};

// UPDATE MINI SONG NAME WHEN SONG CHANGES
function updateMiniSongName() {
    miniSongName.textContent = currentSongLabel.textContent;
}
