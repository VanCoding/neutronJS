var React = require("react");
var pathRegexp = require('path-to-regexp');

module.exports = React.createClass({
    getInitialState:function(){
        for(var i = 0; i < this.props.routes.length; i++){
            var route = this.props.routes[i];
            if(typeof route.path == "string") route.path = pathRegexp(route.path);
        }
        this.route(this.props.path);
        return {};
    },
    componentDidMount:function(){
        window.addEventListener("click",this.onClick);
    },
    componentWillUnmount:function(){
        window.removeEventListener("click",this.onClick);
    },
    render:function(){
        return this.props.view.spec.render.call(this);
    },
    onClick:function(e){
        e.preventDefault();
        if(e.target.tagName == "A"){
            if(e.target.host == location.host){
                if(this.route(e.target.pathname)){
                    e.preventDefault();
                    history.pushState(null,null,e.target.href);
                    var self = this;
                    var req = new XMLHttpRequest();
                    req.open("GET",location.href);
                    req.setRequestHeader("Accept","application/json");
                    req.onreadystatechange = function(){
                        if(req.readyState == 4){
                            self.props.data = JSON.parse(req.responseText);
                            self.forceUpdate();
                        }
                    }
                    req.send();
                    console.log("preventing...");
                }
            }
        }
        
    },
    route:function(path){
        for(var i = 0; i < this.props.routes.length; i++){
            var route = this.props.routes[i];
            if(route.path.test(path)){
                this.props.view = route.view;
                return true;
            }
        }
    }
});