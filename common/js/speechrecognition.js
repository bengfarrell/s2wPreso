function SpeechRecognition() {

    var self = this;

    /** command/callbacks to listen for and throw events on */
    this._commands = [];

    /** if speech shuts down, should we start back up */
    this.keepAlive = false;

    /** running tally of interim results */
    this._interimTranscript = "";

    /** running tally of final transcript */
    this._finalTranscript = "";

    /** callbacks */
    this._speechEndCallbacks = [];
    this._speechErrorCallbacks = [];
    this._speechResultsCallbacks = [];
    this._speechStartCallbacks = [];
    this._speechStopCallbacks = [];

    /**
     * c-tor
     */
    this.constructor = function() {
        self._speech = new webkitSpeechRecognition();
        self._speech.continuous = true;
        self._speech.interimResults = true;
        self._speech.onresult = self.onSpeechResult;
        self._speech.onend = self.onSpeechEnd;
        self._speech.onerror = self.onSpeechError;
    }

    /**
     * add listener
     * @param eventType
     * @param callback
     */
    this.addListener = function(eventType, callback) {
        switch (eventType) {
            case SpeechRecognition.Event.START:
                self._speechStartCallbacks.push(callback);
                break;

            case SpeechRecognition.Event.STOP:
                self._speechStopCallbacks.push(callback);
                break;

            case SpeechRecognition.Event.END:
                self._speechEndCallbacks.push(callback);
                break;

            case SpeechRecognition.Event.ERROR:
                self._speechErrorCallbacks.push(callback);
                break;

            case SpeechRecognition.Event.RESULTS:
                self._speechResultsCallbacks.push(callback);
                break;
        }
    }

    /**
     * start speech recognition
     */
    this.start = function() {
        self._speech.start();
        for (var cb in self._speechStartCallbacks) {
            self._speechStartCallbacks[cb].apply(self);
        }
    }

    /**
     * stop speech recognition
     */
    this.stop = function() {
        self._speech.stop();
        for (var cb in self._speechStopCallbacks) {
            self._speechStopCallbacks[cb].apply(self);
        }
    }

    /**
     * on speech result event from web speech API
     * @param event
     */
    this.onSpeechResult = function(event) {
        for (var i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                self._finalTranscript += event.results[i][0].transcript;
            } else {
                self._interimTranscript += event.results[i][0].transcript;
            }

            for (var cb in self._speechResultsCallbacks) {
                self._speechResultsCallbacks[cb].apply(self, [{"final": self._finalTranscript, "interim": self._interimTranscript}] );
            }

            for (var command in self._commands) {
                for (var word in self._commands[command].words) {
                    if (self._finalTranscript.toLowerCase().indexOf(self._commands[command].words[word].toLowerCase()) != -1) {
                        // cut the command leaving the freeform words
                        var w = self._commands[command].words[word];
                        var ftransIndex = self._finalTranscript.indexOf(w);
                        var itransIndex = self._interimTranscript.indexOf(w);
                        self._finalTranscript = self._finalTranscript.substr(0, ftransIndex) + self._finalTranscript.substr(ftransIndex + w.length, self._finalTranscript.length);
                        self._interimTranscript = self._interimTranscript.substr(0, ftransIndex) + self._interimTranscript.substr(ftransIndex + w.length, self._interimTranscript.length);

                        self._commands[command].command.apply(self, [{ "word" : w, "transcript": self._finalTranscript }]);
                        self._finalTranscript = "";
                        self._interimTranscript = "";
                    }
                }
            }
        }
    }

    /**
     * add command
     * @param word
     * @param command/function
     */
    this.addCommand = function(words, command) {
        if ( typeof(words) === "string" ) {
            words = [words];
        }
        self._commands.push( {"words": words, "command": command } );
    }

    /**
     * clear commands to listen for
     */
    this.clearCommands = function() {
        self._commands = [];
    }

    /**
     * on speech error event from web speech API
     * @param event
     */
    this.onSpeechError = function(event) {
        console.log(event)

        for (var cb in self._speechErrorCallbacks) {
            self._speechErrorCallbacks[cb].apply(self, [event]);
        }
    }

    /**
     * on speech end event, from the web speech API
     * @param event
     */
    this.onSpeechEnd = function(event) {
        if (self.keepAlive) {
            speech.start();
        } else {
            for (var cb in self._speechEndCallbacks) {
                self._speechEndCallbacks[cb].apply(self, [event]);
            }
        }
    }

    this.constructor();
}

SpeechRecognition.Event = {};
SpeechRecognition.Event.START = "onSpeechStart";
SpeechRecognition.Event.STOP = "onSpeechStop";
SpeechRecognition.Event.END = "onSpeechEnd"
SpeechRecognition.Event.ERROR = "onSpeechError";
SpeechRecognition.Event.RESULTS = "onSpeechResults";