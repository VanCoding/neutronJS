var React = require("react");
module.exports = React.createClass({
    render:function(){
        return (this._descriptor._store.pages||pages)[this.props.page.name](this.props)
    }
});

/*var routes = {
	"http://localhost:8080/": function(){
		console.log("rendering home");
	},
	"http://localhost:8080/subpage":function(){
		console.log("rendering subpage");
	}
};


window.onclick = function(e){
	if(e.target.tagName == "A"){
		if(routes[e.target.href]){
			routes[e.target.href]();
			history.pushState(null,null,e.target.href);
			e.preventDefault();
			return false;
		}
	}

}*/
