class Template{
    domElement;
    nodesListFunction;

    constructor(htmlString, nodesListFunction){
        let templateElement = document.createElement('div');
        templateElement.innerHTML = htmlString;
        this.domElement = templateElement.firstChild;
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

function getElement(parent, nextNode){
    let nextNewNode = nextNode==null?parent.firstChild:nextNode.nextSibling;
    return nextNewNode;
}


function disposeElement(elementState){
    if(elementState==undefined || elementState==null){
        return;
    }if(elementState.type=="string"){
        elementState.domElement.remove();
    }else if(elementState.type=="array"){
        for(let childElementState of elementState.children){
            disposeElement(childElementState);
        }
    }else if(elementState.type=="component"){
        elementState.componentObject.dispose();
    }else if(elementState.type=="template"){
        for(let childElementState of elementState.templateState.children){
            disposeElement(childElementState);
        }
        elementState.templateState.domElement.remove();
    }
}

function createResult(result, parent, previousNode){
    if(result==null || result==undefined || result==false){
        return null;
    }else if(typeof result==="string"){
        let nextNode = document.createTextNode(result);
        if(previousNode.node!=null){
            previousNode.node.after(nextNode);
        }else{
            parent.prepend(nextNode);
        }
        previousNode.node=nextNode;
        return {
            type: "string",
            value: result,
            domElement: nextNode,
        }
    }else if(Array.isArray(result)){
        let children = [];
        for(let childResult of result){
            const newElementState = createResult(childResult, parent, previousNode);
            children.push(newElementState);
        }
        return {
            type: "array",
            children: children,
        };
    }else if(result.type=="component"){
        let componentObject = new result.component(result.props);
        let addToTree = componentObject.renderElement();
        if(previousNode.node!=null){
            previousNode.node.after(componentObject.domElement);
        }else{
            parent.prepend(componentObject.domElement);
        }
        previousNode.node=componentObject.domElement;
        return {
            type: "component",
            component: result.component,
            componentObject: componentObject,
        };
    }else if(result.type=="template"){
        let {domElement: nextNode, nodes} = result.template.clone();
        let templateState = {
            domElement: nextNode,
            children: [],
            nodes: nodes,
        }
        result.templateFunction(templateState);
        if(previousNode.node!=null){
            previousNode.node.after(nextNode);
        }else{
            parent.prepend(nextNode);
        }
        previousNode.node=nextNode;
        return {
            type: "template",
            template: result.template,
            templateFunction: result.templateFunction,
            templateState: templateState,
        };
    }else{
        throw "Unhandled condition";
    }
}

function replaceElement(elementState, result, parent, previousNode){
    if(elementState.type=="string"){
        if(elementState.value==result){
            previousNode.node=elementState.domElement;
            return elementState;
        }else{
            elementState.value=result;
            let domElement = document.createTextNode(result);
            elementState.domElement.replaceWith(domElement);
            elementState.domElement = domElement;
            previousNode.node=domElement;
            return elementState;
        }
    }else if(elementState.type=="array"){
        let index = 0;
        while(index<elementState.children.length && index<result.length){
            elementState.children[index] = compareAndCreate(elementState.children[index], result[index], parent, previousNode);
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
                elementState.children[index] = createResult(result[index], parent, previousNode);
                index++;
            }
        }
        return elementState;
    }else if(elementState.type=="component"){
        elementState.componentObject.updateWithProps(result.props);
        previousNode.node=elementState.componentObject.domElement;
        return elementState;
    }else if(elementState.type=="template"){
        elementState.templateFunction(elementState.templateState);
        previousNode.node=elementState.templateState.domElement;
        return elementState;
    }else{
        throw "Unhandled condition";
    }
}

function compareAndCreate(elementState, result, parent, previousNode){
    result = result==false?null:result;
    if(elementState==null && result==null){
        let obj = {
            elementState: null,
            nextNode: previousNode,
        }
        return obj;
    }else if (elementState==null && result!=null){
        let obj = createResult(result, parent, previousNode);
        return obj;
    }else if (elementState!=null && result==null){
        disposeElement(elementState);
        return null;
    }else if (elementState!=null && result!=null){
        if(
            (typeof result=="string" && elementState.type!="string") ||
            (Array.isArray(result) && elementState.type!="array") ||
            (
                ( typeof result!="string" && !Array.isArray(result) ) &&
                (
                    (result.type!=elementState.type) ||
                    (result.type!=elementState.type && result.type=="component" && result.component!=elementState.component) ||
                    (result.type!=elementState.type && result.type=="template" && result.template!=elementState.template)
                )
            )
        ){
            disposeElement(elementState);
            return createResult(result, parent, previousNode);
        }else{
            return replaceElement(elementState, result, parent, previousNode);
        }
    }else{
        throw "Unhandled condition";
    }
}

export { Template, getElement, disposeElement, compareAndCreate };