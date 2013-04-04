(function () {

    var HelloView = Jackbone.View.extends({
        render: function () {
            this.$el.html('<h1>Hello</h1>');
            this.$el.append('<input route="world" type="button">Next</input>');
        },
        events {
            'vclick': 'defaultEvent'
        }
    });

    var WorldView = Jackbone.View.extends({
        render: function () {
            this.$el.html('<h1>World</h1>');
            this.$el.append('<input route="hello" type="button">Back</input>');
        },
        events {
            'vclick': 'defaultEvent'
        }
    });

    var MyRouter = Jackbone.Router.extends({
        routes: {
        // Pages
        '':      'hello',
        'hello': 'hello',
        'world': 'world',
        // Default - catch all
        '*actions': 'defaultAction'
        },
        hello: function () {
            router.addView('Hello', HelloView, {});
        },
        world: function () {
            router.addView('World', WorldView, {});
        }
    });
    var router = new MyRouter();
    Jackbone.history.start();
    router.goto('hello');

}).call(this);
