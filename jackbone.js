//     Jackbone.js 0.4

//     (c) 2013, Jean-Christophe Hoelt, Fovea.cc
//     Jackbone may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://www.fovea.cc/jackbone/
(function () {
    'use strict';

    // Initial Setup
    // -------------

    // Save a reference to the global object (`window` in the browser, `exports`
    // on the server).
    var root = this;

    // The top-level namespace. All public Jackbone classes and modules will
    // be attached to this. Exported for both the browser and the server.
    var Jackbone;
    if (typeof exports !== 'undefined') {
        Jackbone = exports;
    } else {
        Jackbone = root.Jackbone = {};
    }

    // Require Backbone
    var Backbone = root.Backbone;
    if (!Backbone && (typeof require !== 'undefined')) {
        Backbone = require('backbone');
    }

    // Require Underscore, if we're on the server, and it's not already present.
    var _ = root._;
    if (!_ && (typeof require !== 'undefined')) {
        _ = require('underscore');
    }
    // And $ as retrieved by Backbone
    var $ = Backbone.$;

    // Jackbone is an extension of Backbone
    _.extend(Jackbone, Backbone);

    // Current version of the library. Keep in sync with `package.json`.
    Jackbone.VERSION = '0.4.0';

    // Create local references to array methods we'll want to use later.
    var slice = Array.prototype.slice;

    // Jackbone.profiler
    // -----------------
    //
    // Allows you to profile time to perform certain actions
    // Used by the Router to profile view creation times.
    //
    // Set Jackbone.profile.enabled = true to activate.
    var profiler = Jackbone.profiler = {

        // Set to true to enable profiling your views.
        enabled: false,

        // Dictionary of statistics.
        stats: {},

        // Currently running timers
        _startDate: {},

        _timerConsoleName: {},

        // Called at the beggining of an operation
        onStart: function (t, timerName) {
            if (this.enabled) {
                var id = _.uniqueId('jt');
                this._startDate[id] = t || (+new Date());
                if (console.profile && timerName) {
                    this._timerConsoleName[id] = timerName;
                    console.profile(timerName);
                }
                return id;
            }
        },

        // Called when an operation is done.
        //
        // Will update Jackbone.profiler.stats and show average duration on the
        // console.
        onEnd: function (timerId, timerName, t) {
            if (this.enabled) {
                if (this._startDate[timerId]) {
                    var duration = (t || (+new Date())) - this._startDate[timerId];
                    delete this._startDate[timerId];

                    if (console.profile) {
                        if (this._timerConsoleName[timerId]) {
                            console.profileEnd(this._timerConsoleName[timerId]);
                            delete this._timerConsoleName[timerId];
                        }
                    }

                    // Already have stats for this method? Update them.
                    if (typeof this.stats[timerName] !== 'undefined') {
                        var stats = this.stats[timerName];
                        stats.calls += 1;
                        stats.totalMs += duration;
                        if (duration > stats.maxMs) {
                            stats.maxMs = duration;
                        }
                    }
                    else {
                        // It's the first time we profile this method, create the
                        // initial stats.
                        this.stats[timerName] = {
                            calls: 1,
                            totalMs: duration,
                            maxMs: duration
                        };
                    }

                    console.log('time(' + timerName + ') = ' + duration + 'ms');
                }
                else {
                    console.log('WARNING: invalid profiling timer');
                }
            }
        }
    };

    // Jackbone.View
    // -------------

    // Base for all views, Jackbone Views provide necessary methods
    // for the management of events for hidden but persistant views
    // (when cached by Jackbone's ViewManager), as well as a child
    // views hierarchy and JQueryMobile specific callbacks.
    var View = Jackbone.View = function (options) {

        // List of child views
        this.subviews = [];

        // Default "Back" button
        this.back = { title: 'Back', hash: '' };

        // Call backbone view's constructor
        Backbone.View.apply(this, arguments);

        // Apply options
        if (options) {
            this.setOptions(options);
        }
    };
    View.extend = Backbone.View.extend;

    _.extend(View.prototype, Backbone.View.prototype, {

        // Change options for this view and its subviews.
        setOptions: function (options) {
            this.options = options;

            // options.back can be used to change view 'Back' link.
            if (options.back) {
                this.back = options.back;
            }

            this.callSubviews('setOptions', options);
            this.applyOptions(options);
        },

        // Call the given method for all subviews.
        // Passing extra arguments is posible, they will be passed
        // to subviews too.
        callSubviews: function (method) {
            if (this.subviews.length !== 0) {
                var params = slice.call(arguments);
                params.shift();
                _.each(this.subviews, function (s) {
                    if (s[method]) {
                        s[method].apply(s, params);
                    }
                });
            }
        },

        // Bind and delegate events for this view and its subviews.
        _setup: function () {
            this.callSubviews('_setup');
            this.bindEvents();
            this.delegateEvents();
        },
        // Unbind and undelegate events for this view and its subviews.
        _clean: function () {
            this.callSubviews('_clean');
            this.unbindEvents();
            this.undelegateEvents();
        },

        // Called whenever options have been changed.
        // Overload to run your own custom code.
        applyOptions: function (/* options */) {},

        // Called whenever events binding is required.
        // Overload to bind your own callbacks to events.
        bindEvents: function () {},

        // Called whenever cleaning of events binding is required.
        // Overload to unbind your own callbacks to events.
        unbindEvents: function () {
            this.stopListening();
        },

        // Called whenever a refresh of you view is required.
        // The view already has been rendered, so it's better to only
        // alter it if possible, instead of performing a full re-render.
        refresh: function () {
            this.callSubviews('refresh');
        },

        // Called before the page is enhanced by JQuery Mobile.
        // Overload for your own use.
        onPageBeforeCreate: function () {
            this.callSubviews('onPageBeforeCreate');
        },
        // Called when the page is being enhanced by JQuery Mobile.
        // Overload for your own use.
        onPageCreate: function () {
            this.callSubviews('onPageCreate');
        },
        // Called when the page is being enhanced by JQuery Mobile.
        // Overload for your own use.
        onPageManualCreate: function () {
            this.callSubviews('onPageManualCreate');
        },
        // Called before the page starts being transitioned to.
        // Overload for your own use.
        onPageBeforeShow: function () {
            this.callSubviews('onPageBeforeShow');
        },
        // Called when the page is done being transitioned to.
        // Overload for your own use.
        onPageShow: function () {
            this.callSubviews('onPageShow');
        },
        // Called before the page starts being transitioned from.
        // Overload for your own use.
        onPageBeforeHide: function () {
            this.callSubviews('onPageBeforeHide');
        },
        // Called when the page is done being transitioned from.
        // Overload for your own use.
        onPageHide: function () {
            this.callSubviews('onPageHide');
        },

        // By default, views use a delegated event to check
        // for clicks on elements that define a "route" attribute.
        events: {
            'vclick': 'defaultEvent'
        },

        // This is the default event handler
        defaultEvent: function (e) {
            e.preventDefault();
            var $target = $(e.target);
            while ($target) {
                var route = $target.attr('route');
                if (route) {
                    // A route has been defined, follow the link using
                    // Jackbone's default router.
                    if (route === 'back') {
                        Jackbone.router.goto(this.back.hash);
                    } else {
                        Jackbone.router.goto(route);
                    }
                    return false;
                }
                var parent = $target.parent();
                if (parent.length > 0) {
                    $target = parent;
                } else {
                    $target = false;
                }
            }
            return true;
        },

        // Provided for conveniance to views willing to ignore certain events.
        ignoreEvent: function (e) {
            if (e && e.preventDefault) {
                e.preventDefault();
            }
            return false;
        }
    });

    // Jackbone.Header
    // ---------------
    var Header = Jackbone.Header = function () {
        View.apply(this, arguments);
    };
    Header.extend = View.extend;
    _.extend(Header.prototype, Jackbone.View.prototype);

    // Jackbone.Footer
    // ---------------
    var Footer = Jackbone.Footer = function () {
        View.apply(this, arguments);
    };
    Footer.extend = View.extend;
    _.extend(Footer.prototype, Jackbone.View.prototype);

    // JQueryMobile View
    // -----------------
    var JQMView = function (header, content, footer) {
        Backbone.View.apply(this, []);
        this.header  = header;
        this.footer  = footer;
        this.content = content;
        this.needRedraw = true;
        this.needSetup  = true;

        // setup relations between header, footer and content.
        this.subviews = [];
        if (header) {
            // link header to its root view, content and footer.
            header.content = content;
            header.footer  = footer;
            header.root    = this;
            this.subviews.push(header);
        }
        if (footer) {
            // link footer to its root view, content and header.
            footer.content = content;
            footer.header  = header;
            footer.root    = this;
            this.subviews.push(footer);
        }
        if (content) {
            // link content view to its root view, header and footer.
            content.header  = header;
            content.footer  = footer;
            content.root    = this;
            this.subviews.push(content);
        }
    };

    _.extend(JQMView.prototype, Backbone.View.prototype, {
        // Change options for header, footer and content.
        setOptions: function (options) {
            this.callSubviews('setOptions', options);
        },

        // Call methods on subviews (inherited from View)
        callSubviews: View.prototype.callSubviews,

        /** Default render. Sets header, content and footer. */
        render: function () {

            // Note: Controllers are responsible of setting needRedraw.
            if (this.needRedraw) {

                // Create root element for the page
                var page = document.createElement('div');
                page.style.display = 'block';
                page.setAttribute('data-role', 'page');

                // Create, render and add the header
                if (this.header) {
                    var header = document.createElement('div');
                    header.setAttribute('data-role', 'header');
                    this.header.setElement(header);
                    this.header.render();
                    page.appendChild(header);
                }

                // Create the content element
                var content = document.createElement('div');
                content.setAttribute('data-role', 'content');
                content.className = 'content';

                // Render the content
                this.content.setElement(content);
                this.content.render();

                // Make sure content fills the screen to the top/bottom
                // when no header/footer are provided.
                if (!this.header) {
                    content.style.top = '0';
                }
                if (!this.footer) {
                    content.style.bottom = '0';
                }

                page.appendChild(content);

                // Create, render and add the footer
                if (this.footer) {
                    var footer = document.createElement('div');
                    footer.setAttribute('data-role', 'footer');
                    this.footer.setElement(footer);
                    this.footer.render();
                    page.appendChild(footer);
                }

                // Add the page into the DOM.
                if (this.el.firstChild) {
                    this.el.replaceChild(page, this.el.firstChild);
                }
                else {
                    this.el.appendChild(page);
                }
 
                this.needRedraw = false;
            }
        },

        events: {
            // JQueryMobile Hack
            'pagebeforehide':   '_onPageBeforeHide', // before hide transition
            'pagehide': '_onPageHide',               // after  hide transition

            'pagebeforeshow':   '_onPageBeforeShow', // before show transition
            'pageshow': '_onPageShow',               // after  show transition

            'pagebeforecreate': '_onPageBeforeCreate', // before create
            'pagecreate':       '_onPageCreate'        // before jqm enhancement
        },

        // JQuery Mobile Hack
        _onPageBeforeHide: function () {
            this.callSubviews('onPageBeforeHide');
            this.clean();
        },
        _onPageHide: function () {
            this.undelegateEvents();
            this.callSubviews('onPageHide');
        },
        _onPageBeforeShow: function () {
            this.callSubviews('onPageBeforeShow');
            this.enable(); // Make sure the page isn't disabled.
        },
        _onPageShow: function () {
            this.setup();
            this.callSubviews('onPageShow');
        },
        _onPageBeforeCreate: function () {
            this.callSubviews('onPageBeforeCreate');
        },
        _onPageCreate: function () {
            this.callSubviews('onPageCreate');
        },
        _onPageManualCreate: function () {
            this.callSubviews('onPageManualCreate');
        },
        setup: function () {
            if (this.needSetup) {
                this.callSubviews('_setup');
                this.needSetup = false;
            }
        },
        clean: function () {
            if (!this.needSetup) {
                this.callSubviews('_clean');
                this.needSetup = true;
            }
        },

        refresh: function () {
            this.callSubviews('refresh');
        },

        disable: function () {
            this.$el.addClass('ui-disabled');
        },
        enable: function () {
            this.$el.removeClass('ui-disabled');
        }
    });

    // Listview Helper
    // ---------------
    //
    // Helps doing a clean refresh of a listview.
    //
    // updater is a ListviewUpdater object {
    //     setLi: function ($li, model);
    //     newLi: function (model);
    // }
    // setLi will adjust the content of jQuery li element
    //     according to the given JSON model.
    // newLi will create a new li element from given JSON model.
    Jackbone.Listview = {
        
        // Parameters
        // ul: a jQuery ul element
        // collection: JSON collection
        // updater, a ListviewUpdater (see above)
        updateJSON: function ($ul, collection, updater, refresh) {
            var ul = ($ul.length ? $ul[0] : $ul);
            var i = 0;
            // var li = $ul.find('li');
            var li = ul.childNodes;

            // Update existing
            while (i < collection.length && i < li.length) {
                updater.setLi(li[i], collection[i]);
                ++i;
            }
            // Add new
            while (i < collection.length) {
                $(ul).append(updater.newLi(collection[i]));
                ++i;
            }
            // Remove extra
            var j = li.length - 1;
            while (j >= i) {
                ul.removeChild(li[j]);
                --j;
            }
            if (refresh !== false) {
                $(ul).listview('refresh');
            }
        },

        // Parameters
        // $ul: a jQuery ul element
        // collection: Backbone collection
        // updater, a ListviewUpdater (see above)
        update: function ($ul, collection, updater, refresh) {
            var json = _(collection.models).map(function (m) {
                var ret = _.clone(m.attributes);
                _.extend(ret, { id: m.id, cid: m.cid });
                return ret;
            });
            this.updateJSON($ul, json, updater, refresh);
        }
    };

    // Theming Options
    // ---------------

    // Screens may include a default header.
    // It can be disabled globally by setting this to null
    // or per screen by passing the noHeader option to the
    // ViewManager.
    Jackbone.DefaultHeader = null;

    // Screens may include a default footer too.
    // It can be disabled globally by setting this to null
    // or per screen by passing the noFooter option to the
    // ViewManager.
    Jackbone.DefaultFooter = null;

    // Jackbone.Controller
    // -------------------

    // For complex views that could be reused in different contexts
    // it's better to create one (or many) controller.
    // Views will only handle input/output, whereas controllers
    // will handle logic and interactions with models.
    //
    // Backbone doesn't provide a "Controller" interface, but Jackbone
    // defines one. It's more than an interface, it's a also set of
    // conventions that controllers have to follow.
    //
    // Here is what Controllers do:
    // - Load models and collections.
    // - Create the view, send it the appropriate 'options'.
    // - Provide "intelligence" to the view as a set of callbacks.
    //
    // *INTERACTION WITH THE VIEW*
    // Controller should fill this.options in the initialize method.
    // 
    // In options, we add models and callbacks that the view will
    // have to call. A very common callback is onRefresh().
    // onRefresh will be called by the view to refresh the models
    // and collections, before it refreshes the interface.
    //
    // *OTHER THINGS TO KNOW*
    //
    // A Controller will be kept in cache by the ViewManager, for
    // a few minutes after its View was hidden.
    //
    // Later on, controller's destroy() will be called by the
    // garbage collector. This is where the Controller has to destroy
    // structure it may have created.
    //
    // A nice way for a controller to monitor his view is by providing
    // callbacks in the options.
    //
    // *INTERACTION WITH THE VIEW MANAGER*
    // 
    // The View Manager will instanciate controllers.
    // 
    // It will then look for this.view, an instanciated Jackbone.View
    //

    var Controller = Jackbone.Controller = function (options) {
        this._configure(options || {});
        this.view = null;
        this.initialize.apply(this, arguments);
    };
    Controller.extend = View.extend;

    // List of controller options to be merged as properties.
    var controllerOptions = ['model', 'collection'];

    _.extend(Jackbone.Controller.prototype, Backbone.Events, {
        // Refresh Models and Collections, call "callback" when done.
        refresh: function (callback) {
            callback();
        },

        // Perform the refresh when view is gonna be open for the
        // first time. By default, call `this.refresh()`
        firstRefresh: function (callback) {
            this.refresh(callback);
        },

        // Initialize the controller.
        // this.view has to be instanciated here.
        initialize: function () {
            // Prepare options to be sent to the view.
            // this.options.onRefresh = _.bind(this.refresh, this);
            this.view = null;
        },

        setOptions: function (options) {
            this.applyOptions(options);
            if (this._rootView) this._rootView.setOptions(options);
        },

        // Apply any changes made to the controller's options.
        applyOptions: function (/* options */) {},

        // Destroy the controller, its views and models.
        destroy: function () {},

        // Called whenever events binding is required.
        // Overload to bind your own callbacks to events.
        bindEvents: function () {},

        // Called whenever cleaning of events binding is required.
        // Overload to unbind your own callbacks to events.
        unbindEvents: function () {
            this.stopListening();
        },

        // Performs the initial configuration of a View with a set of options.
        // Keys with special meaning *(e.g. model, collection, id, className)*
        // are attached directly to the view.  See `viewOptions` for an
        // exhaustive list.
        _configure: function (options) {
            if (this.options) {
                options = _.extend({}, _.result(this, 'options'), options);
            }
            _.extend(this, _.pick(options, controllerOptions));
            this.options = options;
        }

    });


    // Jackbone.ViewManager
    // --------------------

    // Handles life and death of Views and Controllers
    var ViewManager = Jackbone.ViewManager = {
        views: {},
        controllers: {},
        currentController: null,

        setCurrentController: function (ctrl) {
            if (ctrl !== this.currentController) {
                if (this.currentController) {
                    this.currentController.unbindEvents();
                }
                this.currentController = ctrl;
                if (this.currentController) {
                    this.currentController.bindEvents();
                }
            }
        },

        // Garbage collector, removes unused views and controllers.
        _clearControllers: function () {

            var that = this;
            var now = +new Date();
            var toRemove = _(this.controllers).filter(function (c) {
                var age = (now - c.lastView);
                return (age > 60000); // Keep in cache for 1 minute.
            });

            _(toRemove).each(function (c) {
                if (c.controller !== that.currentController) {
                    delete that.controllers[c.pageUID];
                    c.controller.destroy();
                    if (c.controller._rootView) {
                        c.controller._rootView.clean();
                        c.controller._rootView.remove();
                        Jackbone.trigger("destroyview", c.controller._rootView);
                    }
                }
            });
        },

        forceGarbageCollection: function () {
            var that = this;
            // For all dates to 0, so everyone gets garbage collected.
            _(this.controllers).each(function (c) {
                c.lastView = 0;
            });
            // Then run the garbage collector
            this._clearControllers();
        },

        // Create a View if it's not already in cache.
        // Configure it with the given options.
        //
        // New instance of the View will be created if options are
        // different from those already in cache.
        //
        // Use extra_options to set some options that won't induce
        // creation of a new instance (useful for View that eat
        // a lot memory or cpu power for instance).
        //
        // A few special options:
        // - options.backhash: force the page to go back to.
        // - options.noHeader: disable the header for this view.
        // - options.noFooter: disable the footer for this view.
        createWithView: function (args, callback) {
            var name = args.name;
            var View = args.Class;
            var options = args.options || {};
            var extra_options = args.extra;
            var view;

            // pageUID is a unique ID to identify an instance of a View.
            var pageUID = name + JSON.stringify(options).replace(/["{}]/g, "");

            // Add extra_options to options
            if (extra_options) {
                options = _.extend(options, extra_options);
            }

            // Adjust the backhash option
            if (options && options.backhash) {
                options.back = {
                    title: options.backtitle || 'Back',
                    hash:  options.backhash
                };
            }

            // This view already exists.
            if (typeof this.views[pageUID] !== 'undefined') {

                // Retrieve it.
                view = this.views[pageUID];

            } else {

                // Should we create a Header and/or Footer?
                var noHeader = (options && options.noHeader) ||
                    (!Jackbone.DefaultHeader);
                var noFooter = (options && options.noFooter) ||
                    (!Jackbone.DefaultFooter);

                // Create the main content view.
                var content = new View();

                // Add headers and footer if required.
                var header  = noHeader ? null : new Jackbone.DefaultHeader();
                var footer  = noFooter ? null : new Jackbone.DefaultFooter();

                // Build the root view.
                view = new JQMView(header, content, footer);

                // Store it in the cache for later retrieval.
                this.views[pageUID] = view;
            }

            // Change its options and refresh.
            view.setOptions(options);

            // No controller is active, this is a Controller-less View.
            this.setCurrentController(null);
            view._pageUID = pageUID;

            if (typeof callback === 'function')
                callback(view);
        },

        // Loop counter used to run garbage collection
        // every n calls to createWithController.
        runGC: 0,

        // UID of the page currently being opened.
        _openInProgress: 0,

        // Create a Controller if it's not already in cache.
        // Configure it with the given options.
        //
        // New instance of the Controller will be created if options
        // are different from those already in cache.
        //
        // A few special options:
        // - options.backhash: force the page to go back to.
        // - options.noHeader: disable the header for this view.
        // - options.noFooter: disable the footer for this view.
        createWithController: function (args, callback) {
            var that = this;

            // Retrieve arguments
            var name = args.name;
            var Controller = args.Class;
            var options = args.options || {};
            var extra_options = args.extra;

            // UID of the page.
            var pageUID = name + JSON.stringify(options).replace(/["{}]/g, "");
            this._openInProgress = pageUID;

            // Run Controller Garbage Collector
            this.runGC += 1;
            if (this.runGC > 5) {
                this.runGC = 0;
                this._clearControllers();
            }

            // Add extra_options to options
            if (extra_options) {
                options = _.extend(options, extra_options);
            }

            // Adjust the backhash option
            if (options && options.backhash) {
                options.back = {
                    title: options.backtitle || 'Back',
                    hash:  options.backhash
                };
            }

            // Called when the views and controller are done being created
            var ctrl = null;
            var doneCreate = function () {

                // It happens that a refresh takes so long that the
                // view is GCed between refresh and doneCreate. Most probably
                // the user tried to open another view in the meantime,
                // So let's ignore the create view event.
                if (!that.controllers[pageUID] || (pageUID !== that._openInProgress)) {
                    return;
                }

                // Return root view (a JQMView)
                that.setCurrentController(ctrl);
                that.controllers[pageUID].lastView = +new Date();

                // Update options
                ctrl._rootView.setOptions(ctrl.options);

                // Events.trigger('change:pagecid', ctrl.componentCID, ctrl.reportCID);
                ctrl._rootView._pageUID = pageUID;

                if (typeof callback === 'function') {
                    callback(ctrl._rootView);
                }
            };

            // Create Controller if not exists.
            if (typeof this.controllers[pageUID] !== 'undefined') {
                ctrl = this.controllers[pageUID].controller;
                if (typeof ctrl.refresh === 'function') {
                    ctrl.refresh(doneCreate);
                }
                else {
                    doneCreate();
                }
            } else {
                // Should we create a Header and/or Footer?
                var noHeader = (options && options.noHeader) ||
                    (!Jackbone.DefaultHeader);
                var noFooter = (options && options.noFooter) ||
                    (!Jackbone.DefaultFooter);

                // Initialize the controller
                ctrl = new Controller(options);

                // Create views for a controller
                var createViews = function () {
                    var content = ctrl.view;
                    var header  = noHeader ? null : new Jackbone.DefaultHeader();
                    var footer  = noFooter ? null : new Jackbone.DefaultFooter();
                    var view    = new JQMView(header, content, footer);

                    // Cache the controller
                    that.controllers[pageUID] = { pageUID: pageUID, controller: ctrl };
                    ctrl._rootView = view;
                    view.controller = ctrl;

                    doneCreate();
                };

                // Give the chance to the controller to refresh its models
                // before we create the views.
                if (typeof ctrl.firstRefresh === 'function') {
                    ctrl.firstRefresh(createViews);
                }
                else {
                    createViews();
                }
            }

        }
    };

    // Jackbone.Router
    // ---------------

    // Jackbone Router provide a clean way to navigate through pages
    // by disabling JQueryMobile's own navigation engine and relying
    // only on JQueryMobile's changePage method.
    //
    // Use goto method or set route attribute to your HTML elements
    // in order to navigate from view to view.
    //
    // Override routes and call openView and openDialog in your own
    // application's Router.
    var Router = Jackbone.Router = function (/*options*/) {
        Backbone.Router.apply(this, arguments);

        // First created router is the default router.
        if (!Jackbone.router) {
            Jackbone.router = this;

            // It's also a good time to configure JQuery Mobile,
            // creating the first router will happen/ before the
            // first view is opened (obviously, because it is a
            // Jackbone.Router method).
            Jackbone.configureJQM();
        }
    };
    Router.extend = Backbone.Router.extend;

    // Used to generate page hash tag or HTML attribute.
    // by getPageName and getPageHash.
    // Does it by joining page and arguments using the given
    // separator.
    var makePageName = function (separator, page, args) {

        // By default, we return page name without arguments.
        var ret = page;
        if (typeof args !== 'undefined') {
            if (args && args.length) {
                // Some arguments have been provided, add them.
                if (args.length !== 0) {
                    ret = page + separator + args.join(separator);
                }
            } else {
                // Argument isn't an array, add it.
                ret = page + separator + args;
            }
        }
        return ret;
    };

    _.extend(Router.prototype, Backbone.Router.prototype, {

        // Navigate to a new page.
        goto: function (loc, args) {
            this.navigate(this.getPageHash(loc, args), {trigger: true});
        },

        // Name of the page as referenced by the page-name attribute in the DOM.
        getPageName: function (page, args) {
            return makePageName('_', page, args);
        },

        // Name of the page as referenced on the hash tag.
        getPageHash: function (page, args) {
            return makePageName('_', page, args);
        },

        _openInProgress: false,

        // Create and open view if not already cached.
        _openWithViewManager: function (args, callback) {

            var t = +new Date();
            if (t - this._openInProgress < 300) {
                // Probably a double click, ignore.
                return false;
            }
            this._openInProgress = t;

            // Start profiling view opening.
            var timerId = profiler.onStart(t, args.name);

            if (!args.extra) {
                args.extra = {};
            }

            // By default 'Back" will return to previous page.
            if (!args.extra.backhash) {
                args.extra.backhash = this.currentHash;
            }

            // Called when View Manager is done opening the window.
            var that = this;
            var done = function (v) {

                that._openInProgress = false;
                that.changePage(v._pageUID.replace(/\W/g, '-'), v, args.role);
                Jackbone.trigger('openview', v);

                // Done profiling.
                profiler.onEnd(timerId, v._pageUID);

                if (typeof callback === 'function') {
                    callback(v);
                }
            };

            // Open view with the View Manager.
            ViewManager[args.method](args, done);
        },

        // Create and open view if not already cached.
        openView: function (args, callback) {
            var a = _.extend({}, args, {
                method: 'createWithView'
            });
            this._openWithViewManager(a, callback);
        },

        // Create and open dialog if not already cached.
        openDialog: function (args, callback) {
            var a = _.extend({}, args, {
                method: 'createWithView',
                role: 'dialog'
            });
            this._openWithViewManager(a, callback);
        },

        // Create and open view with a controller if not already cached.
        openViewController: function (args, callback) {
            var a = _.extend({}, args, {
                method: 'createWithController'
            });
            this._openWithViewManager(a, callback);
        },

        // Create and open dialog with a controller if not already cached.
        openDialogController: function (args, callback) {
            var a = _.extend({}, args, {
                method: 'createWithController',
                role: 'dialog'
            });
            this._openWithViewManager(a, callback);
        },

        // Change to the given page.
        changePage: function (pageName, page, role) {
            // Extends Views
            // Create JQuery Mobile Page
            var pageid = 'pagename-' + pageName.toLowerCase();
            var isExistingPage = $('#' + pageid);

            // For already existing pages, only delegate events so they can
            // handle onPageBeforeShow and onPageShow.
            if (isExistingPage.length === 1) {

                // Sometimes, controller may have been destroyed but the
                // HTML stayed in the DOM (in case of an exception).
                // We can detect that using needRedraw, which indicate
                // that we have to do a full repaint.
                if (page.needRedraw) {
                    page.render();
                }
                else {
                    page.refresh();
                    page.delegateEvents();
                }

            } else {
                // Create the page, store its page name in an attribute
                // so it can be retrieved later.
                page.el.id = 'pagename-' + pageName.toLowerCase();
                page.el.className = 'page-container';

                // Render it and add it in the DOM.
                page.render();

                if (Jackbone.manualMode) {
                    // Create the new page
                    page._onPageBeforeCreate();
                    Jackbone.trigger('createview', page);
                    page._onPageManualCreate();
                    page._onPageCreate();
                }

                // Append to the DOM.
                document.body.appendChild(page.el);
            }

            if (!Jackbone.manualMode) {
                // Select the transition to apply.
                var t = this.selectTransition(pageName, role);

                // Perform transition using JQuery Mobile
                $.mobile.changePage(page.$el, {
                    changeHash:    false,
                    transition:    t.transition,
                    reverse:       t.reverse,
                    role:          role,
                    pageContainer: page.$el
                });
            }
            else {

                var currentActivePage = Jackbone.activePage;
                try {
                    // Hide previous page, show next
                    if (Jackbone.activePage) {
                        Jackbone.activePage._onPageBeforeHide();
                    }
                    page._onPageBeforeShow();
                    page.$el.show();
                    if (Jackbone.activePage) {
                        Jackbone.activePage.$el.hide();
                        Jackbone.activePage._onPageHide();
                    }
                    page._onPageShow();

                    // Update 'activePage'
                    Jackbone.activePage = page;
                    $.mobile.activePage = page.$el;
                }
                catch (error) {
                    page.$el.hide();
                    if (currentActivePage) {
                        currentActivePage.$el.show();
                        Jackbone.activePage = currentActivePage;
                        $.mobile.activePage = currentActivePage.$el;
                    }
                    throw new Error('Failed to changePage: ' + error);
                }
            }

            // Current hash is stored so a subsequent openView can know
            // which page it comes from.
            this.currentHash = Jackbone.history.getFragment();
        },

        // Known transitions, allow us to do reverse transitions from B->A
        // when transition A->B already has been performed.
        // Works ideally on herarchical navigation structures, for other structures
        // just use 'fade' transitions (or other non-directional transitions).
        transitions: {},

        // Return parameters of the transition to use to switch to pageName
        // It's context dependant, meaning this method remembers the currently
        // viewed view and determine the transition accordingly.
        selectTransition: function (pageName, role) {
            var lastPageName     = this.currentPageName || '';
            var lastPageRole     = this.currentPageRole || '';
            this.currentPageName = pageName;
            this.currentPageRole = role;

            // Known transition, return it.
            if (_(this.transitions).has(lastPageName + '-->' + pageName)) {
                return this.transitions[lastPageName + '-->' + pageName];
            }

            // Use JQueryMobile default page transition.
            var transition = $.mobile.defaultPageTransition;

            // Except for dialogs.
            if ((role === 'dialog') || (lastPageRole === 'dialog')) {
                // Use JQueryMobile default dialog transition.
                transition = $.mobile.defaultDialogTransition;
            }

            // Save the transition
            this.transitions[lastPageName + '-->' + pageName] = {
                transition: transition,
                reverse: false
            };
            this.transitions[pageName + '-->' + lastPageName] = {
                transition: transition,
                reverse: true
            };

            // And return it.
            return { transition: transition, reverse: false };
        }
    });

    // Jackbone.History
    // ----------------
    Jackbone.history = Backbone.history;

    // Initialization
    // --------------

    // When JQueryMobile is initialized and document is ready,
    // we can tell client app to start.
    Jackbone.configureJQM = function () {

        // Disable JQueryMobile Navigation
        $.mobile.ajaxEnabled = false;
        $.mobile.linkBindingEnabled = false;
        $.mobile.hashListeningEnabled = false;
        $.mobile.pushStateEnabled = false;

        // $.mobile.buttonMarkup.hoverDelay = 0
        // Enable for smooth transitions on iOS
        $.mobile.touchOverflowEnabled = true;
    };

    // Configuration options.

    // Manual mode is an experimental feature, in which
    // jQuery Mobile's automatic page enhancements is disabled.
    // You can still create jQM widgets and call the API
    // by yourself. This allows for greater performance.
    Jackbone.manualMode = false;

}).call(this);
