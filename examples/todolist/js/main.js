(function () {

    // Todo Model
    // ----------

    // Our basic **Todo** model has `title`, `order`, and `done` attributes.
    var Todo = Backbone.Model.extend({
        // Default attributes for the todo item.
        defaults: function() {
            return {
                title: "empty todo...",
                order: todos.nextOrder(),
                done: false
            };
        },

        // Toggle the `done` state of this todo item.
        toggle: function(options) {
            this.save({done: !this.get("done")}, options);
        }
    });

    // Todo Collection
    // ---------------

    // The collection of todos is backed by *localStorage* instead of a remote
    // server.
    var TodoList = Backbone.Collection.extend({

        // Reference to this collection's model.
        model: Todo,

        // Use local storage...
        localStorage: new Backbone.LocalStorage("Todos"),

        // Filter down the list of all todo items that are finished.
        done: function() {
            return this.where({done: true});
        },

        // Filter down the list to only todo items that are still not finished.
        remaining: function() {
            return this.without.apply(this, this.done());
        },

        // We keep the Todos in sequential order, despite being saved by unordered
        // GUID in the database. This generates the next order number for new items.
        nextOrder: function() {
            if (!this.length) return 1;
            return this.last().get('order') + 1;
        },

        // Todos are sorted by their original insertion order.
        comparator: 'order'
    });

    // Create our global collection of **Todos**.
    todos = new TodoList();
    todos.fetch();

    // List of Todo elements.
    var TodoListView = Jackbone.View.extend({

        // Listen to change made to the collection
        bindEvents: function () {
            this.listenTo(this.collection, 'all', this.refresh);
            this.listenTo(this.collection, 'reset', this.refresh);
        },

        // Render to the DOM element
        render: function () {
            var template = _.template($('#list-template').html());
            this.$el.html(template());
            // If no "addItem" callback has been provided, hide the text input.
            if (!this.options.addItem) {
                this.$('#text-new-todo').remove();
            }
            return this;
        },

        // List updater provides the two methods needed by `Jackbone.Listview`
        // to refresh a JQuery Mobile listview from a collection.
        listUpdater: {
            // Change a row in the list
            setLi: function($li, model) {
                $li.attr('todo-cid', model.cid);
                $li.toggleClass('todo-done', model.done);
                $li.text(model.title);
            },
            // Create new a row for the list
            newLi: function(model) {
                var $li = $('<li data-icon="false"></li>');
                this.setLi($li,model);
                return $li;
            }
        },

        // Refresh a already rendered view. Debounced so multiple close call to `refresh`
        // won't perform multiple unneeded refreshes.
        refresh: _.debounce(function () {
            Jackbone.Listview.update(this.$('ul.todo-list'), this.collection, this.listUpdater);
            this.$('a[route=' + this.options.route + ']').addClass('ui-btn-active');
        }, 25),

        // Before the page appears, refresh the model.
        onPageBeforeShow: function () {
            this.refresh();
            this.options.refreshModel();
        },

        // Delegated events
        events: {
            'vclick': 'defaultEvent', // Default Jackbone events handler
            'vclick ul.todo-list': 'clickDelegate', // Clicks on the listview
            'keypress #text-new-todo': 'submitNewTodo' // Submit when *Enter* is pressed.
        },

        // A new **Todo** is added to the collection when *Enter* is pressed.
        // Calls Controller's `addItem` method and empty the input field.
        submitNewTodo: function (e) {
            if (e.keyCode !== 13) return;
            e.preventDefault();
            var $input = $(e.target);
            var val = $input.val();
            if (val) {
                $input.val('');
                this.options.addItem(val);
            }
        },

        // Handles click on the listview
        // Retrieves the cid of the object, calls Controller's `toggleItem` method
        // if the clicked element contains a valid `todo-cid`.
        clickDelegate: function (e) {
            if (e && e.preventDefault) e.preventDefault();
            var $el = $(e.target);
            var cid = $el.attr('todo-cid');
            if (cid) {
                this.options.toggleItem(cid);
            }
            return false;
        }
    });

    // Controller for the full list of **Todos**
    var FullListController = Jackbone.Controller.extend({
                                                        
        // Initialize has to setup `this.options` and create the View.
        initialize: function() {
            this.addOptions();
            this.view = new TodoListView(this.options);
        },

        // Add the options specific to this controller,
        // Overloaded by specialized versions of this controller.
        addOptions: function () {
            this.options.route = 'list';
            this.options.collection = todos;
            this.options.toggleItem = _.bind(this.toggleItem, this);
            this.options.addItem = _.bind(this.addItem, this);
            this.options.refreshModel = _.bind(this.refreshModel, this);
        },

        // Toggle 'done' status of Todo item with the given `cid`,
        // then refreshes the model.
        toggleItem: function(cid) {
            todos.get(cid).toggle({success: this.options.refreshModel});
        },

        // Add an item to the **Todos**,
        // then refreshes the model.
        addItem: function(title) {
            todos.create({title: title}, {success: this.options.refreshModel});
        },

        // Nothing to do to refresh our model, as it's the full list of Todos.
        // Overloaded by specialized versions of this controller.
        refreshModel: function () {}
    });

    // Controller than shows the list of "Done" items.
    var DoneListController = FullListController.extend({

        // No `addItem` here, collection is a subset of todos,
        // as returned by `todos.done()`
        addOptions: function() {
            this.options.route = 'done';
            this.options.collection = new TodoList(todos.done());
            this.options.toggleItem = _.bind(this.toggleItem, this);
            this.options.refreshModel = _.bind(this.refreshModel, this);
        },

        // Reload the list of done todo items.
        refreshModel: function () {
            this.options.collection.reset(todos.done());
        }
    });

    // Controller than shows the list of "Not-Done" items.
    var TodoListController = FullListController.extend({

        // Collection is a subset of todos, as returned by `todos.remaining()`
        addOptions: function() {
            this.options.route = 'todo';
            this.options.collection = new TodoList(todos.remaining());
            this.options.toggleItem = _.bind(this.toggleItem, this);
            this.options.addItem = _.bind(this.addItem, this);
            this.options.refreshModel = _.bind(this.refreshModel, this);
        },

        // Reload the list of remaining todo items.
        refreshModel: function () {
            this.options.collection.reset(todos.remaining());
        }
    });

    // A very simple view without a controller.
    var AboutView = Jackbone.View.extend({
        render: function () {
            this.$el.html('<h1>About</h1>');
            this.$el.append('<p>Todo is an example JQuery Mobile application.</p>');
            this.$el.append('<input route="list" type="button" value="OK">');
        }
    });

    // Extend `Jackbone.Router` to add our own custom routes.
    var MyRouter = Jackbone.Router.extend({
        routes: {
            '':         'openList',
            'list':     'openList',
            'done':     'openDoneList',
            'todo':     'openTodoList',
            'about':    'openAbout',
            // Default - catch all
            '*actions': 'defaultAction'
        },
        openAbout: function () {
            this.openDialog({name: 'About', Class: AboutView});
        },
        openList: function () {
            this.openViewController({name: 'List', Class: FullListController});
        },
        openDoneList: function () {
            this.openViewController({name: 'Done', Class: DoneListController});
        },
        openTodoList: function () {
            this.openViewController({name: 'Todo', Class: TodoListController});
        }
    });

    // Initialize when ready.
    $(document).ready(function() {
        var router = new MyRouter();
        Jackbone.history.start();
        router.goto('list');
    });

}).call(this);
