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

function Website(opts){
    var self = new express.Router();
    self.opts = opts;
    self.db = opts.db;
    self.widgets = {};
    self.adminmodules = {};
    self.needsRebuild = true;
    self.routes = [];

    if(!opts.url) opts.url = "/neutron/";

    for(var method in Website.prototype){
        self[method] = Website.prototype[method];
    }

    self.use(self.rebuild.bind(self));

    self.get(opts.url+"public/main.js",function(req,res){
        res.writeHead(200,"OK",{"Content-Type":"text/javascript"});
        res.end(self.bundle);
    });
    self.use(opts.url+"public/",express.static(path.resolve(__dirname,"../public")));
    
    //self.registerView("neutronAdmin",require.resolve("./adminpanel/component.jade"));
    //self.addRoute(opts.url,"neutronAdmin");
    self.registerWidget(require("./widgets/text"));
    self.registerWidget(require("./widgets/area"));
    

    return self;
}

Website.prototype.rebuild = function(req,res,next){
    if(!this.needsRebuild) return next();

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
        self.needsRebuild = false;
        self.bundle = bundle;
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
        var data = {};
        if(widget.load){
            widget.load(self,data,function(err){
                serve();
            });
        }else{
            serve();
        }
        function serve(){            
            data.mayEdit = true;
            data.edit = false;            
            if(req.headers.accept == "application/json"){
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
                /*
                var modules = {};            
                for(var id in self.adminmodules){
                    modules[id] = self.adminmodules[id].view;
                }*/
                
                res.writeHead(200,"OK",{"Content-Type":"text/html"});
                res.end("<!doctype html>\r\n"+React.renderComponentToString(Router({
                    data:{
                        path:req.path,
                        neutronPath:self.opts.url,
                        routes:routes,
                        widgets:widgets,
                        //modules:modules,
                        data:data
                    }
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
    module.viewpath = module.viewpath.replace(/\\/g,"/");
    module.view = require(module.viewpath);
    this.adminmodules[module.id] = module;
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

Website.prototype.emit = function(){}

module.exports = Website;
