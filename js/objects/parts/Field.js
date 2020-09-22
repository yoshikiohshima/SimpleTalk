/**
 * Field
 * -----------------------------------------
 * I am a Field Part.
 * I am a container that holds text. I also allow
 * a user to edit my text.
 */
import Part from './Part.js';
import {
    BasicProperty,
    DynamicProperty
} from '../properties/PartProperties.js';

class Field extends Part {
    constructor(owner, name){
        super(owner);
        if(name){
            this.partProperties.setPropertyNamed(
                this,
                'name',
                name
            );
        }

        this.isField = true;

        // Set the Field-specific
        // Part Properties
        this.partProperties.newBasicProp(
            'autoSelect',
            false,
        );
        this.partProperties.newBasicProp(
            'autoTab',
            false
        );
        this.partProperties.newBasicProp(
            'lockText',
            false
        );
        this.partProperties.newBasicProp(
            'showLines',
            false
        );
        this.partProperties.newBasicProp(
            'dontWrap',
            false
        );
        this.partProperties.newBasicProp(
            'multipleLines',
            false
        );
        this.partProperties.newBasicProp(
            'scroll',
            0
        );
        this.partProperties.newBasicProp(
            'sharedText',
            false
        );
        this.partProperties.newBasicProp(
            'wideMargins',
            false
        );
        this.partProperties.newBasicProp(
            'textContent',
            ''
        );
    }

    // Override delegation. Fields should
    // delegate message handling to their
    // owner cards.
    delegateMessage(aMessage){
        this.sendMessage(
            aMessage,
            this._owner
        );
    }

    get type(){
        return 'field';
    }
};

export {
    Field,
    Field as default
};
