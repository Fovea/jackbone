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
        bindEvents: function () {
            this.listenTo(this.collection, 'all', this.refresh);
        },
        render: function () {
            var template = _.template($('#list-template').html());
            this.$el.html(template());
            if (!this.options.addItem) {
                this.$('#text-new-todo').remove();
            }
            return this;
        },
        update: {
            // Change a row
            setLi: function($li, model) {
                $li.attr('todo-cid', model.cid);
                $li.toggleClass('todo-done', model.done);
                $li.text(model.title);
            },
            // Create a row
            newLi: function(model) {
                var $li = $('<li data-icon="false"></li>');
                this.setLi($li,model);
                return $li;
            }
        },
        refresh: _.debounce(function () {
            Jackbone.Listview.update(this.$('ul.todo-list'), this.collection, this.update);
            this.$('a[route=' + this.options.route + ']').addClass('ui-btn-active');
            console.log('refresh');
        }, 25),
        onPageBeforeShow: function () {
            // this.refresh();
            this.options.refreshModel();
        },
        events: {
            'vclick': 'defaultEvent',
            'vclick ul.todo-list': 'clickDelegate',
            'keypress #text-new-todo': 'submitNewTodo'
        },
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

    var FullListController = Jackbone.Controller.extend({
        initialize: function() {
            this.addOptions();
            this.view = new TodoListView(this.options);
        },
        addOptions: function () {
            this.options.route = 'list';
            this.options.collection = todos;
            this.options.toggleItem = _.bind(this.toggleItem, this);
            this.options.addItem = _.bind(this.addItem, this);
            this.options.refreshModel = _.bind(this.refreshModel, this);
        },
        toggleItem: function(cid) {
            todos.get(cid).toggle({success: this.options.refreshModel});
        },
        addItem: function(title) {
            todos.create({title: val}, {success: this.options.refreshModel});
        },
        refreshModel: function () {}
    });

    var DoneListController = FullListController.extend({
        addOptions: function() {
            this.options.route = 'done';
            this.options.collection = new TodoList(todos.done());
            this.options.toggleItem = _.bind(this.toggleItem, this);
            this.options.refreshModel = _.bind(this.refreshModel, this);
        },
        refreshModel: function () {
            this.options.collection.reset(todos.done());
        }
    });

    var TodoListController = FullListController.extend({
        addOptions: function() {
            this.options.route = 'todo';
            this.options.collection = new TodoList(todos.remaining());
            this.options.toggleItem = _.bind(this.toggleItem, this);
            this.options.addItem = _.bind(this.addItem, this);
            this.options.refreshModel = _.bind(this.refreshModel, this);
        },
        refreshModel: function () {
            this.options.collection.reset(todos.remaining());
        }
    });

    var AboutView = Jackbone.View.extend({
        render: function () {
            this.$el.html('<h1>About</h1>');
            this.$el.append('<p>Todo is an example JQuery Mobile application.</p>');
            this.$el.append('<input route="list" type="button" value="OK">');
        }
    });

    var MyRouter = Jackbone.Router.extend({
        routes: {
            // Pages
            '':         'openList',
            'list':     'openList',
            'done':     'openDoneList',
            'todo':     'openTodoList',
            'todo?:id': 'openTodo',
            'about':    'openAbout',
            // Default - catch all
            '*actions': 'defaultAction'
        },
        openAbout: function () {
            this.openDialog('About', AboutView, {});
        },
        openList: function () {
            this.openViewController('List', FullListController, {});
        },
        openDoneList: function () {
            this.openViewController('Done', DoneListController, {});
        },
        openTodoList: function () {
            this.openViewController('Todo', TodoListController, {});
        },
        openTodo: function (id) {
            // this.openView('Dummy', TodoItemView, {});
        }
    });

    $(document).ready(function() {
        var router = new MyRouter();
        Jackbone.history.start();
        router.goto('list');
    });

}).call(this);
