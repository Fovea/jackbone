Jackbone.js
===========

Why use Jackbone?
-----------------

Developing Backbone + JQuery Mobile javascript applications is possible, but it's a pain. Jackbone is here to make it as easy as it should.

Summary
-------

Jackbone is a utility library that aims to structure the development of rich HTML5 applications using JQuery Mobile, by extending the Backbone framework. It heavily relies on Backbone, offering specialized classes for your **views** and **router**. Additionaly, it defines a **controller** interface, provide a **view manager** that handles life and death of the Views and Controllers of your application.

Licence
-------

(c) 2013, Jean-Christophe Hoelt, Fovea.cc

Jackbone is available for use under the MIT software license.

Code for this library was initially extracted from a work for FlightWatching's Checklist application.

Documentation
=============

Make sure you've read Backbone documentation first. This documentation will only cover the additions and differences between Jackbone and Backbone.

Maybe you'd like to check-out some examples first?

 * Simple: [Hello World](https://github.com/Fovea/jackbone/blob/master/examples/helloworld/js/main.js)
 * More advanced: [Todo List](https://github.com/Fovea/jackbone/blob/master/examples/todolist/js/main.js)

##Jackbone.View##

Jackbone views are basically Backbone views with extra features like:

 * necessary methods for the management of events binding for hidden but non-deleted views
   * (when cached by Jackbone's ViewManager)
 * a child views hierarchy.
 * JQueryMobile specific callbacks.

###subviews `object.subviews`
Array of subviews for this view. Manipulate directly.

###setOptions `object.setOptions(options)`
Change options for this view and its subviews.

###applyOptions `object.applyOptions()`
Called whenever options have been changed.
*Overload* it to run your own custom code.

###callSubviews `object.callSubviews(method, arguments...)`
Call the given method for all subviews.
Passing extra arguments is posible, they will be passed to subviews too.

###bindEvents `object.bindEvents()`
Called whenever events binding is required.
*Overload* it to bind your own callbacks to events.

###unbindEvents `object.unbindEvents()`
Called whenever cleaning of events binding is required.
*Overload* it to unbind your own callbacks to events.

###refresh `object.refresh()`
Called whenever a refresh of you view is required.
The view already has been rendered, so it's better to only alter it if possible, instead of performing a full re-render.

###onPageBeforeCreate `object.onPageBeforeCreate()`
Called before the page is enhanced by JQuery Mobile.
*Overload* for your own use.

###onPageCreate `object.onPageCreate()`
Called when the page is being enhanced by JQuery Mobile.
*Overload* for your own use.

###onPageBeforeShow `object.onPageBeforeShow()`
Called before the page starts being transitioned to.
*Overload* for your own use.

###onPageShow `object.onPageShow()`
Called when the page is done being transitioned to.
*Overload* for your own use.

###onPageBeforeHide `object.onPageBeforeHide()`
Called before the page starts being transitioned from.
*Overload* for your own use.

###onPageHide `object.onPageHide()`
Called when the page is done being transitioned from.
*Overload* for your own use.

###events `object.events`
    events: {
        'vclick': 'defaultEvent'
    }
By default, views use a delegated event to check for clicks on elements that define a "route" attribute. **defaultEvent()** will open the page pointed by the route.

###defaultEvent `object.defaultEvent(ev)`
This is the default event handler.

###ignoreEvent `object.ignoreEvent(ev)`
Provided for conveniance to views willing to ignore certain events.

##Jackbone.Header and Jackbone.Footer
Like `Jackbone.View`, but aimed to be used as page headers and footers.

##Jackbone.Listview
The JQueryMobile Listview Helper

Helps doing a clean refresh of a listview.

Uses a **ListviewUpdater** object:

    ListviewUpdater: {
        **setLi**: function ($li, model);
        **newLi**: function (model);
        }

 * **setLi** will adjust the content of jQuery li element according to the given JSON model.
 * **newLi** will create a new li element from given JSON model.

###updateJSON `Listview.updateJSON($ul, collection, updater)`
Parameters:

 * **$ul**: a jQuery ul element
 * **collection**: JSON collection
 * **updater**: a `ListviewUpdater` (see above)

###update `Listview.update($ul, collection, updater)`
Parameters:

 * **$ul**: a jQuery ul element
 * **collection**: Backbone collection
 * **updater**: a ListviewUpdater (see above)

##Theming Options

###Jackbone.DefaultHeader
Screens may include a default header, which will be instanciated using the **Jackbone.DefaultHeader** View (a class extending **Jackbone.Header**).

It can be disabled globally by setting this to null or per screen by passing the **noHeader** option to **Router**'s **openView()** call.

###Jackbone.DefaultFooter
Screens may include a default footer too, instanciated using the **Jackbone.DefaultFooter** View (a class extending **Jackbone.Footer**).

It can be disabled globally by setting this to null or per screen by passing the **noFooter** option to **Router**'s **openView()** call.

##Jackbone.Controller

For complex views that could be reused in different contexts it's better to create one (or many) controller.  Views will only handle input/output, whereas controllers will handle logic and interactions with models.

Backbone doesn't provide a "Controller" interface, but Jackbone defines one. It's more than an interface, it's a also set of conventions that controllers have to follow.

Here is what Controllers do:

 - Load models and collections.
 - Create the view, send it the appropriate 'options'.
 - Provide "intelligence" to the view as a set of callbacks.

###Interaction with the view
Controller should fill this.options in the initialize method.

In options, we add models and callbacks that the view will have to call. A very common callback is onRefresh(). onRefresh will be called by the view to refresh the models and collections, before it refreshes the interface.

###Other things to know
A Controller will be kept in cache by the ViewManager, for a few minutes after its View was hidden.

Later on, controller's **destroy()** will be called by the garbage collector. This is where the Controller has to destroy structure it may have created.

A nice way for a controller to monitor his view is by providing callbacks in the options.

###Interaction with the view manager

The View Manager will instanciate controllers.

It will then look for this.view, an instanciated Jackbone.View

###initialize `object.initialize(options)`
Initialize the controller.  **this.view** has to be instanciated here.

###destroy `object.destroy()`
Destroy the controller, its views and models.

Only useful when some heavy resource have to be freed.

###bindEvents `object.bindEvents()`
Called whenever events binding is required.
**Overload** to bind your own callbacks to events.

###unbindEvents `object.unbindEvents()`
Called whenever cleaning of events binding is required.
**Overload** to unbind your own callbacks to events.

##Jackbone.Router

Jackbone Router provide a clean way to navigate through pages by disabling JQueryMobile's own navigation engine and relying only on JQueryMobile's lower-level changePage method.

Use **goto** method or set the **route** attribute to your HTML elements in order to navigate from view to view.

Override **routes** and call **openView** and **openDialog** in your own application's Router.

###goto `object.goto(page, args)`
Navigate to a new page.

###getPageName `object.getPageName(page, args)`
Name of the page as referenced by the page-name attribute in the DOM.

###getPageHash `object.getPageHash(page, args)`
Name of the page as referenced on the hash tag.

###openView `object.openView(viewName, View, options, extra)`
Create the view if not already cached, then open it.

**viewName + options** will identify the view in the cache, thus should be unique for each view.

**extra** are additional options, to heavy to be used as a key in the cache.

**View** has to be a **Jackbone.View** constructor.

###openDialog `object.openDialog(viewName, View, options, extra)`
Same as **openView**, but open the view as a dialog.

###openViewController `object.openViewController(ctrlName, Controller, options, extra, role)`
Create view with a controller if not already cached, then open it. Behaviour is identical to **openView** except that **Controller** should be a **Jackbone.Controller** constructor instead of a **Jackbone.View**.

###openDialogController `object.openDialogController(ctrlName, Controller, options, extra, role)`
Same as **openViewController**, but open the view as a dialog.

##Jackbone.History
Like **Backbone.History**.
