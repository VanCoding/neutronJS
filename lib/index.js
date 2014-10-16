require("jade2react");

exports.Website = require("./website.js");

exports.components = {
    AdminPanel:require("./adminpanel/component.jade"),
    Component:require("./component/component.jade"),
    FileManager:require("./filemanager/component.jade"),
    Modal:require("./modal/component.jade")
};

exports.middleware = {
    FileManager:require("./filemanager/middleware.js")
};
