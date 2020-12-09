/**
 * VisionField
 * ----------------------------------------------
 * I represent the model of a vision field, which is used
 * for AR-like interaction with a camera.
 *
 */
import Part from './Part.js';

class VisionField extends Part {
    constructor(...args){
        super(...args);

        // We use this to set and unset
        // the interval for polling
        this._intervalId = null;

        // Set properties for vision field

        // The default URL to retrieve
        // vision data from.
        this.partProperties.newBasicProp(
            'src',
            'http://localhost:5000'
        );

        // If polling, the pollTime represents
        // the millisecond delay to use
        this.partProperties.newBasicProp(
            'pollTime',
            100
        );

        // Whether or not the vision field is
        // currently polling
        this.partProperties.newBasicProp(
            'polling',
            false
        );

        // The current frame's set of
        // coordinate information.
        // This is an array
        this.partProperties.newBasicProp(
            'coordinates',
            []
        );

        // Set the width and height to
        // be the vision system's default
        // values
        this.partProperties.setPropertyNamed(
            this,
            'height',
            480
        );
        this.partProperties.setPropertyNamed(
            this,
            'width',
            848
        );

        // Bind part methods
        this.fetchCoordinates = this.fetchCoordinates.bind(this);
        this.startListening = this.startListening.bind(this);
        this.stopListening = this.stopListening.bind(this);
    }

    fetchCoordinates(){
        let url = this.partProperties.getPropertyNamed(
            this,
            'src'
        );
        fetch(url)
            .then(res => {
                return res.json();
            })
            .then(jsonArray => {
                this.partProperties.setPropertyNamed(
                    this,
                    'coordinates',
                    jsonArray
                );
            })
            .catch(err => {
                console.error(err);
                this.stopListening();
            });
    }

    startListening(){
        if(this._intervalId){
            clearInterval(this._intervalId);
        }

        let timing = this.partProperties.getPropertyNamed(
            this,
            'pollTime'
        );

        this._intervalId = setInterval(
            this.fetchCoordinates,
            timing
        );
    }

    stopListening(){
        clearInterval(this._intervalId);
        this.partProperties.setPropertyNamed(
            this,
            'polling',
            false
        );
    }

    // Override the default implementation.
    // Here we need to handle the case where
    // the 'polling' property has been adjusted,
    // and to stop or start the polling accordingly
    propertyChanged(propertyName, newValue){
        let message = {
            type: 'propertyChanged',
            propertyName: propertyName,
            value: newValue,
            partId: this.id
        };
        this._propertySubscribers.forEach(subscriber => {
            this.sendMessage(message, subscriber);
        });

        if(propertyName == 'polling'){
            if(newValue){
                this.startListening();
            } else {
                this.stopListening();
            }
        }
    }

    get type(){
        return 'vision-field';
    }
};

export {
    VisionField,
    VisionField as default
};
