/**
 * FieldView
 * -------------------------------
 * I am a webcomponent representation of
 * a Field Part.
 */
import PartView from './PartView.js';

const templateString = `
<style>
:host {
    box-sizing: border-box;
    display: block;
    width: 100%;
    height: 100%;
    color: black;
    background-color: white;
    font-family: monospace;
    border: 1px solid transparent;
    padding: 5px;
}
:host(:focus){
    border: 1px solid blue;
}
</style>
<slot></slot>
`;

class FieldView extends PartView {
    constructor(){
        super();

        this.template = document.createElement('template');
        this.template.innerHTML = templateString;
        this._shadowRoot = this.attachShadow({mode: 'open'});
        this._shadowRoot.appendChild(
            this.template.content.cloneNode(true)
        );

        // Bind component methods
        this.setPropsFromModel = this.setPropsFromModel.bind(this);
        this.onInput = this.onInput.bind(this);
    }

    connectedCallback(){
        if(this.isConnected){
            if(this.model){
                this.setPropsFromModel();
            }
        }

        // Bind event listeners
        this.addEventListener('input', this.onInput);
    }

    disconnectedCallback(){
        this.removeEventListener('input', this.onInput);
    }

    setPropsFromModel(setText=true){
        let lockText = this.model.partProperties.getPropertyNamed(
            this.model,
            'lockText'
        );
        if(!lockText){
            this.contentEditable = true;
        } else {
            this.contentEditable = false;
        }

        // Text content
        let textContent = this.model.partProperties.getPropertyNamed(
            this.model,
            'textContent'
        );
        this.innerText = textContent;
    }

    receiveMessage(aMessage){
        console.log(aMessage);
        if(aMessage.type == 'propertyChanged' && aMessage.propertyName == 'textContent'){
            if(aMessage.value == this.innerText){
                return;
            }
        } else if(aMessage.type == 'propertyChanged'){
            this.setPropsFromModel(false);
        }
    }

    onInput(event){
        let curText = this.model.partProperties.getPropertyNamed(
            this.model,
            'textContent'
        );
        if(curText != this.innerText){
            this.model.partProperties.setPropertyNamed(
                this.model,
                'textContent',
                this.innerText
            );
        }
    }

    get textValue(){
        return this.innerText;
    }
};

export {
    FieldView,
    FieldView as default
};
