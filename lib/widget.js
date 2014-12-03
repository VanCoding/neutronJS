var React = require("react");

module.exports = React.createClass({
    render:function(){
        var root = this.props.page||this._owner.props;
        var props = {};
        for(var key in root) props[key] = root[key];
        for(var key in this.props) props[key] = this.props[key];
        return require(props.widgets[props.data.type])(props);
    }
});