![NeutronJS](neutron.fw.png "NeutronJS")

A react.js-based CMS for node.js

features
--------
- client & serverside rendering & routing of fullpage react-components
- writing pages & components completely in jade (using jade2react)
- auto-bundling clientside code (using browserify)
- inline editing of pages(planned)
- component system for inline editing, similar to apostrophe2 (planned)
- auto-generated & easily extendable admin interface (planned)
- page hierarchy organizer (planned)

project state
-------------
I've just started with this project, so everything is very experimental. You can't rely on any APIs, since everything is still subject to change. I'm still trying out different things to find the best possible way for this CMS to work. You can already create basic websites with this CMS, but don't expect your website to be compatible to future versions of neutronJS.

getting started
---------------
first of all, neutronJS is just an express middleware! So, you can embed it easily into any existing website and also just use it for very specific parts of your website.

To create the neutronJS middleware, you first need to install neutronJS using `npm install neutronjs`. Then you are ready to create the middleware using the following code:

```
//load neutronJS
var neutron = require('neutronjs');

//create the website middleware
var website = new neutron.Website({url:'/'});

/* register the views. Specify the absolute paths of all your full-page components here
   (those that also render the html, head and body tag)
   You can also write your views in Jade. Those views will automatically get converted
   to normal react components */

website.registerViews({
    "Home":require.resolve('/path/to/normal/react/component.js'),
    "About":require.resolve('/path/to/jade/component.jade')
});

// define the routes of the website. You can only use views you've registered before.
website.addRoute("/","Home");
website.addRoute("/about","About");

//now add the website middleware to your express app
app.use(website);
```

The above is the most basic setup of a page. In future there will be a lot more features, for example to register components for inline editing or to extend & customize the admin interface.

examples
--------
for now, the only page that is based on this CMS is the [new all in one concert page](https://github.com/all-in-one-concert/website), that's still in development. You'll learn a lot just from looking at its source code. I also plan to create some example websites after the API gets stable.

API reference
-------------

### Website
- **new Website (opts)**
    - opts: An object containing configuration parameters for the website
        - url: A string containing the base path of the website eg. '/'
    - return value: An express middleware function, with the additional methods below.
- **registerViews (views)**
    - views: An object containing key value pairs of view entries.
        - key: Defines the name of the view (must be unique to the entire website)
        - value: A string that represents the absolute path to the react component
          (we recomment using require.resolve to get the absolute path)
- **addRoute (path,view)**
    - path: Either a string or regular expression that specifies the path of this route.
      See express routes for more details.
    - view: A string with the name of the view. You must have registered a view with
      this name using `registerViews` before.






license
-------
MPLv2, read [LICENSE.md](./LICENSE.md) for more information
