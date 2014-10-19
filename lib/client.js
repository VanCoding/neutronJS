function Client(){
    this.pages = [];
}

Client.prototype.addPage = function(page){
    this.pages = p;
}

module.exports = new Client();

module.exports.components = {
    AdminPanel:require("./adminpanel/component.jade"),
    Component:require("./component/component.jade"),
    FileManager:require("./filemanager/component.jade"),
    Modal:require("./modal/component.jade")
};
