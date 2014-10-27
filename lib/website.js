var browserify = require("browserify");
var stream = require("stream");
var path = require("path");
var fs = require("fs");
var j2r = require("jade2react");
var React = require("react");
var express = require("express");
var base = require("./base.js");
var events = require("events");

function Website(url){
    var self = new express.Router();
    self.pages = {};
    self.coponents = {};
    self.needsRebuild = true;

    for(var method in Website.prototype){
        self[method] = Website.prototype[method];
    }

    self.use(function(req,res,next){
        console.log("called",req.path);
        console.log(url+"public/main.js");
        next();
    })

    self.use(self.rebuild.bind(self));

    self.get(url+"public/main.js",function(req,res){
        res.writeHead(200,"OK",{"Content-Type":"text/javascript"});
        res.end(self.bundle);
    });
    self.use(url+"public/",express.static(path.resolve(__dirname,"../public")));

    return self;
}

Website.prototype.registerPage = function(page){
    console.log("PAGE",page.id);
    this.pages[page.id] = page;
    this.needsRebuild = true;
}

Website.prototype.registerPages = function(){
    for(var i = 0; i < arguments.length; i++){
        this.registerPage(arguments[i]);
    }
}

Website.prototype.registerComponent = function(component){
    this.components[component.id] = component;
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

    var bundle = browserify();
    var file = new stream.PassThrough();
    file.write("React = require('react');\r\nbase = require('./base.js');\r\npages = {");

    var first = true;
    for(var page in this.pages){
        console.log(this.pages[page]);
        file.write("\t"+page+":require('"+this.pages[page].componentPath.replace(/\\/g,"/")+"')");
        if(first){
            first = false;
        }else{
            file.write(",");
        }
        file.write("\r\n");
    }
    file.write("};\r\n");
    file.end();

    bundle.add(file,{basedir:__dirname.replace(/\\/g,"/")});
    bundle.transform(j2r,{global:true});
    bundle.bundle(function(err,bundle){
        if(err) throw err;
        self.needsRebuild = false;
        self.bundle = bundle;
        next();
    });
}

Website.prototype.set = function(path,id,data){
    console.log("PAGE",this.pages[id]);
    var page = new (this.pages[id])(data);
    page.website = this;
    this.use(path,page);
}

Website.prototype.emit = function(){}

module.exports = Website;
