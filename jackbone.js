//     Jackbone.js 0.1.5

//     (c) 2013, Jean-Christophe Hoelt, Fovea.cc
//     Jackbone may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://jackbone.org
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

    // Current version of the library. Keep in sync with `package.json`.
    Jackbone.VERSION = '0.1.5';

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

    // Create local references to array methods we'll want to use later.
    var slice = Array.prototype.slice;

    // Jackbone is an extension of Backbone
    _.extend(Jackbone, Backbone);

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

        Backbone.View.apply(this, arguments);
        this.setOptions(options);
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
        applyOptions: function () {},

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

        // Provided for conveniance to views williing to ignore certain events.
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
            // Header may now use direct links to its root view, content and footer.
            header.content = content;
            header.footer  = footer;
            header.root    = this;
            this.subviews.push(header);
        }
        if (footer) {
            // Footer may now use direct links to its root view, content and header.
            footer.content = content;
            footer.header  = header;
            footer.root    = this;
            this.subviews.push(footer);
        }
        if (content) {
            // Content view may now use direct links to its root view, header and footer.
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
            if (this.needRedraw) { // Controllers are responsible of setting needRedraw.
                var $page = $('<div data-role="page" style="display:block"></div>');

                if (this.header) {
                    var $header = $('<div data-role="header"></div>');
                    this.header.setElement($header);
                    // this.header.setTitle(this.content.title || '');
                    // this.header.setSubtitle(this.content.subtitle || '');
                    // this.header.setBack(this.content.back || {});
                    this.header.render();
                    $page.append($header);
                }

                var $content = $('<div class="content" data-role="content"></div>');
                this.content.setElement($content);
                this.content.render();
                if (!this.header) {
                    $content.css('top', '0');
                }
                if (!this.footer) {
                    $content.css('bottom', '0');
                }
                $page.append($content);

                if (this.footer) {
                    var $footer = $('<div data-role="footer"></div>');
                    this.footer.setElement($footer);
                    this.footer.render();
                    $page.append($footer);
                }

                this.$el.html('');
                this.$el.append($page);

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

            //'swiperight': 'triggerGoBack',
            //'swipeleft':  'triggerGoNext',
            // 'click':  'ignoreEvent' // Force vclick to be used, all click to be ignored.
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
            // if (this.footer) this.footer.refresh();
            // if (this.header) this.header.refresh();
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
        updateJSON: function (ul, collection, updater) {
            var i = 0;
            var li = ul.find('li');

            // Update existing
            while (i < collection.length && i < li.length) {
                updater.setLi($(li[i]), collection[i]);
                ++i;
            }
            // Add new
            while (i < collection.length) {
                ul.append(updater.newLi(collection[i]));
                ++i;
            }
            // Remove extra
            while (i < li.length) {
                $(li[i]).remove();
                ++i;
            }
            ul.listview('refresh');
        },

        // Parameters
        // ul: a jQuery ul element
        // collection: Backbone collection
        // updater, a ListviewUpdater (see above)
        update: function (ul, collection, updater) {
            var json = _(collection.models).map(function (m) {
                var ret = _.clone(m.attributes);
                _.extend(ret, { id: m.id, cid: m.cid });
                return ret;
            });
            this.updateJSON(ul, json, updater);
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

        // Initialize the controller.
        // this.view has to be instanciated here.
        initialize: function () {
            // Prepare options to be sent to the view.
            this.options.onRefresh = _.bind(this.refresh, this);
            this.view = null;
        },

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
        // Keys with special meaning *(e.g. model, collection, id, className)* are
        // attached directly to the view.  See `viewOptions` for an exhaustive
        // list.
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
    var ViewManager = {
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
                    }
                }
            });
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
        createWithView: function (name, View, options, extra_options) {
            var view;
            // pageUID is a unique ID to identify an instance of a View.
            var pageUID = name + JSON.stringify(options);
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
                // Change its options and refresh.
                view.setOptions(options);
            } else {
                // Should we create a Header and/or Footer?
                var noHeader = (options && options.noHeader) || (!Jackbone.DefaultHeader);
                var noFooter = (options && options.noFooter) || (!Jackbone.DefaultFooter);
                // Create the main content view.
                var content = new View(options);
                // Add headers and footer if required.
                var header  = noHeader ? null : new Jackbone.DefaultHeader(options);
                var footer  = noFooter ? null : new Jackbone.DefaultFooter(options);
                // Build the root view.
                view = new JQMView(header, content, footer);
                // Store it in the cache for later retrieval.
                this.views[pageUID] = view;
            }
            // No controller is active, this is a Controller-less View.
            this.setCurrentController(null);
            view._pageUID = pageUID;
            return view;
        },

        // Loop counter used to run garbage collection
        // every n calls to createWithController.
        runGC: 0,

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
        createWithController: function (name, Controller, options, extra_options) {
            // Run Controller Garbage Collector
            this.runGC += 1;
            if (this.runGC > 5) {
                this.runGC = 0;
                this._clearControllers();
            }
            // Create Controller if not exists.
            var ctrl = null;
            var pageUID = name + JSON.stringify(options);
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
            if (typeof this.controllers[pageUID] !== 'undefined') {
                ctrl = this.controllers[pageUID].controller;
            } else {
                // Should we create a Header and/or Footer?
                var noHeader = (options && options.noHeader) || (!Jackbone.DefaultHeader);
                var noFooter = (options && options.noFooter) || (!Jackbone.DefaultFooter);
                // Initialize the controller
                ctrl = new Controller(options);
                // Logger.log('Create Controller: ' + pageUID);
                var content = ctrl.view;
                var header  = noHeader ? null : new Jackbone.DefaultHeader(options);
                var footer  = noFooter ? null : new Jackbone.DefaultFooter(options);
                var view    = new JQMView(header, content, footer);
                // Cache the controller
                this.controllers[pageUID] = { pageUID: pageUID, controller: ctrl };
                ctrl._rootView = view;
            }
            // Return root view (a JQMView)
            this.setCurrentController(ctrl);
            this.controllers[pageUID].lastView = +new Date();

            // Events.trigger('change:pagecid', ctrl.componentCID, ctrl.reportCID);
            ctrl._rootView._pageUID = pageUID;
            return ctrl._rootView;
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
            return makePageName('?', page, args);
        },

        // Create and open view if not already cached.
        openView: function (viewName, View, options, extra, role) {
            if (!extra) {
                extra = {};
            }
            // By default 'Back" will return to previous page.
            if (!extra.backhash) {
                extra.backhash = this.currentHash;
            }
            var v = ViewManager.createWithView(viewName, View, options, extra);
            this.changePage(v._pageUID.replace(/\W/g, '-'), v, role);
            return v;
        },

        // Create and open dialog if not already cached.
        openDialog: function (viewName, View, options, extra) {
            return this.openView(viewName, View, options, extra, 'dialog');
        },

        // Create and open view with a controller if not already cached.
        openViewController: function (ctrlName, Controller, options, extra, role) {
            if (!extra) {
                extra = {};
            }
            // By default 'Back" will return to previous page.
            if (!extra.backhash) {
                extra.backhash = this.currentHash;
            }
            var v = ViewManager.createWithController(ctrlName, Controller, options, extra);
            this.changePage(v._pageUID.replace(/\W/g, '-'), v, role);
            return v;
        },

        // Create and open dialog with a controller if not already cached.
        openDialogController: function (ctrlName, Controller, options, extra) {
            this.openViewController(ctrlName, Controller, options, extra, 'dialog');
        },

        // Change to the given page.
        changePage: function (pageName, page, role) {
            // Extends Views
            // Create JQuery Mobile Page
            var isExistingPage = $('div[page-name=' + pageName.toLowerCase() + ']');
            // Select the transition to apply.
            var t = this.selectTransition(pageName, role);
            // For already existing pages, only delegate events so they can handle
            // onPageBeforeShow and onPageShow.
            if (isExistingPage.length === 1) {
                page.delegateEvents();
                page.refresh();
            } else {
                // Create the page, store its page name in an attribute
                // so it can be retrieved later.
                page.$el.attr('page-name', pageName.toLowerCase());
                page.$el.addClass('page-container');
                // Render it and add it in the DOM.
                page.render();
                $('body').append(page.$el);
            }
            // Perform transition using JQuery Mobile
            $.mobile.changePage(page.$el, {
                changeHash:    false,
                transition:    t.transition,
                reverse:       t.reverse,
                role:          role,
                pageContainer: page.$el
            });
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
        // It's context dependant, meaning this method remembers the currently viewed
        // view and determine the transition accordingly.
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

}).call(this);
