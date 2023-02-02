"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.attach = exports.Sub = exports.Component = exports.BaseComponent = exports.findParentOfType = exports.Context = exports.compareAndCreate = exports.Template = exports.createRef = void 0;
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
    console.log(result, typeof result, typeof result === "string");
    if (result == null || result == undefined || result === false) {
        console.log("It came in here");
        return null;
    }
    else if (typeof result === "string") {
        console.log(result, parent, previousNode);
        let nextNode = document.createTextNode(result);
        console.log(nextNode);
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
            previousNode.node.after(componentObject.getDomElement());
        }
        else {
            parent.prepend(componentObject.getDomElement());
        }
        previousNode.node = componentObject.getDomElement();
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
            // START For hot reload
            elementState.value = result;
            let domElement = document.createTextNode(result);
            elementState.domElement.replaceWith(domElement);
            elementState.domElement = domElement;
            if (previousNode.node != null) {
                previousNode.node.after(domElement);
            }
            else {
                parent.prepend(domElement);
            }
            // END For hot reload
            previousNode.node = elementState.domElement;
            return elementState;
        }
        else {
            elementState.value = result;
            let domElement = document.createTextNode(result);
            elementState.domElement.replaceWith(domElement);
            elementState.domElement = domElement;
            // START For hot reload
            if (previousNode.node != null) {
                previousNode.node.after(domElement);
            }
            else {
                parent.prepend(domElement);
            }
            // END For hot reload
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
        // START For hot reload
        if (previousNode.node != null) {
            previousNode.node.after(elementState.componentObject.getDomElement());
        }
        else {
            parent.prepend(elementState.componentObject.getDomElement());
        }
        // END For hot reload
        previousNode.node = elementState.componentObject.getDomElement();
        return elementState;
    }
    else if (elementState.type == "template") {
        let result = _result;
        // Without hot reload
        // elementState.templateFunction(elementState.templateState, context);
        // Without hot reload
        // START For hot reload
        let { domElement, nodes } = result.template.clone();
        let oldDomElement = elementState.templateState.domElement;
        elementState.templateState = {
            domElement: domElement,
            children: elementState.templateState.children,
            nodes: nodes,
        };
        result.templateFunction(elementState.templateState, context);
        oldDomElement.replaceWith(domElement);
        if (previousNode.node != null) {
            previousNode.node.after(elementState.templateState.domElement);
        }
        else {
            parent.prepend(elementState.templateState.domElement);
        }
        // END For hot reload
        previousNode.node = elementState.templateState.domElement;
        return elementState;
    }
    else {
        throw "Unhandled condition";
    }
}
function compareAndCreate(elementState, result, parent, previousNode, context) {
    console.log(result);
    result = (typeof result == "boolean" && result == false) ? null : result;
    result = (typeof result == "number") ? result.toString() : result;
    console.log(result, typeof result);
    if (elementState == null && result == null) {
        console.log("1 here");
        return null;
    }
    else if (elementState == null && result != null) {
        console.log("2 here");
        let obj = createResult(result, parent, previousNode, context);
        return obj;
    }
    else if (elementState != null && result == null) {
        console.log("3 here");
        disposeElement(elementState);
        return null;
    }
    else if (elementState != null && result != null) {
        console.log("4 here");
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
class BaseComponent {
    getDomElement() {
        throw "Unimplemented";
    }
    constructor(props) {
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
        this.renderElement();
    }
    renderElement() {
        throw "Unimplemented";
    }
    didUpdateProps(oldProps) { }
    dispose() { }
}
exports.BaseComponent = BaseComponent;
class Component extends BaseComponent {
    constructor(props) {
        super(props);
        this.elementState = null;
        this.markedForRerender = false;
        this.addToContextTree = false;
    }
    getDomElement() {
        var _a, _b;
        if (((_a = this.elementState) === null || _a === void 0 ? void 0 : _a.type) == "component") {
            return this.elementState.componentObject.getDomElement();
        }
        else if (((_b = this.elementState) === null || _b === void 0 ? void 0 : _b.type) == "template") {
            return this.elementState.templateState.domElement;
        }
        else {
            throw "No node element present";
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
        if (this.addToContextTree)
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
            }
            else {
                throw "render() function returned a string/array. Must return a JSX element of an HTML tag or a Component";
            }
            return true;
        }
        else {
            if (this.elementState.type == "component" && result.type == "component" && this.elementState.component == result.component) {
                this.elementState.componentObject.updateWithProps(result.props);
                return false;
            }
            else if (this.elementState.type == "template" && result.type == "template" && this.elementState.template == result.template) {
                // START For hot reload
                let { domElement, nodes } = result.template.clone();
                let oldDomElement = this.elementState.templateState.domElement;
                this.elementState.templateState = {
                    domElement: domElement,
                    children: this.elementState.templateState.children,
                    nodes: nodes,
                };
                // END For hot reload
                result.templateFunction(this.elementState.templateState, childContext);
                // START For hot reload
                oldDomElement.replaceWith(domElement);
                // END For hot reload
                return false;
            }
            else {
                if (result.type == "component") {
                    let componentObject = new result.component(result.props);
                    componentObject.attachContext(childContext);
                    componentObject.renderElement();
                    if (this.elementState.type == "component") {
                        this.elementState.componentObject.getDomElement().replaceWith(componentObject.domElement);
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
                        this.elementState.componentObject.getDomElement().replaceWith(templateState.domElement);
                    }
                    else {
                        this.elementState.templateState.domElement.replaceWith(templateState.domElement);
                    }
                    this.elementState = {
                        type: "template",
                        template: result.template,
                        templateFunction: result.templateFunction,
                        templateState: templateState,
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
    dispose() {
        if (this.elementState != null) {
            disposeElement(this.elementState);
        }
        super.dispose();
    }
}
exports.Component = Component;
class Sub extends BaseComponent {
    constructor(props) {
        super(props);
    }
    getDomElement() {
        console.log("Fetching sub element");
        let ele = this.props.child.getDomElement();
        console.log(ele);
        return ele;
    }
    attachContext(context) {
        super.attachContext(context);
        this.props.child.attachContext(this.context);
    }
    dettachContext() {
        this.props.child.dettachContext();
        super.dettachContext();
    }
    didUpdateProps(oldProps) {
        if (this.props.child != oldProps.child) {
            oldProps.child.dettachContext();
            this.props.child.attachContext(this.context);
        }
    }
    renderElement() {
        this.props.child.renderElement();
    }
    dispose() {
        this.props.child.dettachContext();
        super.dispose();
    }
}
exports.Sub = Sub;
let rootElemntUid;
let rootElementStates;
function attach(element, result) {
    if (rootElementStates == undefined) {
        rootElementStates = {};
        rootElemntUid = 0;
    }
    let elementUid = element.getAttribute("element-uid");
    let elementState = null;
    let context = new Context();
    if (elementUid == null) {
        elementUid = (rootElemntUid++).toString();
        element.setAttribute("element-uid", elementUid);
    }
    else {
        elementState = rootElementStates[elementUid];
    }
    rootElementStates[elementUid] = compareAndCreate(elementState, result, element, { node: null }, context);
}
exports.attach = attach;
