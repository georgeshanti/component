# Component
This is a Javascript library to build UIs using reactive Components. It can be used by itself or as a way to just creative reactive components for use in other projects.

## Installation
Clone this repository and add it as a dependency to your npm project. You will also need to add babel dependencies becuase the JSX compiler is written as a babel plugin.
```
/*package.json*/
{
    "dependencies": {
        ...,
        "component": "path/to/repository",
        "babel-loader": "^9.1.2",
        "@babel/core": "^7.20.5"
    }
}
```

```
/*.babelrc*/
{
    "plugins": ["component/babel-plugin-component"]
}
```

A minimum setup project is available in the example folder. It is setup with webpack, babel and typescript with the necessary config files included. You can use that as a starting point.

## How it works
Component can be described in 2 parts.
i. A JSX Compiler that will allow us to write reactive HTML in JSX.
ii. A Component class that allows us to create stateful components.

### Component Class

Component class provides a way to manage a stateful HTML Element. It provides 6 essential methods that can be overriden.
```tsx
import { Component, attach } from 'component';

class SimpleComponent extends Component<{text: string}>{
    constructor(props: {text: string}){
        super(props);
    }

    click(){
        console.log("Click action");
    }

    render(): any {
        return (
            <div>
                {this.props.text}
            </div>
        );
    };
}

class CompositeComponent extends Component<{text: string}>{
    constructor(props: {text: string}){
        super(props);
    }

    click(){
        console.log("Click action");
    }

    render(): any {
        return (
            <div>
                Hello
                <SimpleComponent text="World!"/>
            </div>
        );
    };
}

attach(document.getElementById('root')!, <CompositeComponent/>);
```

### JSX Compiler

The Compiler will turn JSX into a static HTML Element and a function to change the variable portions of the Element.

Input:
```jsx
let k = (text: string, show: boolean)=>(
    <div>
        { show && (<span>Showing</span>)}
        <div n="18">{text}</div>
    </div>
)
```

Output:
```js
const { Template } = require('component');

const template_2 = new Template("<span>Showing</span>", domElement => {
  return {};
});

const template_1 = new Template("<div><div n=\"18\"></div></div>", domElement => {
  return {
    elm0: domElement,
    elm1: domElement.firstChild
  };
});

let k = (text, show) => ({
  type: "template",
  template: template_1,
  templateFunction: (templateState, context) => {
    let anchor = null;
    anchor = { node: null };
    templateState.children[0] = compareAndCreate(templateState.children[0], show && {
      type: "template",
      template: template_2,
      templateFunction: (templateState, context) => {}
    }, templateState.nodes.elm0, anchor, context);
    anchor = { node: null };
    templateState.children[1] = compareAndCreate(templateState.children[1], text, templateState.nodes.elm1, anchor, context);
  }
});
```