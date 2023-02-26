import { Component, Context, findParentOfType, attach, createRef, Ref, SubComponent, BaseComponent, SubElement } from "component";

class K extends Component<{text: string}>{
    ref: Ref;

    constructor(props: {text: string}){
        super(props);
        this.ref = createRef();
    }

    attachContext(context: Context): void {
        super.attachContext(context);
        console.log(findParentOfType(this.context!, G));
    }

    click(){
        console.log(this.ref);
    }

    render(): any {
        return (
            <div n="18" onClick={this.click.bind(this)} ref={this.ref}>{this.props.text}</div>
        );
    };
}

class Tree  extends Component<{}>{
    count: number = 0;
    constructor(props: {}){
        super(props)
    }
    increment(){
        this.count++;
        this.renderElement();
    }
    render() {
        console.log(this.count.toString());
        return (<div onClick={this.increment.bind(this)}>{this.count.toString()}</div>);
    }
}

class G extends Component<{}>{
    showHello = true;
    showThere = true;
    k = 1;
    position: boolean = false;
    child: BaseComponent<any>;
    element: HTMLElement;
    count: number = 0;

    constructor(props: {[key: string]: any}){
        super(props);
        this.child = new Tree({});
        this.element = document.createElement('div');
        this.element.innerHTML = this.count.toString();
        this.element.onclick = (e)=>{
            this.count++;
            this.element.innerHTML = this.count.toString();
        }
    }

    toggleHello(){
        this.showHello = !this.showHello;
        this.renderElement();
    }

    toggleThere(){
        this.showThere = !this.showThere;
        this.renderElement();
    }

    changeText(){
        this.k++;
        this.renderElement();
    }

    switchPosition(){
        this.position = !this.position;
        this.renderElement();
    }

    render() {
        return (
            <div n="1">
                <span n="2" onClick={this.toggleHello.bind(this)} style="background:green;padding:4px;display:inline-block;">Toggle Hello</span>&nbsp;&nbsp;&nbsp;&nbsp;
                <span n="3" onClick={this.toggleThere.bind(this)} style="background:green;padding:4px;display:inline-block;">Toggle There</span>&nbsp;&nbsp;&nbsp;&nbsp;
                <span n="4" onClick={this.changeText.bind(this)} style="background:green;padding:4px;display:inline-block;">Increment count and toggle list length</span>&nbsp;&nbsp;&nbsp;&nbsp;
                <span n="4" onClick={this.switchPosition.bind(this)} style="background:green;padding:4px;display:inline-block;">Switch</span>&nbsp;&nbsp;&nbsp;&nbsp;
                <span n="5"></span>
                {this.position?<SubComponent child={this.child}/>:<SubElement child={this.element} />}
                <div n="6"></div>
                <span n="7"><span n="8"></span></span>
                { this.showHello && (<span n="9">Hello</span>)}
                { this.showThere && "There"}
                <span n="11">
                    { true && (<span n="12"></span>)}
                    <span n="13"></span>
                    { true && (<span n="14"></span>)}
                    <span n="15"></span>
                </span>
                {!this.position?<SubComponent child={this.child}/>:<SubElement child={this.element} />}
                <span n="16"></span>
                <K text={this.k.toString()}/>
                {
                    (this.k%2==0?[1]:[1, 2]).map(x=>{
                        return <K text={(this.k+x).toString()}/>
                    })
                }
            </div>
        );
    };
}

attach(document.getElementById("root")!, <G/>);

export{};