function template(htmlString){
    let templateElement = document.createElement('div');
    templateElement.innerHTML = htmlString;
    return templateElement.firstChild;
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
        return {
            elementState: null,
            nextNode: previousNode
        };
    }else if(typeof result==="string"){
        let nextNode = document.createTextNode(result);
        if(previousNode!=null){
            previousNode.after(nextNode);
        }else{
            parent.prepend(nextNode);
        }
        return {
            elementState:{
                type: "string",
                value: result,
                domElement: nextNode,
            },
            nextNode: nextNode
        }
    }else if(Array.isArray(result)){
        let children = [];
        let newNextNode = previousNode;
        for(let childResult of result){
            const {elementState, nextNode} = createResult(childResult, parent, newNextNode);
            children.push(elementState);
            newNextNode = nextNode;
        }
        return {
            elementState: {
                type: "array",
                children: children,
            },
            nextNode: newNextNode
        };
    }else if(result.type=="component"){
        let componentObject = new result.component(result.props);
        let addToTree = componentObject.renderElement();
        if(previousNode!=null){
            previousNode.after(componentObject.domElement);
        }else{
            parent.prepend(componentObject.domElement);
        }
        return {
            elementState: {
                type: "component",
                component: result.component,
                componentObject: componentObject,
            },
            nextNode: componentObject.domElement,
        }
    }else if(result.type=="template"){
        let nextNode = result.template.cloneNode(true);
        let templateState = {
            domElement: nextNode,
            children: [],
        }
        result.templateFunction(templateState);
        if(previousNode!=null){
            previousNode.after(nextNode);
        }else{
            parent.prepend(nextNode);
        }
        return {
            elementState: {
                type: "template",
                template: result.template,
                templateFunction: result.templateFunction,
                templateState: templateState,
            },
            nextNode: nextNode,
        };
    }else{
        throw "Unhandled condition";
    }
}

function replaceElement(elementState, result, parent, previousNode){
    if(elementState.type=="string"){
        if(elementState.value==result){
            return {
                elementState: elementState,
                nextNode: elementState.domElement,
            };
        }else{
            elementState.value=result;
            let domElement = document.createTextNode(result);
            console.log("replacing text element");
            elementState.domElement.replaceWith(domElement);
            elementState.domElement = domElement;
            return {
                elementState: elementState,
                nextNode: domElement,
            };
        }
    }else if(elementState.type=="array"){
        let index = 0;
        let newPreviousNode = previousNode;
        console.log(elementState.children.length, result.length);
        while(index<elementState.children.length && index<result.length){
            console.log(parent, newPreviousNode);
            const  {elementState: newElementState, nextNode} = compareAndCreate(elementState.children[index], result[index], parent, newPreviousNode);
            elementState.children[index]= newElementState;
            newPreviousNode = nextNode;
            index++;
        }
        if(index<elementState.children.length){
            console.log("Deleting from end of the list");
            while(index<elementState.children.length){
                disposeElement(elementState.children[elementState.children.length-1]);
                elementState.children.pop();
            }
        }
        if(index<result.length){
            while(index<result.length){
                const  {elementState: newElementState, nextNode} = createResult(result[index], parent, newPreviousNode);
                elementState.children[index] = newElementState;
                newPreviousNode = nextNode;
                index++;
            }
        }
        return {
            elementState: elementState,
            nextNode: newPreviousNode,
        };
    }else if(elementState.type=="component"){
        elementState.componentObject.updateWithProps(result.props);
        return {
            elementState: elementState,
            nextNode: elementState.componentObject.domElement,
        };
    }else if(elementState.type=="template"){
        elementState.templateFunction(elementState.templateState);
        return {
            elementState: elementState,
            nextNode: elementState.templateState.domElement,
        };
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
        let obj = {
            elementState: null,
            nextNode: previousNode,
        }
        return obj;
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
            let obj = createResult(result, parent, previousNode);
            return obj;
        }else{
            let obj = replaceElement(elementState, result, parent, previousNode);
            return obj;
        }
    }else{
        throw "Unhandled condition";
    }
}

export { template, getElement, disposeElement, compareAndCreate };