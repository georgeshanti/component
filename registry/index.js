var classRegistry = {}

export function createClass(className, file, _class){
    if(!Object.keys(classRegistry).includes(file)) classRegistry[file] = {};
    let fileRegister = classRegistry[file];
    if(!Object.keys(fileRegister).includes(className)){
        fileRegister[className] = _class.prototype.constructor;
    }else{
        for(let property of Object.getOwnPropertyNames(_class.prototype)){
            fileRegister[className].prototype[property] = _class.prototype[property];
        }
    }
    return fileRegister[className];
}

var templateRegistry = {}

export function createTemplate(templateName, file, template){
    if(!Object.keys(templateRegistry).includes(file)) templateRegistry[file] = {};
    let fileRegister = templateRegistry[file];
    if(!Object.keys(fileRegister).includes(templateName)){
        fileRegister[templateName] = template;
    }else{
        fileRegister[templateName].domElement = template.domElement;
        fileRegister[templateName].nodesListFunction = template.nodesListFunction;
    }
    return fileRegister[templateName];
}