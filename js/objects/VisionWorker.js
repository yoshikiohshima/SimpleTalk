/**
 * VisionWorker
 * --------------------------------
 * I am a module representing an Actor that is
 * a WebWorker for dealing with communications with
 * a ULex Vision service.
 * As a WebWorker, I a optimized by the given browser
 * to run as a separate thread.
 * I handle all communication with a specified Vision
 * server and send any incoming messages to the System
 * object that has spawned me.
 * Note that as with all WebWorkers, this file is considered
 * the 'global scope'
 */
let VisionWorker = {
    _intervalId: null,
    isListening: false,
    pollTime: 250, // in milliseconds
    url: null,


    start: function(){
        if(!this.url){
            return this.sendError(
                'InvalidURL',
                'You have not set a valid URL for the VisionWorker'
            );
        }

        this.isListening = true;
        this._intervalId = setInterval(this.listenLoop.bind(this), this.pollTime);
    },

    listenLoop: function(){
        var self = this;
        fetch(self.url)
            .then(res => {
                return res.json();
            })
            .then(json => {
                self.processVisionResponse(json);
            })
            .catch(err => {
                self.isListening = false;
                clearInterval(self._intervalId);
                self.sendError(err.name, err.toString());
            });
    },

    processVisionResponse(coordinateArray){
        // The vision API should be returning
        // a simple array of arrays. The nested
        // arrays are of x, y, and radius values
        // respectively.
        // For this implementation of the vision
        // actor, we want to apply an average center
        // location in the case of multiple points
        // being sent in a single frame. We then will
        // sen the largest of any radius that came in
        // during the frame.
        if(coordinateArray.length == 0){
            return this.sendEmpty();
        }
        let totalX = 0;
        let totalY = 0;
        let maxRadius = 0;
        coordinateArray.forEach(coordinateInfo => {
            totalX += coordinateInfo[0];
            totalY += coordinateInfo[1];
            if(coordinateInfo[2] > maxRadius){
                maxRadius = coordinateInfo[2];
            }
        });

        return this.sendCoordinate([
            (totalX / coordinateArray.length),
            (totalY / coordinateArray.length),
            maxRadius
        ]);
        
    },
    
    /** Message Handling **/
    handleMessage: function(messageData){
        switch(messageData.type){
        case 'start':
            this.handleStart(messageData);
            break;
        case 'stop':
            this.handleStop();
            break;
        default:
            this.doesNotUnderstand(messageData);
        }
    },


    // Individual message handlers
    handleStart(messageData){
        if(messageData.url){
            this.url = messageData.url;
        }
        if(messageData.pollTime){
            if(messageData.pollTime < 60){
                this.pollTime = 60;
            } else {
                this.pollTime = messageData.pollTime;
            }
        }
        this.start();
    },

    handleStop(messageData){
        this.stop();
        postMessage({
            type: 'stopped'
        });
    },

    doesNotUnderstand: function(messageData){
        postMessage({
            type: 'doesNotUnderstand',
            originalMessage: messageData
        });
    },

    /** Message Sending **/
    sendCoordinate: function(coordArray){
        // The incoming coordArray is structured
        // as followed:
        // [0] = x
        // [1] = y
        // [2] = radius
        postMessage({
            type: 'coordinate',
            coordinate: coordArray
        });
    },

    sendEmpty: function(){
        postMessage({
            type: 'empty'
        });
    },

    sendError: function(errorName, errorMessage){
        postMessage({
            type: 'error',
            error: errorName,
            errorMessage: errorMessage
        });
    }
};


// We set the WeWorker's onmessage handler to be
// the VisionWorker's handleMessage method
onmessage = function(event){
    VisionWorker.handleMessage(event.data);
};
