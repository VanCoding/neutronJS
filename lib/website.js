var browserify = require("browserify");
var stream = require("stream");
var path = require("path");
var fs = require("fs");
var j2r = require("jade2react");
var React = require("react");
var express = require("express");
var Router = require("./router.js");
var events = require("events");
var bodyParser = require("body-parser");
var async = require("async");
var AdminPanel = require("./adminpanel/component.jade");

function Website(opts){
    var self = new express.Router();
    self.opts = opts;
    self.db = opts.db;
    self.widgets = {};
    self.adminmodules = {};
    self.types = {};
    self.routes = [];

    if(!opts.url) opts.url = "/neutron/";

    for(var method in Website.prototype){
        self[method] = Website.prototype[method];
    }

    self.get(opts.url+"public/main.js",self.build.bind(self),function(req,res){
        res.writeHead(200,"OK",{"Content-Type":"text/javascript"});
        res.end(self.bundle);
    });
    self.get(opts.url+"public/admin.js",self.buildAdminPanel.bind(self),function(req,res){
        res.writeHead(200,"OK",{"Content-Type":"text/javascript"});
        res.end(self.adminBundle);
    });
    self.get(opts.url,function(req,res){
        var modules = {};
        for(var id in self.adminmodules){
            var module = self.adminmodules[id];
            modules[id] = {
                id:id,
                label:module.label||id,
                componentPath:module.componentPath,
                properties:module.properties
            };
        }
        var types = {};
        console.log("TYPES",self.types[id])
        for(var id in self.types){
            types[id] = {};

            if(self.types[id].viewComponentPath) types[id].viewComponentPath = self.types[id].viewComponentPath;
            if(self.types[id].editComponentPath) types[id].editComponentPath = self.types[id].editComponentPath;
            if(self.types[id].filterComponentPath) types[id].filterComponentPath = self.types[id].filterComponentPath;
        }
        var widgets = {};
        for(var id in self.widgets){
            widgets[id] = self.widgets[id].componentPath;
        }
        res.writeHead(200,"OK",{"Content-Type":"text/html"});
        res.end("<!doctype html>\r\n"+React.renderComponentToString(AdminPanel({
            neutronPath:self.opts.url,
            widgets:widgets,
            modules:modules,
            types:types
        })));
    });
    self.use(opts.url+"public/",express.static(path.resolve(__dirname,"../public")));
    self.addRoute(opts.url,{componentPath:require.resolve("./adminpanel/component.jade")});
    self.registerWidget(require("./widgets/text"));
    self.registerWidget(require("./widgets/area"));


    return self;
}

Website.prototype.build = function(req,res,next){
    if(this.bundle) return next();

    var self = this;
    var bundle = browserify();
    //collect components to require
    var components = {};
    for(var id in this.widgets){
        components[this.widgets[id].componentPath.replace(/\\/g,"/")] = true;
    }
    for(var i = 0; i < this.routes.length; i++){
        components[this.routes[i].widget.componentPath.replace(/\\/g,"/")] = true;
    }
    components = Object.keys(components);
    for(var i = 0; i < components.length; i++){
        bundle.require(components[i]);
    }

    var file = new stream.PassThrough();
    file.end("module.exports = require('./client.js');");
    bundle.require(file,{basedir:__dirname.replace(/\\/g,"/"),expose:"main"});
    bundle.transform(j2r,{global:true});
    bundle.bundle(function(err,bundle){
        if(err) throw err;
        self.bundle = bundle;
        next();
    });
}

Website.prototype.buildAdminPanel = function(req,res,next){
    if(this.adminBundle) return next();
    var self = this;
    var bundle = browserify();
    var components = {};
    for(var id in this.adminmodules){
        components[this.adminmodules[id].componentPath.replace(/\\/g,"/")] = true;
    }
    for(var id in this.types){
        var type = this.types[id];
        if(type.viewComponentPath) components[type.viewComponentPath.replace(/\\/g,"/")] = true;
        if(type.editComponentPath) components[type.editComponentPath.replace(/\\/g,"/")] = true;
        if(type.filterComponentPath) components[type.filterComponentPath.replace(/\\/g,"/")] = true;
    }
    for(var id in this.widgets){
        components[this.widgets[id].componentPath.replace(/\\/g,"/")] = true;
    }
    components = Object.keys(components);
    for(var i = 0; i < components.length; i++){
        bundle.require(components[i]);
    }
    var file = new stream.PassThrough();
    file.end("module.exports = require('./admin.js');");
    bundle.require(file,{basedir:__dirname.replace(/\\/g,"/"),expose:"main"});
    bundle.transform(j2r,{global:true});
    bundle.bundle(function(err,bundle){
        if(err) throw err;
        self.adminBundle = bundle;
        next();
    });
}


Website.prototype.registerWidget = function(widget){
    this.widgets[widget.id] = widget;
    widget.componentPath = widget.componentPath.replace(/\\/g,"/");
}

Website.prototype.addRoute = function(path,widget,opts){
    var self = this;
    if(typeof widget == "string"){
        widget = this.widgets[widget]
    }else if(widget instanceof Function){
        widget = new widget(opts);
    }

    this.routes.push({path:path,widget:widget});
    this.get(path,function(req,res){
        var data = {params:req.params};
        if(widget.load){
            widget.load(self,data,function(err){
                serve();
            });
        }else{
            serve();
        }
        function serve(){
            if(req.headers["data-only"] == "True"){
                res.writeHead(200,"OK",{"Content-Type":"applicaiton/json"});
                res.end(JSON.stringify(data));
            }else{
                var widgets = {};
                for(var id in self.widgets){
                    widgets[id] = self.widgets[id].componentPath;
                }
                var routes = [];
                for(var i = 0; i < self.routes.length; i++){
                    var route = self.routes[i];
                    routes.push({path:route.path,component:route.widget.componentPath.replace(/\\/g,"/"),dynamic:route.widget.load?true:false});
                }
                res.writeHead(200,"OK",{"Content-Type":"text/html"});
                res.end("<!doctype html>\r\n"+React.renderComponentToString(Router({
                    mayEdit:true,
                    edit:false,
                    path:req.path,
                    neutronPath:self.opts.url,
                    routes:routes,
                    widgets:widgets,
                    data:data
                })));
            }
        }
    });
    this.post(path,bodyParser.json({limit:"100mb"}),function(req,res){
        if(widget.save){
            widget.save(self,req.body,function(err){
                res.end();
            })
        }else{
            res.end();
        }
    });
}

Website.prototype.registerAdminModule = function(module){
    this.adminmodules[module.id] = module;
    module.componentPath = module.componentPath.replace(/\\/g,"/");
    if(module.init){
        var router = new express.Router();
        module.init(this,router);
        this.use(this.opts.url+module.id+"/",router);
    }
}

Website.prototype.ensureType = function(type){
    if(this.types[type.id]) return;
    this.types[type.id] = type;
    if(type.viewComponentPath) type.viewComponentPath = type.viewComponentPath.replace(/\\/g,"/");
    if(type.editComponentPath) type.editComponentPath = type.editComponentPath.replace(/\\/g,"/");
    if(type.filterComponentPath) type.filterComponentPath = type.filterComponentPath.replace(/\\/g,"/");
}

Website.prototype.loadWidgets = function(widgets,cb){
    var self = this;
    async.each(widgets,function(widget,cb){
        self.widgets[widget.type].load(self,widget,cb);
    },cb)
}
Website.prototype.saveWidgets = function(widgets,cb){
    var self = this;
    async.each(widgets,function(widget,cb){
        self.widgets[widget.type].save(self,widget,cb);
    },cb)
}

Website.prototype.emit = function(event){
    console.log("emitting",event,Array.prototype.slice.call(arguments,1));
}

module.exports = Website;
