"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.attach = exports.SubComponent = exports.SubElement = exports.Component = exports.BaseComponent = exports.findParentOfType = exports.Context = exports.compareAndCreate = exports.TemplateResult = exports.ComponentResult = exports.TemplateElementState = exports.ComponentState = exports.ArrayElementState = exports.TextNodeState = exports.Template = exports.createRef = void 0;
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
class TextNodeState {
    constructor(value, domElement) {
        this.value = value;
        this.domElement = domElement;
    }
}
exports.TextNodeState = TextNodeState;
class ArrayElementState {
    constructor(children) {
        this.children = children;
    }
}
exports.ArrayElementState = ArrayElementState;
class ComponentState {
    constructor(component, componentObject) {
        this.component = component;
        this.componentObject = componentObject;
    }
}
exports.ComponentState = ComponentState;
class TemplateElementState {
    constructor(template, templateFunction, templateState) {
        this.template = template;
        this.templateFunction = templateFunction;
        this.templateState = templateState;
    }
}
exports.TemplateElementState = TemplateElementState;
class ComponentResult {
    constructor(component, props) {
        this.component = component;
        this.props = props;
    }
}
exports.ComponentResult = ComponentResult;
class TemplateResult {
    constructor(template, templateFunction) {
        this.template = template;
        this.templateFunction = templateFunction;
    }
}
exports.TemplateResult = TemplateResult;
function disposeElement(elementState) {
    if (elementState == undefined || elementState == null) {
        return;
    }
    if (elementState instanceof TextNodeState) {
        elementState.domElement.remove();
    }
    else if (elementState instanceof ArrayElementState) {
        for (let childElementState of elementState.children) {
            disposeElement(childElementState);
        }
    }
    else if (elementState instanceof ComponentState) {
        elementState.componentObject.dispose();
    }
    else if (elementState instanceof TemplateElementState) {
        for (let childElementState of elementState.templateState.children) {
            disposeElement(childElementState);
        }
        elementState.templateState.domElement.remove();
    }
}
function createResult(result, parent, previousNode, context) {
    if (result == null || result == undefined || result === false) {
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
        return new TextNodeState(result, nextNode);
    }
    else if (Array.isArray(result)) {
        let children = [];
        for (let childResult of result) {
            const newElementState = createResult(childResult, parent, previousNode, context);
            children.push(newElementState);
        }
        return new ArrayElementState(children);
    }
    else if (result instanceof ComponentResult) {
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
        return new ComponentState(result.component, componentObject);
    }
    else if (result instanceof TemplateResult) {
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
        new TemplateElementState(result.template, result.templateFunction, templateState);
    }
    else {
        throw "Unhandled condition";
    }
}
function replaceElement(elementState, _result, parent, previousNode, context) {
    if (elementState == null) {
        throw "Cannot replace null element";
    }
    if (elementState instanceof TextNodeState) {
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
    else if (elementState instanceof ArrayElementState) {
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
    else if (elementState instanceof ComponentState) {
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
    else if (elementState instanceof TemplateElementState) {
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
    result = result === false ? null : result;
    result = (typeof result == "number") ? result.toString() : result;
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
        if ((typeof result == "string" && !(elementState instanceof TextNodeState)) ||
            (Array.isArray(result) && !(elementState instanceof ArrayElementState)) ||
            ((typeof result != "string" && !Array.isArray(result)) &&
                ((result instanceof TemplateResult && elementState instanceof ComponentState) ||
                    (result instanceof ComponentResult && elementState instanceof TemplateElementState) ||
                    (result instanceof ComponentResult && elementState instanceof ComponentState && result.component != elementState.component) ||
                    (result instanceof TemplateResult && elementState instanceof TemplateElementState && result.template != elementState.template)))) {
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
        if (this.elementState instanceof ComponentState) {
            return this.elementState.componentObject.getDomElement();
        }
        else if (this.elementState instanceof TemplateElementState) {
            return this.elementState.templateState.domElement;
        }
        else {
            throw "No node element present";
        }
    }
    renderElement() {
        let result = this.render();
        if (result == null || result == undefined || result == false) {
            throw "render() function returned null/undefined/false. Must return a JSX element.";
        }
        if (typeof result == "string" || Array.isArray(result)) {
            throw "render() function returned a string/array. Must return a JSX element";
        }
        let childContext = new Context();
        if (this.context != undefined) {
            childContext.parentComponentList = [...this.context.parentComponentList];
        }
        if (this.addToContextTree)
            childContext.parentComponentList.push(this);
        if (this.elementState == null) {
            if (result instanceof ComponentResult) {
                let componentObject = new result.component(result.props);
                this.elementState = new ComponentState(result.component, componentObject);
                componentObject.attachContext(childContext);
                componentObject.renderElement();
            }
            else if (result instanceof TemplateResult) {
                let { domElement, nodes } = result.template.clone();
                let templateState = {
                    domElement: domElement,
                    children: [],
                    nodes: nodes,
                };
                this.elementState = new TemplateElementState(result.template, result.templateFunction, templateState);
                result.templateFunction(templateState, childContext);
            }
            else {
                throw "render() function returned a string/array. Must return a JSX element of an HTML tag or a Component";
            }
            return true;
        }
        else {
            if (this.elementState instanceof ComponentState && result instanceof ComponentResult && this.elementState.component == result.component) {
                this.elementState.componentObject.updateWithProps(result.props);
                return false;
            }
            else if (this.elementState instanceof TemplateElementState && result instanceof TemplateResult && this.elementState.template == result.template) {
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
                if (result instanceof ComponentResult) {
                    let componentObject = new result.component(result.props);
                    componentObject.attachContext(childContext);
                    componentObject.renderElement();
                    if (this.elementState instanceof ComponentState) {
                        this.elementState.componentObject.getDomElement().replaceWith(componentObject.getDomElement());
                    }
                    else {
                        this.elementState.templateState.domElement.replaceWith(componentObject.getDomElement());
                    }
                    this.elementState = new ComponentState(result.component, componentObject);
                }
                else if (result instanceof TemplateResult) {
                    let { domElement, nodes } = result.template.clone();
                    let templateState = {
                        domElement: domElement,
                        children: [],
                        nodes: nodes,
                    };
                    result.templateFunction(templateState, childContext);
                    if (this.elementState instanceof ComponentState) {
                        this.elementState.componentObject.getDomElement().replaceWith(templateState.domElement);
                    }
                    else {
                        this.elementState.templateState.domElement.replaceWith(templateState.domElement);
                    }
                    this.elementState = new TemplateElementState(result.template, result.templateFunction, templateState);
                }
                else {
                    throw "render() function returned a string/array. Must return a JSX element of an HTML tag or a Component";
                }
                return true;
            }
        }
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
class SubElement extends BaseComponent {
    constructor(props) {
        super(props);
    }
    getDomElement() {
        return this.props.child;
    }
    attachContext(context) {
        super.attachContext(context);
    }
    dettachContext() {
        super.dettachContext();
    }
    renderElement() {
        return;
    }
    dispose() {
        super.dispose();
    }
}
exports.SubElement = SubElement;
class SubComponent extends BaseComponent {
    constructor(props) {
        super(props);
    }
    getDomElement() {
        let ele = this.props.child.getDomElement();
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
exports.SubComponent = SubComponent;
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
