var React = require('react');
var AdminPanel = require("./adminpanel/component.jade");

module.exports = function(props){
    React.renderComponent(AdminPanel(props),document);
}