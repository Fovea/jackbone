//     Jackbone.js 0.1.0

//     (c) 2013, Jean-Christophe Hoelt, Fovea.cc
//     Jackbone may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://jackbonejs.org
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
    Jackbone.VERSION = '0.1.0';

    // Require Backbone
    var Backbone = root.Backbone;
    if (!Jackbone.Backbone && (typeof require !== 'undefined')) {
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

    // Jackbone.Model
    // --------------

    // Jackbone **Models** are Backbone Models with a WebSQL backend.
    // Backbone.dbStorage required!

    var Model = Jackbone.Model = function (attributes, options) {
        Backbone.Model.apply(this, arguments);
        if (this.dbName && this.dbKey && this.dbColumns) {
            // This model will use dbStorage
            this.dbStorage = new Backbone.DBStorage(this.dbName, this.dbKey, this.dbColumns);
        }
    };

    _.extend(Model.prototype, Backbone.Model.prototype, {
    });

    // Jackbone.ViewManager
    // --------------------

    // Handles life and death of Views and Controllers
    var Vm = {
        views: {},
        controllers: {},
        currentController: null,

        createWithView: function (name, View, options, extra_options) {
            var pageUID = name + JSON.stringify(options);
            if (extra_options)
                options = _.extend(options, extra_options);
            // An existing view existed. Make sure it is clean.
            if(typeof views[pageUID] !== 'undefined') {
                var v = views[pageUID];
                if (options && options.backhash) {
                    v.content.back.hash = options.backhash;
                    if (v.header) v.header.back.hash = options.backhash;
                }
                if (options && v.content.changeOptions)
                    v.content.changeOptions(options);
                currentController = null;
                return v;
            }
            else {
                var content = new View(options);
                var header  = (options && options.noHeader) ? null : new Header();
                var footer  = ((options && options.noFooter) || Version.release) ? null : new Footer();
                var view    = new JQMView(header, content, footer);
                views[pageUID] = view;
                Logger.setVmStats(cacheStats());
                if (options && options.backhash) {
                    content.back.hash = options.backhash;
                    if (header) header.back.hash = options.backhash;
                }
                if (header == null) {
                    $(view.el).find("div[data-role=header]").css('display','none');
                    $(view.el).find("div[data-role=content]").css('top',0);
                }
                if (footer == null) {
                    $(view.el).find("div[data-role=footer]").css('display','none');
                    $(view.el).find("div[data-role=content]").css('bottom',0);
                }
                currentController = null;
                return view;
            }
        }
    };

    // Jackbone.Router
    // ---------------
    var Router = Jackbone.Router = function (options) {
        Backbone.Router.apply(this, arguments);
        // First created router is the default router.
        if (!Jackbone.router) {
            Jackbone.router = this;
        }
    };

    // Used to generate page hash tag or HTML attribute.
    // by getPageName and getPageHash.
    var makePageName = function (separator, page, args) {
        var ret = page;
        if (typeof args !== 'undefined') {
            if (args && args.length) {
                if (args.length !== 0) {
                    ret = page + separator + args.join(separator);
                }
            } else {
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
        addView: function (viewName, View, options, extra) {
            var v = Vm.create(viewName, View, options, extra);
            this.changePage(viewName, v);
        },

        // Change to the given page.
        changePage: function (pageName, page, role) {
            // Extends Views
            // Create JQuery Mobile Page
            var isExistingPage = $('div[page-name=' + pageName.toLowerCase() + ']');
            var t = this.selectTransition(pageName, role);
            if (isExistingPage.length === 1) {
                page.delegateEvents();
            } else {
                // Create a page that should render quickly
                page.$el.attr('page-name', pageName.toLowerCase());
                page.$el.addClass('page-container');
                page.render();
                $('body').append(page.$el);
            }
            // Perform transition
            $.mobile.changePage(page.$el, {
                changeHash:    false,
                transition:    t.transition,
                reverse:       t.reverse,
                role:          role,
                pageContainer: page.$el
            });
            this.currentHash = Jackbone.history.getFragment();
        },

        transitions: {},
        selectTransition: function (pageName, role) {
            var lastPageName     = this.currentPageName || '';
            var lastPageRole     = this.currentPageRole || '';
            this.currentPageName = pageName;
            this.currentPageRole = role;

            // Transitions can be disabled from settings
            /* TODO
            if (Collections.settings.getSetting("UseTransitions", 'false') === 'false')
                return { transition: 'none', reverse: false };
            */

            // Dialogs will pop.
            if (role === 'dialog') {
                return { transition: 'pop', reverse: false };
            }
            if (lastPageRole === 'dialog') {
                return { transition: 'pop', reverse: true };
            }

            if (_(this.transitions).has(lastPageName + '-->' + pageName)) {
                return this.transitions[lastPageName + '-->' + pageName];
            }

            // Save the transition
            this.transitions[lastPageName + '-->' + pageName] = {
                transition: $.mobile.defaultPageTransition,
                reverse: false
            };
            this.transitions[pageName + '-->' + lastPageName] = {
                transition: $.mobile.defaultPageTransition,
                reverse: true
            };

            // Others just use default transition.
            return { transition: $.mobile.defaultPageTransition, reverse: false };
        }
    });

    // Jackbone.History
    // ----------------
    var history = Jackbone.history = Backbone.history;

    // Jackbone.View
    // -------------
    var View = Jackbone.View = function (options) {
        Backbone.View.apply(this, arguments);
    };

    _.extend(View.prototype, Backbone.View.prototype, {
        defaultEvent: function (e) {
            e.preventDefault();
            var $target = $(e.target);
            var route = $target.attr('route');
            Jackbone.router.goto(route);
            return false;
        }
    });

    var JQMView = ...;
    ...renderContent();
    ...content();

    // Jackbone.Controller
    // -------------------

    // For complex views that could be reused in different contexts
    // it's better to create one (or many) controller.
    // Views will only handle input/output, whereas controllers
    // will handle logic and interactions with models.

}).call(this);
