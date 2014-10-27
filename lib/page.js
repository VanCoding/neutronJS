var express = require("express");

module.exports = function Page(proto){
    function Page(data){
        var self = new express.Router();
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
                    id:self.id,
                    path:self.website.path
                }

                var component = base(data);
                component._store.pages = this.pages;
                res.writeHead(200,"OK",{"Content-Type":"text/html"});
                res.end(React.renderComponentToString(component));
            });
        });

        console.log("PATH",self.componentPath)
        return self;
    }
    Page.__proto__ = proto||{};
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
    },
    __proto__:express.Router
};
