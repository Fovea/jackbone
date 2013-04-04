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
        },
        setOptions: function (options) {
            this.options = options;
            if (options.back) {
                this.back = options.back;
            }
        }
    });

    // Jackbone.Header
    // ---------------
    var Header = Jackbone.Header = function (options) {
        Jackbone.View.apply(this, arguments);
        this.back = options.back;
    };
    _.extend(Header.prototype, Jackbone.View.prototype);

    // Jackbone.Footer
    // ---------------
    var Footer = Jackbone.Footer = function (options) {
        Jackbone.View.apply(this, arguments);
        this.back = options.back;
    };
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
        if (header) {
            header.content = content;
            header.footer  = footer;
            header.root    = this;
        }
        if (footer) {
            footer.content = content;
            footer.header  = header;
            footer.root    = this;
        }
        if (content) {
            content.header  = header;
            content.footer  = footer;
            content.root    = this;
        }
    };

    _.extend(JQMView.prototype, Backbone.View.prototype, {
        // Change options for header, footer and content.
        setOptions: function (options) {
            if (this.header)  this.header.setOptions(options);
            if (this.footer)  this.footer.setOptions(options);
            if (this.content) this.content.setOptions(options);
        },

        /** Default render. Sets header, content and footer. */
        render: function() {
            if (this.needRedraw) { // Controllers are responsible of setting needRedraw.
                // TODO: replace by an 'inlined' html for portability
                this.$el.html(Templates['page.html']());

                if (this.header) {
                    this.header.setElement(this.$('div[data-role=header]'));
                    // this.header.setTitle(this.content.title || '');
                    // this.header.setSubtitle(this.content.subtitle || '');
                    // this.header.setBack(this.content.back || {});
                    this.header.render();
                }

                if (this.footer) {
                    this.footer.setElement(this.$('div[data-role=footer]'));
                    this.footer.render();
                }
                else {
                    this.$('div[data-role=footer]').remove();
                    this.$('div[data-role=content]').css('bottom', '0');
                }

                this.content.setElement(this.$('div[data-role=content]'));
                this.content.render();

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
            'pagecreate':       '_onPageCreate',       // before jqm enhancement

            //'swiperight': 'triggerGoBack',
            //'swipeleft':  'triggerGoNext',
            // 'click':  'ignoreEvent' // Force vclick to be used, all click to be ignored.
        },
        // JQuery Mobile Hack
        _onPageBeforeHide: function() {
            if (this.content.onPageBeforeHide) this.content.onPageBeforeHide();
            this.clean();
        },
        _onPageHide: function() {
            this.undelegateEvents();
            if (this.content.onPageHide) this.content.onPageHide();
        },
        _onPageBeforeShow: function() {
            if (this.content.onPageBeforeShow) this.content.onPageBeforeShow();
            if (this.footer) this.footer.refresh();
            if (this.header) this.header.refresh();
            this.enable(); // Make sure the page isn't disabled.
        },
        _onPageShow: function() {
            this.setup();
            if (this.content.onPageShow) this.content.onPageShow();
        },
        _onPageBeforeCreate: function() {
            if (this.content.onPageBeforeCreate) this.content.onPageBeforeCreate();
        },
        _onPageCreate: function() {
            if (this.content.onPageCreate) this.content.onPageCreate();
        },
        ignoreEvent: function(e) {
            if (e && e.preventDefault) e.preventDefault();
            return false;
        },
        setup: function() {
            if (this.needSetup) {
                if (this.footer) {
                    this.footer.setup();
                }
                if (this.header) {
                    this.header.setup();
                }
                if (this.content.setup) this.content.setup();
                this.needSetup = false;
            }
        },
        clean: function() {
            if (!this.needSetup) {
                if (this.footer) this.footer.clean();
                if (this.header) this.header.clean();
                if (this.content.clean) this.content.clean();
                this.needSetup = true;
            }
        },

        refresh: function() {
            if (this.content.refresh) this.content.refresh();
            if (this.footer)          this.footer.refresh();
            if (this.header)          this.header.refresh();
        },

        disable: function() {
            this.$el.addClass('ui-disabled');
        },
        enable: function() {
            this.$el.removeClass('ui-disabled');
        },
    });

    // Theming Options
    // ---------------

    // Screens may include a default header.
    // It can be disabled globally by setting this to null
    // or per screen by passing the noHeader option to the
    // ViewManager.
    Jackbone.DefaultHeaderView = null;
    // Screens may include a default footer too.
    // It can be disabled globally by setting this to null
    // or per screen by passing the noFooter option to the
    // ViewManager.
    Jackbone.DefaultFooterView = null;

    // Jackbone.Controller
    // -------------------

    // For complex views that could be reused in different contexts
    // it's better to create one (or many) controller.
    // Views will only handle input/output, whereas controllers
    // will handle logic and interactions with models.


    // Jackbone.ViewManager
    // --------------------

    // Handles life and death of Views and Controllers
    var ViewManager = {
        views: {},
        controllers: {},
        currentController: null,

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
            // An existing view existed. Make sure it is clean.
            if (typeof this.views[pageUID] !== 'undefined') {
                view = this.views[pageUID];
                view.setOptions(options);
            } else {
                var noHeader = (options && options.noHeader) || (!Jackbone.DefaultHeader);
                var noFooter = (options && options.noFooter) || (!Jackbone.DefaultFooter);
                var content = new View(options);
                var header  = noHeader ? null : new DefaultHeader(options);
                var footer  = noFooter ? null : new DefaultFooter(options);
                view = new JQMView(header, content, footer);
                this.views[pageUID] = view;
                if (header == null) {
                    $(view.el).find("div[data-role=header]").css('display','none');
                    $(view.el).find("div[data-role=content]").css('top',0);
                }
                if (footer == null) {
                    $(view.el).find("div[data-role=footer]").css('display','none');
                    $(view.el).find("div[data-role=content]").css('bottom',0);
                }
            }
            this.currentController = null;
            return view;
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
            var v = ViewManager.create(viewName, View, options, extra);
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

}).call(this);
