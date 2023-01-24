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
type TextNodeState = {
    type: "string";
    value: string;
    domElement: Node;
};
type ArrayElementState = {
    type: "array";
    children: ElementState[];
};
type ComponentState = {
    type: "component";
    component: typeof Component;
    componentObject: Component<any>;
};
type TemplateElementState = {
    type: "template";
    template: Template;
    templateFunction: TemplateFunction;
    templateState: TemplateState;
};
type ComponentResult = {
    type: "component";
    component: typeof Component;
    props: {
        [key: string]: any;
    };
};
type TemplateResult = {
    type: "template";
    template: Template;
    templateFunction: TemplateFunction;
};
type Result = undefined | null | false | string | Result[] | ComponentResult | TemplateResult;
type ElementState = undefined | null | TextNodeState | ArrayElementState | ComponentState | TemplateElementState;
type NodeWrapper = {
    node: Node | null;
};
export declare function compareAndCreate(elementState: ElementState, result: Result, parent: Node, previousNode: NodeWrapper, context: Context): ElementState;
export declare class Context {
    parentComponentList: Component<any>[];
}
export declare function findParentOfType<Props extends {
    [key: string]: any;
}>(context: Context, parentType: typeof Component<Props>): Component<any> | null;
export declare class Component<Props extends {
    [key: string]: any;
}> {
    props: Props;
    elementState: ComponentState | TemplateElementState | null;
    domElement?: Node;
    context?: Context;
    markedForRerender: boolean;
    constructor(props: Props);
    attachContext(context: Context): void;
    dettachContext(): void;
    updateWithProps(props: Props): boolean;
    didUpdateProps(oldProps: Props): void;
    dispose(): void;
    renderElement(): boolean;
    setState(): void;
    render(): any;
}
export declare function attach(element: HTMLElement, result: any): any;
export {};
