/**
 * PartView
 * ----------------------------------------
 * I am an *abstract* webcompoent CustomElement
 * that serves as the generic view for any Part
 * models.
 * I should not be instantiated directly, nor should
 * I be added to any web page's registry of CustomElements.
 * I am indended to be extended (subclassed) by the actual
 * views for each Part kind, and therefore I contain all
 * of the common behavior, including lifecycle methods,
 * for these.
 */
class PartView extends HTMLElement {
    constructor(){
        super();
        this.model = null;
        this.isPartView = true;
        this.name = this.constructor.name;
        this.propChangeHandlers = {};
        this.setupBasePropHandlers();

        // Halo settings. All are on by default
        this.wantsHaloResize = true;
        this.wantsHaloScriptEdit = true;
        this.wantsHaloDelete = true;
        // Note: see getter for wantsHaloMove

        // Bind component methods
        this.setModel = this.setModel.bind(this);
        this.unsetModel = this.unsetModel.bind(this);
        this.sendMessage = this.sendMessage.bind(this);
        this.setupBasePropHandlers = this.setupBasePropHandlers.bind(this);

        // Bind property change reaction methods
        this.primHandlePropChange = this.primHandlePropChange.bind(this);
        this.onPropChange = this.onPropChange.bind(this);
        this.scriptChanged = this.scriptChanged.bind(this);
        this.eventRespond = this.eventRespond.bind(this);
        this.eventIgnore = this.eventIgnore.bind(this);

        // Bind Halo related methods
        this.openHalo = this.openHalo.bind(this);
        this.closeHalo = this.closeHalo.bind(this);
        this.openToolbox = this.openToolbox.bind(this);
        this.openWorldCatalog = this.openWorldCatalog.bind(this);
        this.onHaloDelete = this.onHaloDelete.bind(this);
        this.onHaloOpenEditor = this.onHaloOpenEditor.bind(this);

        // Bind editor related methods
        this.openEditor = this.openEditor.bind(this);
        this.closeEditor = this.closeEditor.bind(this);

        // Bind lifecycle methods
        this.afterModelSet = this.afterModelSet.bind(this);
        this.afterConnected = this.afterConnected.bind(this);
        this.afterDisconnected = this.afterDisconnected.bind(this);
    }

    connectedCallback(){
        if(this.isConnected){
            // Do some universal PartView configuration
            // when attached to a parent element, like
            // registering event listeners etc

            // Call the lifecycle method when done
            // with the above
            this.afterConnected();
        }
    }

    disconnectedCallback(){
        this.afterDisconnected();
    }

    setModel(aModel){
        this.model = aModel;
        aModel.addPropertySubscriber(this);
        this.setAttribute('part-id', aModel.id);
        // set onevent DOM element handlers for events property
        // NOTE: run here as opposed to in this.connectedCallback() because
        // the latter can technically be invoked before the model is set
        let events = this.model.partProperties.getPropertyNamed(this.model, "events");
        events.forEach((eventRespond) => this.eventRespond(eventRespond));
        this.afterModelSet();
    }

    unsetModel(aModel){
        this.model = null;
        aModel.removePropertySubscriber(this);
        this.setAttribute('part-id', "");
    }

    setupBasePropHandlers(){
        // This is where we should setup any
        // prop change handlers that are universal
        // to all PartViews. We would do this via
        // the #onPropChange method, which registers
        // a handler function.
        // Do not override this method
        // TODO: Implement the universals
        this.onPropChange('script', this.scriptChanged);
        this.onPropChange('eventRespond', this.eventRespond);
        this.onPropChange('eventIgnore', this.eventIgnore);
        this.onPropChange('editorOpen', (value) => {
            if(value === true){
                this.openEditor();
            } else if(value === false){
                this.closeEditor();
            }
        });
    }

    sendMessage(aMessage, target){
        window.System.sendMessage(aMessage, this, target);
    }

    receiveMessage(aMessage){
        switch(aMessage.type){
        case 'propertyChanged':
            this.primHandlePropChange(
                aMessage.propertyName,
                aMessage.value,
                aMessage.partId
            );
            break;
        }
    }

    primHandlePropChange(name, value, partId){
        // Find the handler for the given named
        // property. If it does not exist, do nothing
        let handler = this.propChangeHandlers[name];
        if(!handler){
            return null;
        }
        handler = handler.bind(this);
        return handler(value, partId);
    }

    onPropChange(name, func){
        this.propChangeHandlers[name] = func;
    }

    scriptChanged(value, partId){
        this.model.sendMessage({
            type: 'compile',
            codeString: value,
            targetId: partId
        }, window.System);
    }

    // add the event to "event" property and an event listener to the DOM
    // element which will send a corresponding message
    eventRespond(eventName){
        let message = {
            type: "command",
            commandName: eventName,
            args: [],
            shouldIgnore: true
        };
        this[`on${eventName}`] = () => this.sendMessage(message, this.model);
    }

    // remove the event from "event" property and the event listener from
    // the DOM element
    eventIgnore(eventName, partId){
        // remove eventListener
        this[`on${eventName}`] = null;
    }

    openToolbox(){
        // Check to see if there's a toolbox in
        // the component's shadow root already
        let foundToolbox = window.System.findToolbox();;
        if(!foundToolbox){
            this.sendMessage({
                type: 'command',
                commandName: 'openToolbox',
                args: []
            }, window.System);
        }
    }

    openWorldCatalog(){
        // Check to see if there's a world catalogue in
        // the component's shadow root already
        let foundWorldCatalog = false;
        // TODO this is an awkward way to see if an element is there!
        document.querySelectorAll('st-window').forEach((stWindow) => {
            let windowId = stWindow.getAttribute("part-id");
            let part = window.System.partsById[windowId];
            let titleProperty = part.partProperties.findPropertyNamed("title");
            if(titleProperty.getValue() === "World Catalog"){
                foundWorldCatalog = true;
            };
        });
        if(!foundWorldCatalog){
            this.sendMessage({
                type: 'command',
                commandName: 'openWorldCatalog',
                args: []
            }, window.System);
        }
    }

    /* Lifecycle Method Defaults */
    afterModelSet(){
        // Does nothing.
        // Should be implemented in subclasses
    }

    afterConnected(){
        // Does nothing by default.
        // Should be implemented in subclass
    }

    afterDisconnected(){
        // Does nothing by default.
        // Should be implemented in subclass
    }

    /* Halo Related Methods */

    openHalo(){
        // Check to see if there's a halo in
        // the component's shadow root already
        let foundHalo = this.shadowRoot.querySelector('st-halo');
        if(!foundHalo){
            let newHalo = document.createElement('st-halo');
            this.shadowRoot.appendChild(newHalo);
        }
    }

    closeHalo(){
        let foundHalo = this.shadowRoot.querySelector('st-halo');
        if(foundHalo){
            foundHalo.remove();
        }
    }

    toggleAntsBorder(){
        if(this.classList.contains('marching-ants')){
            this.classList.remove('marching-ants');
        } else {
            this.classList.add('marching-ants');
        }
    }

    onHaloDelete(){
        // What to do when the user clicks the
        // delete button on a halo for this partview.
        // The default implementation is to send a message
        // to the System to delete the corresponding
        // model and *all* views referencing that
        // model.
        this.sendMessage({
            type: 'command',
            commandName: 'deleteModel',
            args: [this.model.id]
        }, window.System);
    }

    onHaloOpenEditor(){
        // Send the message to open a script editor
        // with this view's model as the target
        this.model.sendMessage({
            type: 'command',
            commandName: 'openScriptEditor',
            args: [this.model.id]
        }, this.model);
    }

    get wantsHaloMove(){
        if(!this.parentElement || !this.isConnected){
            return false;
        }
        let parentModel = this.parentElement.model;
        if(!parentModel){
            return true;
        }

        let parentLayout = parentModel.partProperties.getPropertyNamed(
            parentModel,
            'layout'
        );
        if(!parentLayout || parentLayout == ""){
            return true;
        }

        return false;
    }

    /* Editor related methods */
    openEditor(){
        // Does nothing by default.
        // Should be implemented in subclass
    }

    closeEditor(){
        // Does nothing by default.
        // Should be implemented in subclass
    }
};

export {
    PartView,
    PartView as default
};
