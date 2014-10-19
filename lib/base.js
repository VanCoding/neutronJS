var React = require("react");
module.exports = React.createClass({
    render:function(){
        return (this._descriptor._store.pages||pages)[this.props.page.name](this.props)
    }
});
