var React = require('react');
var Router = require('./router.js');

module.exports = function(data){
    React.renderComponent(Router({data:data}),document);
}