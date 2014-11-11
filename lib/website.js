var browserify = require("browserify");
var stream = require("stream");
var path = require("path");
var fs = require("fs");
var j2r = require("jade2react");
var React = require("react");
var express = require("express");
var Router = require("./router.js");
var events = require("events");

function Website(opts){
    var self = new express.Router();
    self.opts = opts;
    self.views = {};
    self.coponents = {};
    self.needsRebuild = true;
    self.routes = [];

    if(!opts.url) opts.url = "/neutron/";

    for(var method in Website.prototype){
        self[method] = Website.prototype[method];
    }

    self.use(self.rebuild.bind(self));

    self.get("/public/main.js",function(req,res){
        res.writeHead(200,"OK",{"Content-Type":"text/javascript"});
        res.end(self.bundle);
    });
    self.use(opts.url+"public/",express.static(path.resolve(__dirname,"../public")));

    return self;
}

Website.prototype.rebuild = function(req,res,next){
    if(!this.needsRebuild) return next();

    var self = this;

    var bundle = browserify();
    var file = new stream.PassThrough();
    file.write("var React = require('react');\r\n");
    file.write("var Router = require('./router.js');\r\n");
    file.write("module.exports = function(path,data){\r\n");
    file.write("\tReact.renderComponent(Router({\r\n");
    file.write("\t\tpath:path,\r\n");
    file.write("\t\troutes:[\r\n");
    for(var i = 0; i < this.routes.length; i++){
        file.write("\t\t\t{path:'"+this.routes[i].path+"',view:require('"+this.routes[i].view.path+"')}"+(i < this.routes.length-1?",":"")+"\r\n");
    }
    file.write("\t\t],\r\n");
    file.write("\t\tdata:data\r\n");
    file.write("\t}),document);\r\n");
    file.end("}");
    bundle.require(file,{basedir:__dirname.replace(/\\/g,"/"),expose:"main"});
    bundle.transform(j2r,{global:true});
    bundle.bundle(function(err,bundle){
        if(err) throw err;
        self.needsRebuild = false;
        self.bundle = bundle;
        next();
    });
}

Website.prototype.registerView = function(id,path){
    path = path.replace(/\\/g,"/");
    var view = require(path);
    view.handler = require(require("path").resolve(require("path").basename(path),view.handler).replace(/\\/g,"/"));
    view.path = path;
    view.id = id;
    this.views[id] = view;
}

Website.prototype.registerViews = function(views){
    for(var id in views){
        this.registerView(id,views[id]);
    }
}

Website.prototype.addRoute = function(path,view,context){
    var self = this;
    var view = this.views[view];
    context.__proto__ = view.handler;
    this.routes.push({path:path,view:view,context:context});
    this.get(path,function(req,res){
        context.getData(req,function(err,data){
            if(req.headers.accept == "application/json"){
                res.writeHead(200,"OK",{"Content-Type":"applicaiton/json"});
                res.end(JSON.stringify(data));
            }else{
                res.writeHead(200,"OK",{"Content-Type":"text/html"});
                res.end("<!doctype html>\r\n"+React.renderComponentToString(Router({
                    path:req.path,
                    routes:self.routes,
                    data:data
                })));
            }
        });
    });
}

Website.prototype.emit = function(){}

module.exports = Website;
