module.exports = function (babel) {
    let t = babel.types;

    let createClass = t.identifier("createClass");
    let createTemplate = t.identifier("createTemplate");

    return {
        name: "jsx-plugin",
        visitor: {
            Program(path){
                let addImport = false;
                let fileName = this.file.opts.filename;
                path.traverse({
                    ClassDeclaration(path) {
                        let newClassName = t.identifier(`_${path.node.id.name}`);
                        let oldClassName = path.node.id.name;
                        addImport=true;
                        path.node.id = newClassName;
                        path.insertAfter(
                            t.variableDeclaration("let", [t.variableDeclarator(
                                t.identifier(oldClassName),
                                t.callExpression(
                                    createClass,
                                    [t.StringLiteral(oldClassName), t.StringLiteral(fileName), newClassName],
                                )
                            )])
                        );
                    },
                    VariableDeclarator(path){
                        if(path.node.init!=null && path.node.init.type=='NewExpression' && path.node.init.callee.type=='Identifier' && path.node.init.callee.name=='Template'){
                            let newNode = t.variableDeclarator(
                                path.node.id,
                                t.callExpression(
                                    createTemplate,
                                    [t.StringLiteral(path.node.id.name), t.StringLiteral(fileName), path.node.init],
                                )
                            )
                            path.replaceWith(newNode, path.node);
                            addImport=true;
                        }
                    }
                });
                if(addImport){
                    let createClassImporter = t.variableDeclarator(
                        t.objectPattern([
                            t.objectProperty(createClass, createClass, false, true),
                            t.objectProperty(createTemplate, createTemplate, false, true),
                        ]),
                        t.callExpression(
                            t.identifier("require"),
                            [t.stringLiteral("component/registry")]
                        )
                    );
                    let registryImport = t.variableDeclaration("const", [createClassImporter]);
                    
                    path.node.body.unshift(registryImport);
                }
            },
        },
    };
};