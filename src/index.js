"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.attach = exports.Component = exports.findParentOfType = exports.Context = exports.compareAndCreate = exports.Template = exports.createRef = void 0;
function createRef() {
    return { element: undefined };
}
exports.createRef = createRef;
class Template {
    constructor(htmlString, nodesListFunction) {
        let templateElement = document.createElement('div');
        templateElement.innerHTML = htmlString;
        this.domElement = templateElement.firstChild;
        this.nodesListFunction = nodesListFunction;
    }
    ;
    clone() {
        let newDomElement = this.domElement.cloneNode(true);
        let nodes = this.nodesListFunction(newDomElement);
        return {
            domElement: newDomElement,
            nodes: nodes
        };
    }
}
exports.Template = Template;
function disposeElement(elementState) {
    if (elementState == undefined || elementState == null) {
        return;
    }
    if (elementState.type == "string") {
        elementState.domElement.remove();
    }
    else if (elementState.type == "array") {
        for (let childElementState of elementState.children) {
            disposeElement(childElementState);
        }
    }
    else if (elementState.type == "component") {
        elementState.componentObject.dispose();
    }
    else if (elementState.type == "template") {
        for (let childElementState of elementState.templateState.children) {
            disposeElement(childElementState);
        }
        elementState.templateState.domElement.remove();
    }
}
function createResult(result, parent, previousNode, context) {
    if (result == null || result == undefined || result == false) {
        return null;
    }
    else if (typeof result === "string") {
        let nextNode = document.createTextNode(result);
        if (previousNode.node != null) {
            previousNode.node.after(nextNode);
        }
        else {
            parent.prepend(nextNode);
        }
        previousNode.node = nextNode;
        return {
            type: "string",
            value: result,
            domElement: nextNode,
        };
    }
    else if (Array.isArray(result)) {
        let children = [];
        for (let childResult of result) {
            const newElementState = createResult(childResult, parent, previousNode, context);
            children.push(newElementState);
        }
        return {
            type: "array",
            children: children,
        };
    }
    else if (result.type == "component") {
        let componentObject = new result.component(result.props);
        componentObject.attachContext(context);
        let addToTree = componentObject.renderElement();
        if (previousNode.node != null) {
            previousNode.node.after(componentObject.domElement);
        }
        else {
            parent.prepend(componentObject.domElement);
        }
        previousNode.node = componentObject.domElement;
        return {
            type: "component",
            component: result.component,
            componentObject: componentObject,
        };
    }
    else if (result.type == "template") {
        let { domElement: nextNode, nodes } = result.template.clone();
        let templateState = {
            domElement: nextNode,
            children: [],
            nodes: nodes,
        };
        result.templateFunction(templateState, context);
        if (previousNode.node != null) {
            previousNode.node.after(nextNode);
        }
        else {
            parent.prepend(nextNode);
        }
        previousNode.node = nextNode;
        return {
            type: "template",
            template: result.template,
            templateFunction: result.templateFunction,
            templateState: templateState,
        };
    }
    else {
        throw "Unhandled condition";
    }
}
function replaceElement(elementState, _result, parent, previousNode, context) {
    if (elementState == null) {
        throw "Cannot replace null element";
    }
    if (elementState.type == "string") {
        let result = _result;
        if (elementState.value == result) {
            previousNode.node = elementState.domElement;
            return elementState;
        }
        else {
            elementState.value = result;
            let domElement = document.createTextNode(result);
            elementState.domElement.replaceWith(domElement);
            elementState.domElement = domElement;
            previousNode.node = domElement;
            return elementState;
        }
    }
    else if (elementState.type == "array") {
        let index = 0;
        let result = _result;
        while (index < elementState.children.length && index < result.length) {
            elementState.children[index] = compareAndCreate(elementState.children[index], result[index], parent, previousNode, context);
            index++;
        }
        if (index < elementState.children.length) {
            while (index < elementState.children.length) {
                disposeElement(elementState.children[elementState.children.length - 1]);
                elementState.children.pop();
            }
        }
        if (index < result.length) {
            while (index < result.length) {
                elementState.children[index] = createResult(result[index], parent, previousNode, context);
                index++;
            }
        }
        return elementState;
    }
    else if (elementState.type == "component") {
        let result = _result;
        elementState.componentObject.updateWithProps(result.props);
        previousNode.node = elementState.componentObject.domElement;
        return elementState;
    }
    else if (elementState.type == "template") {
        let result = _result;
        elementState.templateFunction(elementState.templateState, context);
        previousNode.node = elementState.templateState.domElement;
        return elementState;
    }
    else {
        throw "Unhandled condition";
    }
}
function compareAndCreate(elementState, result, parent, previousNode, context) {
    result = result == false ? null : result;
    if (elementState == null && result == null) {
        return null;
    }
    else if (elementState == null && result != null) {
        let obj = createResult(result, parent, previousNode, context);
        return obj;
    }
    else if (elementState != null && result == null) {
        disposeElement(elementState);
        return null;
    }
    else if (elementState != null && result != null) {
        if ((typeof result == "string" && elementState.type != "string") ||
            (Array.isArray(result) && elementState.type != "array") ||
            ((typeof result != "string" && !Array.isArray(result)) &&
                ((result.type != elementState.type) ||
                    (result.type == "component" && elementState.type == "component" && result.component != elementState.component) ||
                    (result.type == "template" && elementState.type == "template" && result.template != elementState.template)))) {
            disposeElement(elementState);
            return createResult(result, parent, previousNode, context);
        }
        else {
            return replaceElement(elementState, result, parent, previousNode, context);
        }
    }
    else {
        throw "Unhandled condition";
    }
}
exports.compareAndCreate = compareAndCreate;
class Context {
    constructor() {
        this.parentComponentList = [];
    }
}
exports.Context = Context;
function findParentOfType(context, parentType) {
    for (let i = context.parentComponentList.length - 1; i >= 0; i--) {
        if (context.parentComponentList[i] instanceof parentType)
            return context.parentComponentList[i];
    }
    return null;
}
exports.findParentOfType = findParentOfType;
class Component {
    constructor(props) {
        this.elementState = null;
        this.markedForRerender = false;
        this.props = props;
    }
    attachContext(context) {
        this.context = context;
    }
    dettachContext() {
        this.context = undefined;
    }
    updateWithProps(props) {
        let oldProps = this.props;
        this.props = props;
        this.didUpdateProps(oldProps);
        return this.renderElement();
    }
    didUpdateProps(oldProps) { }
    dispose() {
        if (this.elementState != null) {
            disposeElement(this.elementState);
        }
    }
    renderElement() {
        let result = this.render();
        if (this.context == undefined) {
            return false;
        }
        if (result == null || result == undefined || result == false) {
            throw "render() function returned null/undefined/false. Must return a JSX element.";
        }
        if (typeof result == "string" || Array.isArray(result)) {
            throw "render() function returned a string/array. Must return a JSX element";
        }
        let childContext = new Context();
        childContext.parentComponentList = [...this.context.parentComponentList];
        childContext.parentComponentList.push(this);
        if (this.elementState == null) {
            if (result.type == "component") {
                let componentObject = new result.component(result.props);
                this.elementState = {
                    type: "component",
                    component: result.component,
                    componentObject: componentObject,
                };
                componentObject.attachContext(childContext);
                componentObject.renderElement();
                this.domElement = componentObject.domElement;
            }
            else if (result.type == "template") {
                let { domElement, nodes } = result.template.clone();
                let templateState = {
                    domElement: domElement,
                    children: [],
                    nodes: nodes,
                };
                this.elementState = {
                    type: "template",
                    template: result.template,
                    templateFunction: result.templateFunction,
                    templateState: templateState,
                };
                result.templateFunction(templateState, childContext);
                this.domElement = this.elementState.templateState.domElement;
            }
            else {
                throw "render() function returned a string/array. Must return a JSX element of an HTML tag or a Component";
            }
            return true;
        }
        else {
            if (this.elementState.type == "component" && result.type == "component" && this.elementState.component == result.component) {
                this.elementState.componentObject.updateWithProps(result.props);
                this.domElement = this.elementState.componentObject.domElement;
                return false;
            }
            else if (this.elementState.type == "template" && result.type == "template" && this.elementState.template == result.template) {
                result.templateFunction(this.elementState.templateState, childContext);
                return false;
            }
            else {
                if (result.type == "component") {
                    let componentObject = new result.component(result.props);
                    componentObject.attachContext(childContext);
                    componentObject.renderElement();
                    if (this.elementState.type == "component") {
                        this.elementState.componentObject.domElement.replaceWith(componentObject.domElement);
                    }
                    else {
                        this.elementState.templateState.domElement.replaceWith(componentObject.domElement);
                    }
                    this.elementState = {
                        type: "component",
                        component: result.component,
                        componentObject: componentObject,
                    };
                }
                else if (result.type == "template") {
                    let { domElement, nodes } = result.template.clone();
                    let templateState = {
                        domElement: domElement,
                        children: [],
                        nodes: nodes,
                    };
                    result.templateFunction(templateState, childContext);
                    if (this.elementState.type == "component") {
                        this.elementState.componentObject.domElement.replaceWith(templateState.domElement);
                    }
                    else {
                        this.elementState.templateState.domElement.replaceWith(templateState.domElement);
                    }
                    this.elementState = {
                        type: "template",
                        template: result.template,
                        templateFunction: result.templateFunction,
                        templateState: result.templateFunction(templateState),
                    };
                }
                else {
                    throw "render() function returned a string/array. Must return a JSX element of an HTML tag or a Component";
                }
                return true;
            }
        }
    }
    setState() {
        this.renderElement();
    }
    render() {
        return {};
    }
    ;
}
exports.Component = Component;
let globalState;
function attach(element, result) {
    let context = new Context();
    if (result.type == "component") {
        let component = new result.component(result.props);
        globalState = component;
        component.attachContext(context);
        component.renderElement();
        element.appendChild(component.domElement);
    }
    else if (result.type == "template") {
        let { domElement, nodes } = result.template.clone();
        let templateState = {
            domElement: domElement,
            children: [],
            nodes: nodes,
        };
        globalState = templateState;
        result.templateFunction(templateState, context);
        element.appendChild(domElement);
    }
}
exports.attach = attach;
window.print = () => {
    console.log(globalState);
};
