/**
 * WorldStack
 * ---------------------------------------------------
 * I am a Stack part that represents the root of a
 * hierarchy of parts. I am the end of the ownership
 * chain for any given configuration of Parts.
 * I am also the final resolver of all unhandled
 * messages sent along the delegation chain for parts.
 * All parts can eventually resolve to me via the delegation
 * chain or ownership hierarchy.
 * There should only be one instance of me in any given
 * SimpleTalk environment.
 */
import Part from './Part.js';


class WorldStack extends Part {
    constructor(){
        super(null);

        this.acceptedSubpartTypes = ["stack"];

        // The currentStack is the
        // stack that should be currently displayed.
        this.currentStack = null; // TODO

        this.isWorld = true;

        // Add additional properties
        this.partProperties.newBasicProp(
            'currentStack',
            -1
        );

        this.partProperties.newBasicProp(
            'cursorPosition',
            []
        );
        this.partProperties.newBasicProp(
            'useVisionCursor',
            false
        );

        // Set the id property to always
        // be 'world'
        this.id = 'world';

        // Initialize the VisionWorker, but do
        // not start it yet
        this.visionWorker = new Worker('../VisionWorker.js');

        // Bind methods
        this.onVisionMessage = this.onVisionMessage.bind(this);
        this.visionWorker.onmessage = (event) => {
            this.onVisionMessage(event.data);
        };
    }

    propertyChanged(propertyName, newValue){
        if(propertyName == 'useVisionCursor'){
            this.toggleVisionCursor(newValue);
        }
        let message = {
            type: 'propertyChanged',
            propertyName: propertyName,
            value: newValue,
            partId: this.id
        };
        this._propertySubscribers.forEach(subscriber => {
            this.sendMessage(message, subscriber);
        });
    }

    toggleVisionCursor(shouldTurnOn){
        if(shouldTurnOn){
            this.visionWorker.postMessage({
                type: 'start',
                url: 'http://localhost:5000',
                pollTime: 60
            });
        } else {
            this.visionWorker.postMessage({
                type: 'stop'
            });
        }
    }

    onVisionMessage(message){
        switch(message.type){
        case 'stopped':
            this.partProperties.setPropertyNamed(
                this,
                'useVisionCursor',
                false
            );
            break;
        case 'coordinate':
            this.partProperties.setPropertyNamed(
                this,
                'cursorPosition',
                message.coordinate
            );
            break;
        case 'empty':
            this.partProperties.setPropertyNamed(
                this,
                'cursorPosition',
                []
            );
            break;
        case 'error':
            this.partProperties.setPropertyNamed(
                this,
                'useVisionCursor',
                false
            );
            this.sendMessage(message, this);
            break;
        default:
            this.sendMessage(message, this);
        }
    }

    get type(){
        return 'world';
    }

    get loadedStacks(){
        return this.subparts.filter(subpart => {
            return subpart.type == 'stack';
        });
    }

    // Override normal Part serialization.
    // Here we need to also include an array of ids of
    // loaded stacks and the id of the current stack
    serialize(){
        let currentStackId;
        if(this.currentStack){
            currentStackId = this.currentStack.id;
        } else {
            currentStackId = null;
        }
        let result = {
            type: this.type,
            id: this.id,
            properties: [],
            subparts: this.subparts.map(subpart => {
                return subpart.id;
            }),
            ownerId: null,
            loadedStacks: (this.loadedStacks.map(stack => {
                return stack.id;
            })),
            currentStack: currentStackId
        };

        // Serialize current part properties
        // values
        this.partProperties._properties.forEach(prop => {
            let name = prop.name;
            let value = prop.getValue(this);
            result.properties[name] = value;
        });
        return JSON.stringify(result, null, 4);
    }

    // Override for delegation.
    // We send any messages that should be delegated
    // to the global System object, which has any
    // 'handlers of last resort'
    delegateMessage(aMessage){
        return this.sendMessage(aMessage, window.System);
    }
};


/**
 * Constructs the appropriate Part based
 * on the incoming serialization string, which
 * should be JSON valid
 */
WorldStack.fromSerialization = function(aString){
    let json = JSON.parse(aString);
    let newPart = new WorldStack();
    newPart.setFromDeserialized(json);
    return newPart;
};

export {
    WorldStack,
    WorldStack as default
};
