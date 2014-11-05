var React = require("react");
var pathRegexp = require('path-to-regexp');


function swap(self){
    this.__proto__ = new (this.props.view)(this.props).type.prototype
}

var Page = React.createClass({
    getInitialState:function(){
        this.componentWillReceiveProps = this.componentWillReceiveProps;
        this.componentWillUpdate = this.componentWillUpdate;
        this.componentDidUpdate = this.componentDidUpdate;
        swap.call(this);
        return this.__proto__.getInitialState?this.__proto__.getInitialState():{};
    },    
    componentWillReceiveProps:function(props){
        if(this.componentWillUnmount) this.componentWillUnmount();
        this.props = props;
        this.fakeMountEvents = true;
        swap.call(this);
        this.state = this.getInitialState?this.getInitialState():{};
    },
    componentWillUpdate:function(){
        if(this.fakeMountEvents){
            if(this.componentWillMount) this.componentWillMount();
        }else{
            if(this.__proto__.componentWillUpdate) this.__proto__.componentWillUpdate.call(this);
        }
    },
    componentDidUpdate:function(){
        if(this.fakeMountEvents){
            if(this.componentDidMount) this.componentDidMount();
            this.fakeMountEvents = false;
        }else{
            if(this.__proto__.componentDidUpdate) this.__proto__.componentDidUpdate.call(this);
        }
    },
    render:function(){}
});

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
        var self = this;
        window.addEventListener("click",this.onClick);
        window.addEventListener("popstate",function(){
            self.route(location.pathname);
            self.forceUpdate();
        })
    },
    componentWillUnmount:function(){
        window.removeEventListener("click",this.onClick);
    },
    render:function(){
        return Page({view:this.props.view})
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