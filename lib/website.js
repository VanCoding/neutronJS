var browserify = require("browserify");
var stream = require("stream");
var path = require("path");
var fs = require("fs");
var j2r = require("jade2react");
var React = require("react");
var express = require("express");
var base = require("./base.js");

function Website(url){
    var self = new express.Router();
    self.pages = {};
    self.coponents = {};
    self.needsRebuild = true;
    self.use(self.rebuild.bind(self));
    self.get(url+"public/main.js",function(req,res){
        res.writeHead(200,"OK",{"Content-Type":"text/javascript"});
        res.end(self.bundle);
    });
    self.use(url+"public/",express.static(path.resolve(__dirname,"../public")));
}

Website.prototype.registerPage = function(page){
    this.pages[page.name] = page;
    this.needsRebuild = true;
}

Website.prototype.registerPages = function(){
    for(var i = 0; i < arguments.length; i++){
        this.registerPage(arguments[i]);
    }
}

Website.prototype.registerComponent = function(component){
    this.components[component.name] = component;
    this.needsRebuild = true;
}

Website.prototype.registerComponents = function(){
    for(var i = 0; i < arguments.length; i++){
        this.registerComponents(arguments[i]);
    }
}

Website.prototype.rebuild = function(req,res,next){
    if(!this.needsRebuild) return next();

    var self = this;

    var bundle = browserify({basedir:__dirname});
    var file = new stream.PassThrough();
    file.write("React = require('react');\r\nbase = require('./base.js');\r\npages = {");

    var first = true;
    for(var page in this.pages){
        file.write("\t"+page+":require('"+pages[page].componentPath+"')");
        if(first){
            first = false;
        }else{
            file.write(",");
        }
        file.write("\r\n");
    }
    file.write("};\r\n");
    file.end();

    bundle.add(file);
    bundle.transform(j2r,{global:true});
    bundle.bundle(function(err,bundle){
        self.bundle = bundle;
        next();
    });
}

Website.prototype.set = function(path,name,data){
    var page = new this.pages[name](data);
    page.website = this;
    this.use(path,page);
}

module.exports = Website;
