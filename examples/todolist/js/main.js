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
        toggle: function() {
            this.save({done: !this.get("done")});
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
            this.listenTo(todos, 'change', this.refresh);
        },
        render: function () {
            var template = _.template($('#list-template').html());
            this.$el.html(template());
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
        refresh: function () {
            Jackbone.Listview.update(this.$('ul'), todos, this.update);
        },
        events: {
            'vclick': 'clickDelegate', // Keep using default event handler.
            'keypress #text-new-todo': 'submitNewTodo'
        },
        submitNewTodo: function (e) {
            if (e.keyCode != 13) return;
            e.preventDefault();
            var $input = $(e.target);
            var val = $input.val();
            if (val) {
                $input.val('');
                todos.create({title: val});
            }
        },
        clickDelegate: function (e) {
            if (e && e.preventDefault) e.preventDefault();
            var $el = $(e.target);
            var cid = $el.attr('todo-cid');
            if (cid) {
                todos.get(cid).toggle();
                return true;
            }
            return this.defaultEvent(e);
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
            'todo?:id': 'openTodo',
            'about':    'openAbout',
            // Default - catch all
            '*actions': 'defaultAction'
        },
        openAbout: function () {
            this.openDialog('About', AboutView, {});
        },
        openList: function () {
            this.openView('List', TodoListView, {});
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
