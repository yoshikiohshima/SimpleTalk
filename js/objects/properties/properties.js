const assert = require("assert");

class Properties {
    constructor() {
        this._properties = {}
    }

    setProperty(key, value, perm) {
        // Verify validity of inputs
        assert(typeof key === "string");
        assert(value !== undefined);
        assert(typeof perm === "string");
        assert((perm === "ro") || (perm === "rw"));
        // If key not in properties can simply add it
        if (!(key in this._properties)) {
            this._properties[key] = {key: key, value: value, perm: perm, subscribers: []};
            return;
        }
        // Check if key is already present and setting property is allowed
        if (this._properties[key].perm === "ro") {
            throw new Error("key already set to readonly property");
        }
        // Update property
        this._properties[key].value = value;
        this._properties[key].perm = perm;
        // Notify subscribers
        this._notify(key, "update");
    }

    getProperty(key) {
        // Verify validity of inputs
        assert(typeof key === "string");
        // Verify property actually exists
        if (!(key in this._properties)) {
            throw new Error("no property found with key");
        }
        // Notify before returning
        this._notify(key, "get");
        return this._properties[key].value;
    }

    addSubscriber(key, subscriber) {
        // Verify validity of inputs
        assert(typeof key === "string");
        assert(typeof subscriber === "string");
        // Verify property actually exists
        if (!(key in this._properties)) {
            throw new Error("no property found with key");
        }
        this._properties[key].subscribers.push(subscriber);
    }

    _notify(key, change) {
        let subscribers = this._properties[key].subscribers;
        for (var i = 0; i < subscribers.length; i++) {
            console.log({subscriber: subscribers[i], key: key, change: change});
        }
    }
};

properties = new Properties();

properties.setProperty("key", "value", "rw");
properties.addSubscriber("key", "thomas");
properties.addSubscriber("key", "eric");
properties.setProperty("key", "value", "rw");
properties.setProperty("key", "value", "ro");
try {
    properties.setProperty("key", "value", "ro");
} catch (error) {
}
properties.getProperty("key");
try {
    properties.getProperty("fakekey");
} catch (error) {
}
properties.addSubscriber("key", "thomas");
properties.addSubscriber("key", "eric");
