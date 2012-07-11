var AudioContext = AudioContext || webkitAudioContext;
var audioSupported, audioCtx, mainVol, AOut;
var initAudio = function() {
    audioCtx = new AudioContext();
    if (audioCtx) {
        audioSupported = true;
        sampleRate = audioCtx.sampleRate;
        mainVol = audioCtx.createGainNode();
        // Connect MainVol to final destination
        mainVol.connect(audioCtx.destination);
        mainVol.gain.value = 0.5;
        AOut = audioCtx.createDynamicsCompressor();
        AOut.connect(mainVol);

        initAudioBuffers(sampleRate);
    }

}
var generateToneBuffer = function(sampleRate) {
    var toneTime = 1.8, n = toneTime * sampleRate, buffer = new Array(n), t, fade, freq = 110.0;
    //A2, Concert pitch A4 = 440Hz

    for (var i = 0; i < n; i++) {
        t = i / sampleRate;
        fade = (n - i) / n;
        fadeSqr = fade * fade;
        //prime harmonics
        buffer[i] = fade * Math.sin(freq * t * Math.PI * 2);
        buffer[i] += fadeSqr * Math.sin(freq * 2 * t * Math.PI * 2) / 2;
        buffer[i] += fadeSqr * fade * Math.sin(freq * 3 * t * Math.PI * 2) / 3;

    }
    //attack - smooth out the first bit...
    var smoothSamples = 164;
    for (var i = 0; i < smoothSamples; i++) {
        buffer[i] *= i / smoothSamples;
    }

    return buffer;
}
var AudioBuffers = {};
var initAudioBuffers = function(sampleRate) {
    // create the sound buffer for playing notes
    var toneDataBuffer = generateToneBuffer(sampleRate);
    AudioBuffers.toneBuffer = audioCtx.createBuffer(1, toneDataBuffer.length, sampleRate);
    AudioBuffers.toneBuffer.getChannelData(0).set(toneDataBuffer);

}
var trigBuffer = function(buffer, playbackRate) {
    var buffSource = audioCtx.createBufferSource();
    buffSource.buffer = buffer;

    buffSource.connect(AOut);

    if (playbackRate)
        buffSource.playbackRate.value = playbackRate;

    buffSource.noteOn(0);
}
var MPiece = function() {
    this.lpb = 4;
    this.bpm = 120;
    this.Modules = [];
    this.Connections = [];

    this.TimeLine = {};
}

MPiece.prototype.constructor = MPiece;

var Connection = function(from, to) {
    this.from = from;
    this.to = to;
}
Connection.prototype.constructor = Connection;

var MTrack = function() {
    this.Notes = [];
}
MTrack.prototype.constructor = MTrack;

var MNote = function() {
    this.noteCode = 'C4';
    this.vol = 100;
    this.fx = null;
}
MNote.prototype.constructor = MNote;
