var express = require("express");

module.exports = function Page(proto){
    function Page(data){
        var self = function(req,res,next){
            self.handle(req,res,next);
        }
        for(var property in data){
            self[property] = data[property];
        }
        self.__proto__ = proto||{};
        self.__proto__.__proto__ = prototype;
        self.init();
        self.component = require(self.componentPath);

        self.get("/",function(req,res){
            self.getData(function(err,data){
                data.page = {
                    canEdit:true,
                    name:self.name,
                    path:self.website.path
                }

                var component = base(data);
                component._store.pages = this.pages;
                res.writeHead(200,"OK",{"Content-Type":"text/html"});
                res.end(React.renderComponentToString(component));
            });
        });
    }
    return Page;
}

var prototype = {
    getData:function(cb){
        cb(null);
    },
    setData:function(data,cb){
        cb(null);
    },
    init:function(){
    }
    __proto__:express.Router
};
