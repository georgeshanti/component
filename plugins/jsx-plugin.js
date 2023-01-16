const trimRegex = /(^\s*)|(\s*$)/;
const htmlTags = ["div", "span", "img"];

module.exports = function (babel) {
    let t = babel.types;

    /* Declare common identifiers to be used */
    let template = t.identifier("template");
    let getElement = t.identifier("getElement");
    let compareAndCreate = t.identifier("compareAndCreate");

    let parent = t.identifier("parent");
    let nextNode = t.identifier("nextNode");
    let newNextNode = t.identifier("newNextNode");
    let elementState = t.identifier("elementState");
    let templateState = t.identifier("templateState");

    /* Declare reused statements */

    let componentJSXStatement = (componentName, attributes)=>t.objectExpression([
        t.objectProperty(t.identifier("type"), t.stringLiteral("component")),
        t.objectProperty(t.identifier("component"), t.identifier(componentName)),
        t.objectProperty(t.identifier("props"), t.objectExpression(
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
        ),
    ])

    let nextNodeInitializer = t.variableDeclaration(
        "let",
        [t.variableDeclarator(
            nextNode,
            t.nullLiteral(),
        )]
    );

    let nextNodeElementSetter = t.expressionStatement(
        t.assignmentExpression(
            "=",
            nextNode,
            t.callExpression(
                getElement,
                [parent, nextNode]
            )
        )
    );
    
    let nextNodeChildFunction = (statements)=>t.expressionStatement(
        t.callExpression(
            t.arrowFunctionExpression(
                [parent],
                t.blockStatement(statements, []),
                false
            ),
            [nextNode]
        )
    );
    
    let nextNodeExpressionSetter = (childIndex, expression)=>t.blockStatement([
        t.variableDeclaration(
            "const",
            [
                t.variableDeclarator(
                    t.objectPattern([
                        t.objectProperty(nextNode, newNextNode),
                        t.objectProperty(elementState, elementState),
                    ]),
                    t.callExpression(
                        compareAndCreate,
                        [
                            t.memberExpression(t.memberExpression(templateState, t.identifier("children")), t.numericLiteral(childIndex), true),
                            expression,
                            parent,
                            nextNode,
                        ]
                    )
                )
            ]
        ),
        t.expressionStatement(
            t.assignmentExpression(
                "=",
                t.memberExpression(t.memberExpression(templateState, t.identifier("children")), t.numericLiteral(childIndex), true),
                elementState
            ),
        ),
        t.expressionStatement(
            t.assignmentExpression(
                "=",
                nextNode,
                newNextNode,
            ),
        ),
    ], []);

    return {
        name: "jsx-plugin",
        visitor: {
            Program(path){
                let currentProgram = path.node;
                let templateCounter=0;
            
                function createTemplateFunction(jsxElement){ 
                    let templateChildIndex = 0;
                    function createHTMLString(jsxElement){
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
                                if(attribute.name.name=="onClick"){
                                    statements.push(
                                        t.expressionStatement(
                                            t.assignmentExpression(
                                                "=",
                                                t.memberExpression(
                                                    parent,
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
                                                    parent,
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
                        let children = jsxElement.children.map((x)=>x.type=="JSXText"?{...x, "value": x.value.replace(trimRegex, "")}:x);
                        children = children.filter((x)=>x.type!="JSXText" || x.value!="");
                        let htmlStrings = [];
    
                        let nextNodeInitializerAdded=false;
                        let addNextNodeInitializer = ()=>{
                            if(!nextNodeInitializerAdded) statements.push(nextNodeInitializer);
                            nextNodeInitializerAdded=true;
                        }
                        for(let child of children){
                            addNextNodeInitializer();
                            if(child.type=="JSXText"){
                                htmlStrings.push(child.value);
                                statements.push(nextNodeElementSetter);
                                console.log("found text element", JSON.stringify(child.value))
                            }else if(child.type=="JSXElement"){
                                if(htmlTags.includes(child.openingElement.name.name)){
                                    const {htmlString: childhtmlString, statements: childStatements} = createHTMLString(child);
                                    statements.push(nextNodeElementSetter);
                                    childStatements.length>0?statements.push(nextNodeChildFunction(childStatements)):{};
                                    htmlStrings.push(childhtmlString);
                                }else{
                                    statements.push(nextNodeExpressionSetter(templateChildIndex, componentJSXStatement(child.openingElement.name.name, child.openingElement.attributes)));
                                    templateChildIndex++;
                                }
                            }else if(child.type=="JSXExpressionContainer"){
                                statements.push(nextNodeExpressionSetter(templateChildIndex, child.expression));
                                templateChildIndex++;
                            }
                        }
                        let htmlString = `<${tagName}${fixedAttributes.map(x=>` ${x.name}="${x.value}"`).join('')}>${htmlStrings.join('')}</${tagName}>`;
                        return {htmlString, statements};
                    }

                    const {htmlString, statements: childStatements} = createHTMLString(jsxElement, 0);
                    let statements = [];
                    if(childStatements.length>0){
                        statements.push(
                            t.variableDeclaration("let", [
                                t.variableDeclarator(
                                    nextNode,
                                    t.memberExpression(templateState, t.identifier("domElement"))
                                )
                            ])
                        );
                        statements.push(nextNodeChildFunction(childStatements));
                    }
                    let templateIdentifier = t.identifier(`template_${templateCounter}`)
                    let variableDeclarator = t.variableDeclarator(
                        templateIdentifier,
                        t.callExpression(
                            template,
                            [t.stringLiteral(htmlString)]
                        )
                    );
                    let variableDeclaration = t.variableDeclaration("const", [variableDeclarator]);
                    currentProgram.body.unshift(variableDeclaration);
                    let arrowFunction = t.arrowFunctionExpression([templateState], t.blockStatement(statements, []), false);

                    let object = t.objectExpression([
                        t.objectProperty(t.identifier("type"), t.stringLiteral("template")),
                        t.objectProperty(template, templateIdentifier),
                        t.objectProperty(t.identifier("templateFunction"), arrowFunction),
                        t.objectProperty(t.identifier("templateName"), t.stringLiteral(`template_${templateCounter}`)),
                    ])
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
                if(templateCounter>0){
                    let templateImporter = t.variableDeclarator(
                        t.objectPattern([
                            t.objectProperty(template, template, false, true),
                            t.objectProperty(getElement, getElement, false, true),
                            t.objectProperty(compareAndCreate, compareAndCreate, false, true),
                        ]),
                        t.callExpression(
                            t.identifier("require"),
                            [t.stringLiteral("template")]
                        )
                    );
                    let templateImport = t.variableDeclaration("const", [templateImporter]);
                    
                    currentProgram.body.unshift(templateImport);
                }
            },
        },
    };
};

function removeFromObject(object){
    if(Array.isArray(object)){
        return object.map(x=>removeFromObject(x));
    }
    else if(typeof object === "object"){
        let newObject = {};
        for(key in (object)){
            if(key=="start" || key=="end" || key=="loc" || key=="__clone" || key=="extra"){
                
            }else{
                newObject[key] = removeFromObject(object[key])
            }
        }
        return newObject;
    }else if(typeof object === "function"){
        return null;
    }else{
        return object;
    }
}