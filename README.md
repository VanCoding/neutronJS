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

To create the neutronJS middleware, you first need to install neutronJS using `npm install neutronjs`. Then you can require it using `var neutron = require("neutron.js");`. Then you can create a website using `var website = new neutron.Website({/*options*/});`, add your widgets using `website.registerWidget()`, add your routes using `website.addRoutes()` and then mount your website in an express app using `app.use(website);`

examples
--------
for now, the only page that is based on this CMS is the [new all in one concert page](https://github.com/all-in-one-concert/website), that's still in development. You'll learn a lot just from looking at its source code. I also plan to create some example websites after the API gets stable.

API reference
-------------

### Website (class)
The website class is the main class of neutronJS. It is usually only instanciated once. You can register widgets & pages on it and define routes. A website instance is also a mountable express route, so you can `app.use()` it.
- **new Website (opts)**
    - opts: An object containing configuration parameters for the website
        - url: A string containing the base path of the website eg. '/'
    - return value: An express middleware function, with the additional methods below.
- **registerWidget (widget)**
    - widget: The widget object to register (see Widget)
- **addRoute (path, page)**
    - path: Either a string or regular expression that specifies the path of this route.
      See express routes for more details.
    - page: The page object to use for this route (see Page)
- **loadWidgets (widgets, cb)** A helper function for use in Widget.load/Page.load.
    - widgets: An array of widget-data objects to call the widgets `load`-function on.
    - cb: The callback function to call when it's done.
- **saveWidgets (widgets, cb)** A helper function for use in Widget.save/Page.save.
    - widgets: An array of widget-data objects to call the widgets `save`-function on.
    - cb: The callback function to call when it's done.

###Widget (data structure)
A widget represents a part of a page. It holds information or functions about reading & saving data and rendering this part of the page. A widget can be any object that implements the following properties & functions:

- **id** A unique identifier (string) for this widget.

- **componentPath** The absolute path (string) to the react-component, that renders the visual part of this widget. It is recommended to use `require.resolve()` to get the path. See also `Widget & Page Components`

- **load (website,data,cb)** -optional-
In this function, you can load data for your widget that cannot be stored inline and write it to the `data` object. Call `cb` if you are done. If your widget contains sub-widgets, make sure that you call the `load`-functions for those widgets, too! See also the helper function for this: `Website.loadWidgets()`.
    - website: The website of the widget
    - data: The data object to put the data of you widget into.
    - cb: The callback function to call when you're done

- **save (website, data, cb)** -optional-
In this function, you can save the data of your widget that should not get stored inline & remove the corresponding properties of the data object. Basically, you do the reverse of what you do in the `save`-function. If your widget contains sub-widgets, make sure that you call the `save`-function for those widgets, too! See also the helpfer function for this: `Website.saveWidgets`
    - website: The website of the widget
    - data: The data object to save & clear
    - cb: The callback function to call when you're done

###Page (data structure)
A page represents a root-template of your website. It holds information or functions about reading & saving data and rendering this page. A page is & works basically the same as a widget, with the following exceptions:
- It has no unique id

See *Widget* for more information.

###Widget- and Page- Components
In neutron, everything visual gets rendered through react-components. So, for every Widget and Page you need to define a path to a react-component, that renders this widget/page.

When a Page or Widget gets rendered, there are always two properties passed to them:
- page: an object holding static information about neutron & the current page
    - edit: A boolean that indicates if the page is in edit mode. If it is, you should also render controls for editing in your component, and hide them if it's set to false, so that it looks like normal.
- data: the data of the current page or widget. This data gets loaded from the Page's or Widget's `load`-function, and is by default an empty object, if that function is not defined. You can modify the content of this data-object, and when the user hits the page's "Save"-Button, this data-object gets sent to the Page's or Widget's `save` function. If you do it right, `load` will return the exact same data that was passed to `save`, the next time you load the page.

todo
----
- Split website in 3 parts: neutron, router and page
- Allow pages & adminmodules to add files to require in the init function
- Make a separate router for every page (like for adminmodules)
- Change client.js so that it is able to render a page based on properties
- group page props together: neutron (everything global, neutron related), page (everything related to the page, eg. path, params + props added in the page's init function)
- let pages add static props to their page element in the init function

license
-------
MPLv2, read [LICENSE.md](./LICENSE.md) for more information
