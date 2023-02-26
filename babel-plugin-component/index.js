const trimRegex = /(^\s*)|(\s*$)/;
const htmlTags = ["a", "b", "br", "div", "form", "h1", "h2", "h3", "h4", "h5", "i", "img", "input", "li", "ol", "p", "span", "ul"]
const htmlSingleTags = ["br"];
const {default: generate} = require("@babel/generator");

module.exports = function (babel) {
    let t = babel.types;

    /* Declare common identifiers to be used */
    let template = t.identifier("template");
    let templateClass = t.identifier("Template");
    let componentResultClass = t.identifier("ComponentResult");
    let templateResultClass = t.identifier("TemplateResult");
    let compareAndCreate = t.identifier("compareAndCreate");
    let templateState = t.identifier("templateState");
    let anchor = t.identifier("anchor");
    let context = t.identifier("context");

    /* Declare reused statements */
    
    let nextNodeExpressionSetter = (childIndex, expression, parentIdentifier, previousIdentifier)=>t.expressionStatement(
        t.assignmentExpression(
            "=",
            t.memberExpression(t.memberExpression(templateState, t.identifier("children")), t.numericLiteral(childIndex), true),
            t.callExpression(
                compareAndCreate,
                [
                    t.memberExpression(t.memberExpression(templateState, t.identifier("children")), t.numericLiteral(childIndex), true),
                    expression,
                    parentIdentifier,
                    previousIdentifier,
                    context,
                ]
            )
        )
    );

    let getNodeKey = (parentNodeIdentifier, childIndex)=>{
        let memberExpression;
        for(let i=0;i<childIndex+1;i++){
            if(i==0){
                memberExpression = t.memberExpression(parentNodeIdentifier, t.identifier("firstChild"));
            }else{
                memberExpression = t.memberExpression(memberExpression, t.identifier("nextSibling"));
            }
        }
        return memberExpression;
    }

    return {
        name: "jsx-plugin",
        visitor: {
            Program(path){
                let currentProgram = path.node;
                let templateCounter=0;
                let componentCounter=0;

                let componentJSXStatement = (componentName, attributes)=>{
                    componentCounter++;
                    return t.newExpression(
                        componentResultClass,
                        [
                            t.identifier(componentName),
                            t.objectExpression(
                                attributes.map(attribute=>{
                                    if(attribute.name.type!="JSXIdentifier"){
                                        throw "Attribute names must be fixed";
                                    }
                                    if(attribute.value.type=="StringLiteral"){
                                        return t.objectProperty(t.identifier(attribute.name.name), t.stringLiteral(attribute.value.value));
                                    }else if(attribute.value.type=="JSXExpressionContainer"){
                                        return t.objectProperty(t.identifier(attribute.name.name), attribute.value.expression);
                                    }else{
                                        throw "Attribute value must either be a string or a JSXExpressionContainer ie. {}";
                                    }
                                })
                            )
                        ]
                    );
                };
            
                function createTemplateFunction(jsxElement){ 
                    let templateChildIndex = 0;
                    let statements = [];

                    let nodeMap = {};
                    let getNodeKeyVariable = (nodeKey)=>{
                        let key = generate(nodeKey,{}, '').code;
                        if(!(key in nodeMap)){
                            nodeMap[key] = [t.identifier(`elm${Object.keys(nodeMap).length}`), nodeKey];
                        }
                        return t.memberExpression(t.memberExpression(templateState, t.identifier("nodes")), nodeMap[key][0]);
                    }

                    let anchorElementAdded = false;
                    let addAnchorElement = ()=>{
                        if(!anchorElementAdded){
                            anchorElementAdded = true;
                            statements.unshift(t.variableDeclaration("let", [t.variableDeclarator(anchor, t.nullLiteral())]))
                        }
                    }

                    function createHTMLString(jsxElement, nodeKey){
                        let statements = [];
                        let t = babel.types;
                        let openingElement = jsxElement.openingElement;
                        let tagName = openingElement.name.name;
                        let fixedAttributes = [];
                        for(let attribute of openingElement.attributes){
                            if(attribute.name.type!="JSXIdentifier"){
                                throw "Attribute names must be fixed";
                            }
                            if(attribute.value.type=="StringLiteral"){
                                fixedAttributes.push({name: attribute.name.name, value: attribute.value.value});
                            }else if(attribute.value.type=="JSXExpressionContainer"){
                                if(attribute.name.name=="ref"){
                                    statements.push(
                                        t.expressionStatement(
                                            t.assignmentExpression(
                                                "=",
                                                t.memberExpression(attribute.value.expression, t.identifier("element")),
                                                getNodeKeyVariable(nodeKey)
                                            )
                                        )
                                    )
                                }else if(["onClick", "onSubmit"].includes(attribute.name.name)){
                                    statements.push(
                                        t.expressionStatement(
                                            t.assignmentExpression(
                                                "=",
                                                t.memberExpression(
                                                    getNodeKeyVariable(nodeKey),
                                                    t.identifier(attribute.name.name.toLowerCase())
                                                ),
                                                attribute.value.expression
                                            )
                                        )
                                    );
                                }else{
                                    statements.push(
                                        t.expressionStatement(
                                            t.callExpression(
                                                t.memberExpression(
                                                    getNodeKeyVariable(nodeKey),
                                                    t.identifier("setAttribute")
                                                ),
                                                [t.stringLiteral(attribute.name.name), attribute.value.expression]
                                            )
                                        )
                                    );
                                }
                            }else{
                                throw "Attribute value must either be a string or a JSXExpressionContainer ie. {}";
                            }
                        }
                        let children = jsxElement.children.map((x)=>{
                            return x.type=="JSXText"?{...x, "value": x.extra.raw.replace(trimRegex, "")}:x
                        });
                        children = children.filter((x)=>x.type!="JSXText" || x.value!="");
                        let htmlStrings = [];

                        let childIndex = 0;
                        let localAnchorSet = false;
                        let currenAnchor;
                        if(htmlSingleTags.includes(tagName)){
                            let htmlString = `<${tagName}${fixedAttributes.map(x=>` ${x.name}="${x.value}"`).join('')}>`;
                            return {htmlString, statements};
                        }
                        for(let child of children){
                            if(child.type=="JSXText"){
                                htmlStrings.push(child.value);
                                localAnchorSet = false;
                                currenAnchor = getNodeKey(nodeKey, childIndex);
                                childIndex++;
                            }else if(child.type=="JSXElement"){
                                if(htmlTags.includes(child.openingElement.name.name)){
                                    const {htmlString: childhtmlString, statements: childStatements} = createHTMLString(child, getNodeKey(nodeKey, childIndex));
                                    childStatements.length>0?statements.push(...childStatements):{};
                                    htmlStrings.push(childhtmlString);
                                    localAnchorSet = false;
                                    currenAnchor = getNodeKey(nodeKey, childIndex);
                                    childIndex++;
                                }else{
                                    addAnchorElement();
                                    if(!localAnchorSet){
                                        localAnchorSet = true;
                                        if(childIndex==0){
                                            statements.push(t.expressionStatement(t.assignmentExpression("=", anchor, t.objectExpression([t.objectProperty(t.identifier("node"), t.nullLiteral())]))));
                                        }else{
                                            statements.push(t.expressionStatement(t.assignmentExpression("=", anchor, t.objectExpression([t.objectProperty(t.identifier("node"), getNodeKeyVariable(currenAnchor))]))));
                                        }
                                    }
                                    statements.push(nextNodeExpressionSetter(templateChildIndex, componentJSXStatement(child.openingElement.name.name, child.openingElement.attributes), getNodeKeyVariable(nodeKey), anchor));
                                    templateChildIndex++;
                                }
                            }else if(child.type=="JSXExpressionContainer"){
                                if(child.expression.type!="JSXEmptyExpression"){
                                    addAnchorElement();
                                    if(!localAnchorSet){
                                        localAnchorSet = true;
                                        if(childIndex==0){
                                            statements.push(t.expressionStatement(t.assignmentExpression("=", anchor, t.objectExpression([t.objectProperty(t.identifier("node"), t.nullLiteral())]))));
                                        }else{
                                            statements.push(t.expressionStatement(t.assignmentExpression("=", anchor, t.objectExpression([t.objectProperty(t.identifier("node"), getNodeKeyVariable(currenAnchor))]))));
                                        }
                                    }
                                    statements.push(nextNodeExpressionSetter(templateChildIndex, child.expression, getNodeKeyVariable(nodeKey), anchor));
                                    templateChildIndex++;
                                }
                            }else{
                                throw "Unknow type of child";
                            }
                        }
                        let htmlString = `<${tagName}${fixedAttributes.map(x=>` ${x.name}="${x.value}"`).join('')}>${htmlStrings.join('')}</${tagName}>`;
                        return {htmlString, statements};
                    }

                    const {htmlString, statements: childStatements} = createHTMLString(jsxElement, t.identifier("domElement"));
                    statements.push(...childStatements);
                    let templateIdentifier = t.identifier(`template_${templateCounter}`)
                    let nodesInitializerArrowFunction = t.arrowFunctionExpression(
                        [t.identifier("domElement")],
                        t.blockStatement([
                            t.returnStatement(
                                t.objectExpression(Object.keys(nodeMap).map((x)=>{
                                    return t.objectProperty(nodeMap[x][0], nodeMap[x][1])
                                }))
                            )
                        ], [], false)
                    );
                    let variableDeclarator = t.variableDeclarator(
                        templateIdentifier,
                        t.newExpression(
                            templateClass,
                            [t.stringLiteral(htmlString), nodesInitializerArrowFunction]
                        )
                    );
                    let variableDeclaration = t.variableDeclaration("const", [variableDeclarator]);
                    currentProgram.body.unshift(variableDeclaration);
                    let arrowFunction = t.arrowFunctionExpression([templateState, context], t.blockStatement(statements, []), false);

                    let object = t.newExpression(
                        templateResultClass,
                        [
                            templateIdentifier,
                            arrowFunction,
                        ]
                    );
                    templateCounter++;
                    return object;
                }

                path.traverse({
                    JSXElement(path) {
                        let replaceElement;
                        if(htmlTags.includes(path.node.openingElement.name.name)){
                            replaceElement = createTemplateFunction(path.node);
                        }else{
                            replaceElement = componentJSXStatement(path.node.openingElement.name.name, path.node.openingElement.attributes);
                        }
                        path.replaceWith(replaceElement, path.node);
                    },
                })

                /* Add template import statement if atleast one template was generated */
                let imports = [];
                if(templateCounter>0){
                    imports.push(...[
                        t.objectProperty(templateClass, templateClass, false, true),
                        t.objectProperty(templateResultClass, templateResultClass, false, true),
                    ])
                }

                if(componentCounter>0){
                    imports.push(t.objectProperty(componentResultClass, componentResultClass, false, true))
                }

                if(templateCounter>0 || componentCounter>0){
                    imports.push(t.objectProperty(compareAndCreate, compareAndCreate, false, true))
                    let templateImporter = t.variableDeclarator(
                        t.objectPattern(imports),
                        t.callExpression(
                            t.identifier("require"),
                            [t.stringLiteral("component")]
                        )
                    );
                    let templateImport = t.variableDeclaration("const", [templateImporter]);
                    
                    currentProgram.body.unshift(templateImport);
                }
            },
        },
    };
};