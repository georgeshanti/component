declare global {
    namespace JSX {
        interface IntrinsicElements {
            a: any;
            b: any;
            br: {};
            div: any;
            form: any;
            h1: any;
            h2: any;
            h3: any;
            h4: any;
            h5: any;
            i: any;
            img: any;
            input: any;
            li: any;
            ol: any;
            p: any;
            span: any;
            ul: any;
            pre: any;
        }
    }
}

type NodesListFunction = (domElement: Node)=>{[key: string]: Node};

type TemplateFunction = (elementState: TemplateState, context: Context)=>void;

type TemplateState = {
    domElement: Node,
    children: ElementState[],
    nodes: {[key: string]: Node},
}

export type Ref = {
    element?: Node
};

export function createRef(): Ref{
    return { element: undefined };
}

export class Template{
    domElement: Node;
    nodesListFunction: NodesListFunction;

    constructor(htmlString: string, nodesListFunction: NodesListFunction){
        let templateElement = document.createElement('div');
        templateElement.innerHTML = htmlString;
        this.domElement = templateElement.firstChild!;
        this.nodesListFunction = nodesListFunction;
    };

    clone(){
        let newDomElement = this.domElement.cloneNode(true);
        let nodes = this.nodesListFunction(newDomElement);
        return {
            domElement: newDomElement,
            nodes: nodes
        };
    }
}

export class TextNodeState{
    value: string;
    domElement: Node;

    constructor(value: string, domElement: Node){
        this.value = value;
        this.domElement = domElement;
    }
}

export class ArrayElementState{
    children: ElementState[];

    constructor(children: ElementState[]){
        this.children = children;
    }
}

export class ComponentState{
    component: typeof BaseComponent;
    componentObject: BaseComponent<any>;

    constructor(component: typeof BaseComponent, componentObject: BaseComponent<any>){
        this.component = component;
        this.componentObject = componentObject;
    }
}

export class TemplateElementState{
    template: Template;
    templateFunction: TemplateFunction;
    templateState: TemplateState;

    constructor(
        template: Template,
        templateFunction: TemplateFunction,
        templateState: TemplateState,
    ){
        this.template = template;
        this.templateFunction = templateFunction;
        this.templateState = templateState;
    }
}

export class ComponentResult{
    component: typeof BaseComponent;
    props: {[key: string]: any};

    constructor(component: typeof BaseComponent, props: {[key: string]: any}){
        this.component = component;
        this.props = props;
    }
}

export class TemplateResult{
    template: Template;
    templateFunction: TemplateFunction;
    
    constructor(template: Template, templateFunction: TemplateFunction){
        this.template = template;
        this.templateFunction = templateFunction;
    }
}

type Result = undefined | null | false | string | Result[] | ComponentResult | TemplateResult;

type ElementState = undefined | null | TextNodeState | ArrayElementState | ComponentState | TemplateElementState;

function disposeElement(elementState: ElementState){
    if(elementState==undefined || elementState==null){
        return;
    }if(elementState instanceof TextNodeState){
        (elementState.domElement as Element).remove();
    }else if(elementState instanceof ArrayElementState){
        for(let childElementState of elementState.children){
            disposeElement(childElementState);
        }
    }else if(elementState instanceof ComponentState){
        elementState.componentObject.dispose();
    }else if(elementState instanceof TemplateElementState){
        for(let childElementState of elementState.templateState.children){
            disposeElement(childElementState);
        }
        (elementState.templateState.domElement as Element).remove();
    }
}

type NodeWrapper = {
    node: Node | null
}

function createResult(result: Result, parent: Node, previousNode: NodeWrapper, context: Context): ElementState | null{
    if(result==null || result==undefined || result===false){
        return null;
    }else if(typeof result==="string"){
        let nextNode = document.createTextNode(result);
        if(previousNode.node!=null){
            (previousNode.node as Element).after(nextNode);
        }else{
            (parent as Element).prepend(nextNode);
        }
        previousNode.node=nextNode;
        return new TextNodeState(result, nextNode);
    }else if(Array.isArray(result)){
        let children = [];
        for(let childResult of result){
            const newElementState = createResult(childResult, parent, previousNode, context);
            children.push(newElementState);
        }
        return new ArrayElementState(children);
    }else if(result instanceof ComponentResult){
        let componentObject = new result.component(result.props);
        componentObject.attachContext(context);
        let addToTree = componentObject.renderElement();
        if(previousNode.node!=null){
            (previousNode.node as Element).after(componentObject.getDomElement());
        }else{
            (parent as Element).prepend(componentObject.getDomElement());
        }
        previousNode.node=componentObject.getDomElement();
        return new ComponentState(result.component, componentObject);
    }else if(result instanceof TemplateResult){
        let {domElement: nextNode, nodes} = result.template.clone();
        let templateState: TemplateState = {
            domElement: nextNode,
            children: [],
            nodes: nodes,
        }
        result.templateFunction(templateState, context);
        if(previousNode.node!=null){
            (previousNode.node as Element).after(nextNode);
        }else{
            (parent as Element).prepend(nextNode);
        }
        previousNode.node=nextNode;
        return new TemplateElementState(result.template, result.templateFunction, templateState);
    }else{
        throw "Unhandled condition";
    }
}

function replaceElement(elementState: ElementState, _result: Result, parent: Node, previousNode: NodeWrapper, context: Context){
    if(elementState==null){ throw "Cannot replace null element" }
    if(elementState instanceof TextNodeState){
        let result = _result as string;
        if(elementState.value==result){
            // START For hot reload
            elementState.value=result;
            let domElement = document.createTextNode(result);
            (elementState.domElement as Element).replaceWith(domElement);
            elementState.domElement = domElement;

            if(previousNode.node!=null){
                (previousNode.node as Element).after(domElement);
            }else{
                (parent as Element).prepend(domElement);
            }
            // END For hot reload

            previousNode.node=elementState!.domElement;
            return elementState;
        }else{
            elementState.value=result;
            let domElement = document.createTextNode(result);
            (elementState.domElement as Element).replaceWith(domElement);
            elementState.domElement = domElement;

            // START For hot reload
            if(previousNode.node!=null){
                (previousNode.node as Element).after(domElement);
            }else{
                (parent as Element).prepend(domElement);
            }
            // END For hot reload

            previousNode.node=domElement;
            return elementState;
        }
    }else if(elementState instanceof ArrayElementState){
        let index = 0;
        let result = _result as Result[];
        while(index<elementState.children.length && index<result.length){
            elementState.children[index] = compareAndCreate(elementState.children[index], result[index], parent, previousNode, context);
            index++;
        }
        if(index<elementState.children.length){
            while(index<elementState.children.length){
                disposeElement(elementState.children[elementState.children.length-1]);
                elementState.children.pop();
            }
        }
        if(index<result.length){
            while(index<result.length){
                elementState.children[index] = createResult(result[index], parent, previousNode, context);
                index++;
            }
        }
        return elementState;
    }else if(elementState instanceof ComponentState){
        let result = _result as ComponentResult;
        elementState.componentObject.updateWithProps(result.props);

        // START For hot reload
        if(previousNode.node!=null){
            (previousNode.node as Element).after(elementState.componentObject.getDomElement());
        }else{
            (parent as Element).prepend(elementState.componentObject.getDomElement());
        }
        // END For hot reload

        previousNode.node=elementState.componentObject.getDomElement();
        return elementState;
    }else if(elementState instanceof TemplateElementState){
        let result = _result as TemplateResult;

        // Without hot reload
        // elementState.templateFunction(elementState.templateState, context);
        // Without hot reload

        // START For hot reload
        let {domElement, nodes} = result.template.clone();
        let oldDomElement = elementState.templateState.domElement;
        elementState.templateState = {
            domElement: domElement,
            children: elementState.templateState.children,
            nodes: nodes,
        };
        result.templateFunction(elementState.templateState, context);
        (oldDomElement as Element).replaceWith(domElement);
        if(previousNode.node!=null){
            (previousNode.node as Element).after(elementState.templateState.domElement!);
        }else{
            (parent as Element).prepend(elementState.templateState.domElement!);
        }
        // END For hot reload

        previousNode.node=elementState.templateState.domElement;
        return elementState;
    }else{
        throw "Unhandled condition";
    }
}

export function compareAndCreate(elementState: ElementState, result: Result | number, parent: Node, previousNode: NodeWrapper, context: Context): ElementState{
    result = result===false?null:result;
    result = (typeof result=="number")?result.toString():result;
    if(elementState==null && result==null){
        return null;
    }else if (elementState==null && result!=null){
        let obj = createResult(result, parent, previousNode, context);
        return obj;
    }else if (elementState!=null && result==null){
        disposeElement(elementState);
        return null;
    }else if (elementState!=null && result!=null){
        if(
            (typeof result=="string" && !(elementState instanceof TextNodeState)) ||
            (Array.isArray(result) && !(elementState instanceof ArrayElementState)) ||
            (
                ( typeof result!="string" && !Array.isArray(result) ) &&
                (
                    (result instanceof TemplateResult && elementState instanceof ComponentState) ||
                    (result instanceof ComponentResult && elementState instanceof TemplateElementState) ||
                    (result instanceof ComponentResult && elementState instanceof ComponentState && result.component!=elementState.component) ||
                    (result instanceof TemplateResult && elementState instanceof TemplateElementState && result.template!=elementState.template)
                )
            )
        ){
            disposeElement(elementState);
            return createResult(result, parent, previousNode, context);
        }else{
            return replaceElement(elementState, result, parent, previousNode, context);
        }
    }else{
        throw "Unhandled condition";
    }
}

export class Context{
    parentComponentList: Component<any>[] = [];
}

export function findParentOfType<Props extends {[key:string]: any}>(context: Context, parentType: typeof Component<Props>){
    for(let i=context.parentComponentList.length-1;i>=0;i--){
        if(context.parentComponentList[i] instanceof parentType) return context.parentComponentList[i];
    }
    return null;
}

export class BaseComponent<Props extends {[key: string]: any}>{
    props: Props;
    context?: Context;

    getDomElement(): Node{
        throw "Unimplemented";
    }

    constructor(props: Props){
        this.props = props;
    }

    attachContext(context: Context){
        this.context = context;
    }

    dettachContext(){
        this.context = undefined;
    }

    updateWithProps(props: Props){
        let oldProps: Props = this.props;
        this.props = props;
        this.didUpdateProps(oldProps);
        this.renderElement();
    }

    renderElement(){
        throw "Unimplemented";
    }

    didUpdateProps(oldProps: Props): void{}

    dispose(): void{}
}

export class Component<Props extends {[key: string]: any}> extends BaseComponent<Props>{
    elementState: ComponentState | TemplateElementState | null = null;
    markedForRerender: boolean = false;
    addToContextTree: boolean = false;

    constructor(props: Props){
        super(props);
    }

    getDomElement(): Node {
        if(this.elementState instanceof ComponentState){
            return this.elementState.componentObject.getDomElement();
        }else if(this.elementState instanceof TemplateElementState){
            return this.elementState.templateState.domElement;
        }else{
            throw "No node element present";
        }
    }

    renderElement(): boolean{
        let result: ComponentResult | TemplateResult | boolean = this.render();
        if(result==null || result==undefined || result==false){
            throw "render() function returned null/undefined/false. Must return a JSX element.";
        }
        if(typeof result=="string" || Array.isArray(result)){
            throw "render() function returned a string/array. Must return a JSX element";
        }
        let childContext = new Context();
        if(this.context!=undefined){
            childContext.parentComponentList = [...this.context!.parentComponentList];
        }
        if(this.addToContextTree) childContext.parentComponentList.push(this);
        if(this.elementState==null){
            if(result instanceof ComponentResult){
                let componentObject = new result.component(result.props);
                this.elementState = new ComponentState(result.component, componentObject);
                componentObject.attachContext(childContext);
                componentObject.renderElement();
            }
            else if(result instanceof TemplateResult){
                let {domElement, nodes} = result.template.clone();
                let templateState = {
                    domElement: domElement,
                    children: [],
                    nodes: nodes,
                };
                this.elementState = new TemplateElementState(result.template, result.templateFunction, templateState);
                result.templateFunction(templateState, childContext);
            }else{
                throw "render() function returned a string/array. Must return a JSX element of an HTML tag or a Component"
            }
            return true;
        }else{
            if(this.elementState instanceof ComponentState && result instanceof ComponentResult && this.elementState.component==result.component){
                this.elementState.componentObject.updateWithProps(result.props);
                return false;
            }else if(this.elementState instanceof TemplateElementState && result instanceof TemplateResult && this.elementState.template==result.template){

                // START For hot reload
                let {domElement, nodes} = result.template.clone();
                let oldDomElement = this.elementState.templateState.domElement;
                this.elementState.templateState = {
                    domElement: domElement,
                    children: this.elementState.templateState.children,
                    nodes: nodes,
                };
                // END For hot reload

                result.templateFunction(this.elementState.templateState, childContext);
                
                // START For hot reload
                (oldDomElement as Element).replaceWith(domElement);
                // END For hot reload
                
                return false;
            }else{
                if(result instanceof ComponentResult){
                    let componentObject = new result.component(result.props);
                    componentObject.attachContext(childContext);
                    componentObject.renderElement();
                    if(this.elementState instanceof ComponentState){
                        (this.elementState.componentObject.getDomElement() as Element).replaceWith(componentObject.getDomElement());
                    }else{
                        (this.elementState.templateState.domElement as Element).replaceWith(componentObject.getDomElement());
                    }
                    this.elementState = new ComponentState(result.component, componentObject);
                }else if(result instanceof TemplateResult){
                    let {domElement, nodes} = result.template.clone();
                    let templateState = {
                        domElement: domElement,
                        children: [],
                        nodes: nodes,
                    };
                    result.templateFunction(templateState, childContext);
                    if(this.elementState instanceof ComponentState){
                        (this.elementState.componentObject.getDomElement() as Element).replaceWith(templateState.domElement);
                    }else{
                        (this.elementState.templateState.domElement as Element).replaceWith(templateState.domElement);
                    }
                    this.elementState = new TemplateElementState(result.template, result.templateFunction, templateState);
                }else{
                    throw "render() function returned a string/array. Must return a JSX element of an HTML tag or a Component"
                }
                return true;
            }
        }
    }

    render(): any{
        return {};
    };

    dispose(): void {
        if(this.elementState!=null){
            disposeElement(this.elementState);
        }
        super.dispose();
    }
}

type SubElementProps = {child: HTMLElement}

export class SubElement extends BaseComponent<SubElementProps>{
    constructor(props: SubElementProps){
        super(props);
    }

    getDomElement(): Node {
        return this.props.child;
    }

    attachContext(context: Context): void {
        super.attachContext(context);
    }

    dettachContext(): void {
        super.dettachContext();
    }

    renderElement(): void {
        return;
    }

    dispose(): void {
        super.dispose();
    }
}

type SubComponentProps = {child: BaseComponent<any>}

export class SubComponent extends BaseComponent<SubComponentProps>{
    constructor(props: SubComponentProps){
        super(props);
    }

    getDomElement(): Node {
        let ele = this.props.child.getDomElement();
        return ele;
    }

    attachContext(context: Context): void {
        super.attachContext(context);
        this.props.child.attachContext(this.context!);
    }

    dettachContext(): void {
        this.props.child.dettachContext();
        super.dettachContext();
    }

    didUpdateProps(oldProps: SubComponentProps): void {
        if(this.props.child!=oldProps.child){
            oldProps.child.dettachContext();
            this.props.child.attachContext(this.context!);
        }
    }

    renderElement(): void {
        this.props.child.renderElement();
    }

    dispose(): void {
        this.props.child.dettachContext();
        super.dispose();
    }
}

let rootElemntUid: number;
let rootElementStates: {[key: string]: ElementState};
export function attach(element: HTMLElement, result: any): any{
    if(rootElementStates==undefined){
        rootElementStates = {};
        rootElemntUid = 0;
    }
    let elementUid: string | null = element.getAttribute("element-uid");
    let elementState=null;
    let context: Context = new Context();
    if(elementUid==null){
        elementUid = (rootElemntUid++).toString();
        element.setAttribute("element-uid", elementUid);
    }else{
        elementState = rootElementStates[elementUid];
    }
    rootElementStates[elementUid] = compareAndCreate(elementState, result, element, {node: null}, context);
}