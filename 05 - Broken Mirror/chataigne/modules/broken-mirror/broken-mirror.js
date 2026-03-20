function log(message) {
    script.log(message);
}

function logProperties(input) {
    var properties = util.getObjectProperties(input);
    log(properties);
}

function logMethods(input) {
    var methods = util.getObjectMethods(input);
    log(methods);
}

var handlers = {
    "started": function(id, data) {
        onClientStarted(id, data);
    },
    "sync": function(id, data) {
        onClientSynced(id, data);
    }
};

function onClientStarted(id, data) {

    var container = createContainerIfNeeded(id, true);
    
    var properties = util.getObjectProperties(data);
    for (var i = 0; i < properties.length; i++) {
        var property = properties[i];
        
        var propData = data[property];
        var type = propData.type;
        var value = propData.value;

        if (type === "Boolean") {
            container.addBoolParameter(property, property, value);
        }
        else if (type === "Float") {
            var fltParam = container.addFloatParameter(property, property, value);
            
            var min = propData.min;
            var max = propData.max;

            fltParam.setRange(min, max);
        }
        else if (type === "Color") {
            container.addColorParameter(property, property, value);
        }
    }
}

function onClientSynced(id, data) {

    var container = createContainerIfNeeded(id, false);
    
    var properties = util.getObjectProperties(data);
    for (var i = 0; i < properties.length; i++) {
        var property = properties[i];
        var value = data[property].value;

        container[property].set(value);
    }
}

function wsMessageReceived(client, message) {
    var parsed = JSON.parse(message);

    var type = parsed.type;
    var id = parsed.id;
    var data = parsed.data;

    if (handlers[type]) {
        handlers[type](id, data);
    }
}

function sendWSMessage(type, data) {

    var obj = {
        type: type
    };

    if (data) {
        obj.data = data;
    }

    var json = JSON.stringify(obj);

    local.send(json);
}

function createContainerIfNeeded(id, clear) {
    var idStr = "";

    if (id < 10) {
        idStr += "0";
    }
    idStr += id;

    var containerShortName = "screen_" + idStr;
    var container = local.values.screens[containerShortName];

    if (!container) {
        container = local.values.screens.addContainer("Screen " + idStr);
        var IdProp = container.addIntParameter("Screen Id", "Screen Id", id);
        IdProp.setAttribute("readonly", true);
    }
    else if (clear === true) {
        container.clear();
    }

    return container;
}

function init() {
    local.scripts.broken_mirror.enableLog.set(true);
}

function moduleValueChanged(param) {


    var msg = {
        type: "valueChanged",
        id: param.getParent().screenId.get(),
        payload: {
            property: param.name,
            value: param.get(),
            type: param.type
        }
    };
    local.send(JSON.stringify(msg));
}