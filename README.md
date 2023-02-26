_Note: This project is still in development. I would not call it stable just yet. If you wish to collaborate then feel free to reach out to me on twitter or just raise an issue and we can start from there._

# Component
Component a javascript library to build stateful, reactive UI components. It can be used to build your entire web application or it can be used to build reusable UI components in your existing work.

## Installation

Component works by using a babel plugin to convert the JSX you write into templates and functions. So you will need to install babel and babel-load. There is a working example project in this repository that uses webpack, babel and typescript.

Clone this repository and add it as a dependency to your npm project. You will also need to add babel dependencies becuase the JSX compiler is written as a babel plugin.
``` json
{
    "dependencies": {
        "component": "git+http://github.com/georgeshanti/component"
    },
    "devDependencies": {
        "babel-loader": "^9.1.2",
        "@babel/core": "^7.20.5"
    }
}
```

``` json
{
    "plugins": ["component/babel-plugin-component"]
}
```

## Basic Usage

This section will show you only some of the concepts but to build a full web app you will need to go through a lot more of this for which I will setup a Getting Started guide soon.

Let's look at how we can build multiple components and compose them together. This will look very familiar if you're used to other reactive UI libraries.

``` tsx
import { Component, attach } from "component";

class HelloWorld extends Component<{name: string}>{
    count: number = 0;

    constructor(props: {name: string}){
        super(props);
    }

    click(){
        this.count++;
        this.rerender();
    }

    render(): any {
        return (
            <div>
                <p>Hello, {this.props.name}!</p>
                <p>Button has been clicked {count} times!</p>
                <button onClick={this.click.bind(this)}>Increment</button>
            </div>
        );
    };
}

class App extends Component<{}>{

    constructor(props: {[key: string]: any}){
        super(props);
        this.child = new Tree({});
    }

    render() {
        return (
            <div>
                This is our root app and we can place HTML elements like <b>'This bold text'</b> or this <input type="submit">Button</button><br/>
                We can even embed other components we built like HelloWorld
                <HelloWorld name="George Thomas Shanti"/>
            </div>
        );
    };
}

attach(document.getElementById("root")!, <App />);

export{};
```

Component does not use a special field to store state like in React. State of an object is normally just the values of its fields. So component takes this very simple approach, your components state is just whatever fields you add to them and instead of a `setState()` function there is just a `renderElement()` function that does what it says.

## Extensibility

### Use Component as just a library for reusable UI components
You can build any number of UI elements and compose them together to make large components and extract the root HTML elements of these components. This allows you to use these build these components and take it's root HTML element an place them in your place. Let's look at how you can do that.

``` tsx
let app: App = new App();

/* This will render the component into an HTML element */
app.renderElement();

/* This will return the HTML Element associated with the component */
let htmlElement: HTMLElement = app.getDomElement();

/* And now we can place this component anywhere we want in the page */
document.getElementById("root").appendChild(htmlElement);
```

### Use other libraries within Component

You can also embed any HTML Element you want into a component and not have to worry about Component's system interfering with it. So you can use any other library you want as long as it acts only on it's given HTML Element and it's children and not it's parent elements, that will obviously cause problems with the Component you embed it in. This is achieved by using the `SubElement` component

``` tsx
import { Component, Sub } from "component";

class OtherLibrary extends Component<{}>{
    let otherLibraryElement: HTMLElement;

    constructor(props: {}){
        super(props);

        /* If it needs just the HTML Element */
        otherLibraryElement = document.createElement('div');
        OtherLibraryFunction(otherLibraryElement);
        
        /* If it needs an HTML Element with a specific id or something */
        otherLibraryElement = document.createElement('div');
        otherLibraryElement.setAttribute('id', 'otherLibraryId')
        OtherLibraryFunction.init();
    }

    render(): any {
        return (
            <div>
                <p>This component uses some other library as well</div>
                <SubElement child={this.otherLibraryElement} />
            </div>
        );
    };
}
```

### Combine both aspects 👀

If you think about it a little then you'll realise that you can move Components around the HTML tree while still preserving it's state. There's another component specifically made for this, `SubComponent`.

``` tsx
import { Component, Sub } from "component";

class App extends Component<{}>{
    let helloWorld: HelloWorld;
    let position: boolean = true;

    constructor(props: {}){
        super(props);
        
        helloWorld = new HelloWorld({name: 'George Thomas Shanti'});
    }

    click(){
        this.position = !this.position;
        this.renderElement();
    }

    render(): any {
        return (
            <div>
                {this.position?<SubComponent child={this.helloWorld}/>:null}
                <Button onClick={this.click.bind(this)} />
                {!this.position?<SubComponent child={this.helloWorld}/>:null}
            </div>
        );
    };
}
```

Clicking the button will move the HelloWorld component between being before and after the button. Any state you choose to store in HelloWorld component will be preserved.

## Some things to figure out
 - Still need to make the output code less verbose which I will do in the coming weeks.
 - Figuring out better lifecycle methods. It's still pretty crude at the moment.
 - Completing the list html elements the parser recognises and a better way to define the accepatble attributes for each one.