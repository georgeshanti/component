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
        }
    }
}
type NodesListFunction = (domElement: Node) => {
    [key: string]: Node;
};
type TemplateFunction = (elementState: TemplateState, context: Context) => void;
type TemplateState = {
    domElement: Node;
    children: ElementState[];
    nodes: {
        [key: string]: Node;
    };
};
export type Ref = {
    element?: Node;
};
export declare function createRef(): Ref;
export declare class Template {
    domElement: Node;
    nodesListFunction: NodesListFunction;
    constructor(htmlString: string, nodesListFunction: NodesListFunction);
    clone(): {
        domElement: Node;
        nodes: {
            [key: string]: Node;
        };
    };
}
export declare class TextNodeState {
    value: string;
    domElement: Node;
    constructor(value: string, domElement: Node);
}
export declare class ArrayElementState {
    children: ElementState[];
    constructor(children: ElementState[]);
}
export declare class ComponentState {
    component: typeof BaseComponent;
    componentObject: BaseComponent<any>;
    constructor(component: typeof BaseComponent, componentObject: BaseComponent<any>);
}
export declare class TemplateElementState {
    template: Template;
    templateFunction: TemplateFunction;
    templateState: TemplateState;
    constructor(template: Template, templateFunction: TemplateFunction, templateState: TemplateState);
}
export declare class ComponentResult {
    component: typeof BaseComponent;
    props: {
        [key: string]: any;
    };
    constructor(component: typeof BaseComponent, props: {
        [key: string]: any;
    });
}
export declare class TemplateResult {
    template: Template;
    templateFunction: TemplateFunction;
    constructor(template: Template, templateFunction: TemplateFunction);
}
type Result = undefined | null | false | string | Result[] | ComponentResult | TemplateResult;
type ElementState = undefined | null | TextNodeState | ArrayElementState | ComponentState | TemplateElementState;
type NodeWrapper = {
    node: Node | null;
};
export declare function compareAndCreate(elementState: ElementState, result: Result | number, parent: Node, previousNode: NodeWrapper, context: Context): ElementState;
export declare class Context {
    parentComponentList: Component<any>[];
}
export declare function findParentOfType<Props extends {
    [key: string]: any;
}>(context: Context, parentType: typeof Component<Props>): Component<any> | null;
export declare class BaseComponent<Props extends {
    [key: string]: any;
}> {
    props: Props;
    context?: Context;
    getDomElement(): Node;
    constructor(props: Props);
    attachContext(context: Context): void;
    dettachContext(): void;
    updateWithProps(props: Props): void;
    renderElement(): void;
    didUpdateProps(oldProps: Props): void;
    dispose(): void;
}
export declare class Component<Props extends {
    [key: string]: any;
}> extends BaseComponent<Props> {
    elementState: ComponentState | TemplateElementState | null;
    markedForRerender: boolean;
    addToContextTree: boolean;
    constructor(props: Props);
    getDomElement(): Node;
    renderElement(): boolean;
    render(): any;
    dispose(): void;
}
type SubElementProps = {
    child: HTMLElement;
};
export declare class SubElement extends BaseComponent<SubElementProps> {
    constructor(props: SubElementProps);
    getDomElement(): Node;
    attachContext(context: Context): void;
    dettachContext(): void;
    renderElement(): void;
    dispose(): void;
}
type SubComponentProps = {
    child: BaseComponent<any>;
};
export declare class SubComponent extends BaseComponent<SubComponentProps> {
    constructor(props: SubComponentProps);
    getDomElement(): Node;
    attachContext(context: Context): void;
    dettachContext(): void;
    didUpdateProps(oldProps: SubComponentProps): void;
    renderElement(): void;
    dispose(): void;
}
export declare function attach(element: HTMLElement, result: any): any;
export {};
