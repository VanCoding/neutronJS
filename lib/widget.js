var React = require("react");

module.exports = React.createClass({
    render:function(){
        var page = this.props.page||this._owner.props.page;
        var data = this.props.data;
        return require(page.widgets[data.type])({data:data,page:page});
    }
});