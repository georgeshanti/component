import { Component, Context, findParentOfType, attach } from "component";

class K extends Component<{text: string}>{
    constructor(props: {text: string}){
        super(props);
    }

    attachContext(context: Context): void {
        super.attachContext(context);
        console.log(findParentOfType(this.context!, G));
    }

    click(){
        console.log("Click action");
    }

    render(): any {
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
                { this.showThere && "There"}
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

attach(document.getElementById("root")!, <G/>);

export{};