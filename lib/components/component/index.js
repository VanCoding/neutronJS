var React = require("react");

function ensureDeepValue(obj,path,init){
    for (var i=0, path=path.split('.'); i<path.length-1; i++){
        if(obj.hasOwnProperty(path[i])){
            obj = obj[path[i]];
        }else{
            obj = obj[path[i]] = {};
        }
    };
    if(obj.hasOwnProperty(path[i])){
        return obj[path[i]];
    }
    return obj[path[i]] = init();
}

module.exports = React.createClass({
    render:function(){
        var page = this.props.page||this._owner.props.page;
        var data = ensureDeepValue(this._owner,this.props.key,page.widgets[this.props.type].getInitialData);
        return page.widgets[data.type]({data:data,page:page});
    }
});