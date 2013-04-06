      __                    __      __                                                 
     /\ \                  /\ \    /\ \                                   __           
     \ \ \      __      ___\ \ \/'\\ \ \____    ___     ___      __      /\_\    ____  
      \ \ \   /'__`\   /'___\ \ , < \ \ '__`\  / __`\ /' _ `\  /'__`\    \/\ \  /',__\ 
       \ \ \ /\ \ \.\_/\ \__/\ \ \\`\\ \ \ \ \/\ \ \ \/\ \/\ \/\  __/  __ \ \ \/\__, `\
     /\ \_\ \\ \__/.\_\ \____\\ \_\ \_\ \_,__/\ \____/\ \_\ \_\ \____\/\_\_\ \ \/\____/
     \ \____/ \/__/\/_/\/____/ \/_/\/_/\/___/  \/___/  \/_/\/_/\/____/\/_/\ \_\ \/___/ 
      \/___/                                                             \ \____/      
                                                                          \/___/       
    Jackbone.js 0.1.0

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
Array of subviews for this view.

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
