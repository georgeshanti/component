import { disposeElement } from 'template';

declare global {
    namespace JSX {
        interface IntrinsicElements {
            div: any;
            span: any;
            img: any;
        }
    }
}

class Component<Props extends {[key: string]: any}>{
    props: Props;
    elementState: {[key: string]: any} | null = null;
    domElement?: HTMLElement;

    constructor(props: Props){
        this.props = props;
    }

    updateWithProps(props: Props){
        let oldProps: Props = this.props;
        this.props = props;
        this.didUpdateProps(oldProps);
        return this.renderElement();
    }

    didUpdateProps(oldProps: Props): void{}

    dispose(): void{
        if(this.elementState!=null){
            disposeElement(this.elementState)
        }
    }

    renderElement(): boolean{
        let result: any = this.render();
        if(result==null || result==undefined || result==false){
            throw "render() function returned null/undefined/false. Must return a JSX element.";
        }
        if(typeof result=="string" || Array.isArray(result)){
            throw "render() function returned a string/array. Must return a JSX element";
        }
        if(this.elementState==null){
            if(result.type=="component"){
                let componentObject = new result.component(result.props);
                this.elementState = {
                    type: "component",
                    component: result.component,
                    componentObject: componentObject,
                }
                this.domElement = componentObject.domElement;
            }
            else if(result.type=="template"){
                let {domElement, nodes} = result.template.clone();
                let templateState = {
                    domElement: domElement,
                    children: [],
                    nodes: nodes,
                };
                result.templateFunction(templateState)
                this.elementState = {
                    type: "template",
                    template: result.template,
                    templateFunction: result.templateFunction,
                    templateState: templateState,
                }
                this.domElement = this.elementState.templateState.domElement;
            }else{
                throw "render() function returned a string/array. Must return a JSX element of an HTML tag or a Component"
            }
            return true;
        }else{
            if(this.elementState.type=="component" && result.type=="component" && this.elementState.component==result.component){
                this.elementState.componentObject.updateWithProps(result.props);
                this.domElement = this.elementState.componentObject.domElement;
                return false;
            }else if(this.elementState.type=="template" && result.type=="template" && this.elementState.template==result.template){
                result.templateFunction(this.elementState.templateState);
                return false;
            }else{
                if(result.type=="component"){
                    let componentObject = new result.component(result.props);
                    if(this.elementState.type=="component"){
                        this.elementState.componentObject.domElement.replaceWith(componentObject.domElement);
                    }else{
                        this.elementState.templateState.domElement.replaceWith(componentObject.domElement);
                    }
                    this.elementState = {
                        type: "component",
                        component: result.component,
                        componentObject: componentObject,
                    }
                }else if(result.type=="template"){
                    let {domElement, nodes} = result.template.clone();
                    let templateState = {
                        domElement: domElement,
                        children: [],
                        nodes: nodes,
                    };
                    result.templateFunction(templateState);
                    if(this.elementState.type=="component"){
                        this.elementState.componentObject.domElement.replaceWith(templateState.domElement);
                    }else{
                        this.elementState.templateState.domElement.replaceWith(templateState.domElement);
                    }
                    this.elementState = {
                        type: "template",
                        template: result.template,
                        templateFunction: result.templateFunction,
                        templateState: result.templateFunction(templateState),
                    }
                }else{
                    throw "render() function returned a string/array. Must return a JSX element of an HTML tag or a Component"
                }
                return true;
            }
        }
    }

    setState(){
        this.renderElement();
    }

    render(): object{
        return {};
    };
}
// class K extends Component<{}>{

// }

// new K({});

class K extends Component<{text: string}>{
    constructor(props: {text: string}){
        super(props);
    }

    click(){
        console.log("Click action");
    }

    render(): object {
        return (
            <div n="18">{this.props.text}</div>
        );
    };
}

class G extends Component<{}>{
    showHello = true;
    showThere = true;
    k = 1;
    constructor(props: {[key: string]: any}){
        super(props);
    }

    toggleHello = ()=>{
        this.showHello = !this.showHello;
        this.setState();
    }

    toggleThere = ()=>{
        this.showThere = !this.showThere;
        this.setState();
    }

    changeText = ()=>{
        this.k++;
        this.setState();
    }

    render() {
        return (
            <div n="1">
                <span n="2" onClick={this.toggleHello} style="background:green;padding:4px;display:inline-block;">Toggle Hello</span>&nbsp;&nbsp;&nbsp;&nbsp;
                <span n="3" onClick={this.toggleThere} style="background:green;padding:4px;display:inline-block;">Toggle There</span>&nbsp;&nbsp;&nbsp;&nbsp;
                <span n="4" onClick={this.changeText} style="background:green;padding:4px;display:inline-block;">Increment count and toggle list length</span>&nbsp;&nbsp;&nbsp;&nbsp;
                <span n="5"></span>
                <div n="6"></div>
                <span n="7"><span n="8"></span></span>
                { this.showHello && (<span n="9">Hello</span>)}
                { this.showThere && (<span n="10">There</span>)}
                <span n="11">
                    { true && (<span n="12"></span>)}
                    <span n="13"></span>
                    { true && (<span n="14"></span>)}
                    <span n="15"></span>
                </span>
                <span n="16"></span>
                <K text={this.k.toString()}/>
                {
                    (this.k%2==0?[1]:[1, 2]).map(x=>{
                        return <K text={(this.k+x).toString()}/>
                    })
                }
                {/* <div n="17">End</div> */}
            </div>
        );
    };
}

let globalState: any;

function attach(element: HTMLElement, result: any): any{
    if(result.type=="component"){
        let component = new result.component(result.props);
        globalState = component;
        component.renderElement();
        element.appendChild(component.domElement);
    }else if(result.type=="template"){
        let {domElement, nodes} = result.template.clone();
        let templateState = {
            domElement: domElement,
            children: [],
            nodes: nodes,
        }
        globalState = templateState;
        element.appendChild(domElement);
    }
}

window.print = ()=>{
    console.log(globalState);
}

attach(document.getElementById("root")!, <G/>);

export {Component, attach};