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
    
    self.registerView("neutronAdmin",require.resolve("./adminpanel/component.jade"));
    self.addRoute(opts.url,"neutronAdmin");
    self.registerWidget(require("./components/text"));
    

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
        file.write("\t\t\t{path:'"+this.routes[i].path+"',view:require('"+this.routes[i].view.path+"'),dynamic:"+(this.routes[i].ctx.getData?true:false)+"}"+(i < this.routes.length-1?",":"")+"\r\n");
    }
    file.write("\t\t],\r\n");
    file.write("\t\twidgets:{\r\n");
    for(var id in this.widgets){
        file.write("\t\t\t"+id+":require('"+this.widgets[id].viewpath+"')"+(Object.keys(this.widgets)[Object.keys(this.widgets).length-1] != id?",":"")+"\r\n");
    }
    file.write("\t\t},\r\n");
    file.write("\t\tmodules:{\r\n");
    for(var id in this.adminmodules){
        file.write("\t\t\t"+id+":require('"+this.adminmodules[id].viewpath+"')"+(Object.keys(this.adminmodules)[Object.keys(this.adminmodules).length-1] != id?",":"")+"\r\n");
    }
    file.write("\t\t},\r\n");
    file.write("\t\tneutronPath:'"+this.opts.url+"',\r\n")
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

Website.prototype.registerView = function(id,viewpath){
    viewpath = viewpath.replace(/\\/g,"/");
    var view = require(viewpath);
    view.path = viewpath;
    view.id = id;
    this.views[id] = view;
}

Website.prototype.registerViews = function(views){
    for(var id in views){
        this.registerView(id,views[id]);
    }
}

Website.prototype.registerViewsInDirectory = function(dirpath){
    var files = fs.readdirSync(dirpath.replace(/\\/g,"/"));
    for(var i = 0; i < files.length; i++){
        this.registerView(files[i].split(".")[0],path.resolve(dirpath,files[i]));
    }
}


Website.prototype.registerWidget = function(widget){
    this.widgets[widget.id] = widget;
    widget.viewpath = widget.viewpath.replace(/\\/g,"/");
    widget.view = require(widget.viewpath);
}

Website.prototype.addRoute = function(path,view,ctx){
    var self = this;
    var view = this.views[view];

    if(!ctx) ctx = {};
    ctx.website = this;
    if(ctx.handler){
        ctx.__proto__ = ctx.handler;
    }

    this.routes.push({path:path,view:view,ctx:ctx});
    this.get(path,function(req,res){
        if(ctx.getData){
            ctx.getData(req,function(err,data){
                serve(data||{});
            });
        }else{
            serve({});
        }
        function serve(data){
            var modules = {};            
            for(var id in self.adminmodules){
                modules[id] = self.adminmodules[id].view;
            }
            var widgets = {};
            for(var id in self.widgets){
                widgets[id] = self.widgets[id].view;
            }
            
            data.mayEdit = true;
            data.edit = true;
            
            if(req.headers.accept == "application/json"){
                res.writeHead(200,"OK",{"Content-Type":"applicaiton/json"});
                res.end(JSON.stringify(data));
            }else{
                res.writeHead(200,"OK",{"Content-Type":"text/html"});
                res.end("<!doctype html>\r\n"+React.renderComponentToString(Router({
                    path:req.path,
                    neutronPath:self.opts.url,
                    routes:self.routes,
                    widgets:widgets,
                    modules:modules,
                    data:data
                })));
            }
        }
    });
}

Website.prototype.registerAdminModule = function(module){    
    module.viewpath = module.viewpath.replace(/\\/g,"/");
    module.view = require(module.viewpath);
    this.adminmodules[module.id] = module;
}


Website.prototype.emit = function(){}

module.exports = Website;
