(function () {

    var HelloView = Jackbone.View.extend({
        render: function () {
            this.$el.html('<h1>Hello</h1>');
            this.$el.append('<input route="world" type="button" value="World">');
        }
    });

    var WorldView = Jackbone.View.extend({
        render: function () {
            this.$el.html('<h1>World</h1>');
            this.$el.append('<input route="hello" type="button" value="Hello">');
        }
    });

    var MyRouter = Jackbone.Router.extend({
        routes: {
        // Pages
        '':      'hello',
        'hello': 'hello',
        'world': 'world',
        // Default - catch all
        '*actions': 'defaultAction'
        },
        hello: function () {
            this.openView('Hello', HelloView, {});
        },
        world: function () {
            this.openView('World', WorldView, {});
        }
    });

    $(document).ready(function () {
        var router = new MyRouter();
        Jackbone.history.start();
        router.goto('hello');
    });

}).call(this);
