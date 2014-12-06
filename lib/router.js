var React = require("react");
var pathRegexp = require('path-to-regexp');


function swap(self){
    this.__proto__ = new (this.props.component)(this.props).type.prototype
}

var Page = React.createClass({
    getInitialState:function(){
        this.componentWillReceiveProps = this.componentWillReceiveProps;
        this.componentWillUpdate = this.componentWillUpdate;
        this.componentDidUpdate = this.componentDidUpdate;
        swap.call(this);

        return this.__proto__.getInitialState?this.__proto__.getInitialState.call(this):{};
    },
    componentWillReceiveProps:function(props){
        if(this.componentWillUnmount) this.componentWillUnmount();
        this.props = props;
        this.fakeMountEvents = true;
        swap.call(this);
        this.state = this.__proto__.getInitialState?this.__proto__.getInitialState.call(this):{};
        setTimeout(function(){
            window.scrollTo(0,0)
        },1);
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
        var state = this.props;
        for(var i = 0; i < state.routes.length; i++){
            var route = state.routes[i];
            route.regexp = pathRegexp(route.path);
        }
        state.toggleEdit = this.toggleEdit;

        this.route(state.path,state);
        return state;
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
        return Page(this.state)
    },
    onClick:function(e){
        if(e.target.tagName == "A"){
            if(e.target.host == location.host){
                if(location.pathname == e.target.pathname){
                }else if(this.route(e.target.pathname,this.state)){
                    history.pushState(null,null,e.target.href);
                }else{
                    return;
                }
                this.state.edit = false;

                e.preventDefault();

                if(this.state.dynamic){
                    var self = this;
                    var req = new XMLHttpRequest();
                    req.open("GET",location.href);
                    req.setRequestHeader("Data-Only","True");
                    req.onreadystatechange = function(){
                        if(req.readyState == 4){
                            self.state.data = JSON.parse(req.responseText);
                            self.forceUpdate();
                        }
                    }
                    req.send();
                }else{
                    this.forceUpdate();
                }
            }
        }

    },
    route:function(path,state){
        for(var i = 0; i < state.routes.length; i++){
            var route = state.routes[i];
            if(route.regexp.test(path)){
                state.component = require(route.component);
                state.path = path;
                state.dynamic = route.dynamic;
                return true;
            }
        }
    },
    toggleEdit:function(){
        var self = this;
        if(this.state.edit){
            this.state.edit = false;
            var req = new XMLHttpRequest();
            req.open("POST",location.href);
            req.setRequestHeader("Content-Type","application/json");
            req.onreadystatechange = function(){
                if(req.readyState == 4){
                    self.forceUpdate();
                }
            }
            req.send(JSON.stringify(this.state.data));
        }else{
            this.state.edit = true;
            this.forceUpdate();
        }
    }
});
