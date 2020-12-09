/**
 * VisionFieldView
 * -----------------------------------
 * I am the view of a VisionField part.
 */
import PartView from './PartView.js';

const templateString = `
<style>
:host {
  display: block;
  position: absolute;
  border: 1px solid black;
}
</style>
<canvas id="vision-canvas"></canvas>
`;

class VisionFieldView extends PartView {
    constructor(){
        super();

        this.template = document.createElement('template');
        this.template.innerHTML = templateString;
        this._shadowRoot = this.attachShadow({mode: 'open'});
        this._shadowRoot.appendChild(
            this.template.content.cloneNode(true)
        );

        // Halo settings
        this.wantsHaloResize = false;

        // Bind component methods
        this.setupPropHandlers = this.setupPropHandlers.bind(this);
        this.renderCoordinates = this.renderCoordinates.bind(this);
        this.clearCanvas = this.clearCanvas.bind(this);
        this.onClick = this.onClick.bind(this);

        // Set up the prop handlers
        this.setupPropHandlers();
    }

    setupPropHandlers(){
        this.onPropChange('coordinates', this.renderCoordinates);
    }

    afterConnected(){
        this.canvas = this._shadowRoot.getElementById('vision-canvas');
        this.addEventListener('click', this.onClick);
        
    }

    afterDisconnected(){
        this.removeEventListener('click', this.onClick);
    }

    afterModelSet(){
        let canvas = this._shadowRoot.getElementById('vision-canvas');
        let width = this.model.partProperties.getPropertyNamed(
            this,
            'width'
        );
        let height = this.model.partProperties.getPropertyNamed(
            this,
            'height'
        );
        canvas.setAttribute('width', width);
        canvas.setAttribute('height', height);
    }

    renderCoordinates(coords){
        let ctx = this.canvas.getContext('2d');
        this.clearCanvas(ctx);

        // Draw the individual circles
        coords.forEach(coordInfo => {
            ctx.beginPath();
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 2;
            ctx.arc(
                coordInfo[0], // x
                coordInfo[1], // y
                coordInfo[2], // radius
                0,
                (2 * Math.PI)
            );
            ctx.stroke();
            ctx.closePath();
        });
    }

    clearCanvas(context=null){
        if(!context){
            context = this.canvas.getContext('2d');
        }
        context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    onClick(event){
        if(event.shiftKey && event.button == 0){
            event.preventDefault();
            event.stopPropagation();
            if(this.hasOpenHalo){
                this.closeHalo();
            } else {
                this.openHalo();
            }
        }
    }
}

export {
    VisionFieldView,
    VisionFieldView as default
};
