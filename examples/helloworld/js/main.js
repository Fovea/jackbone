(function () {

    var HelloView = Jackbone.View.extend({
        render: function () {
            this.$el.html('<h1>Hello</h1>');
            this.$el.append('<input route="world" type="button" value="World">');
            this.$el.append('<input route="dummy" type="button" value="Dum Dum">');
        }
    });

    var WorldView = Jackbone.View.extend({
        render: function () {
            this.$el.html('<h1>World</h1>');
            this.$el.append('<input route="hello" type="button" value="Hello">');
            this.$el.append('<input route="dummy" type="button" value="Dum Dum">');
        }
    });

    var DummyView = Jackbone.View.extend({
        render: function () {
            this.$el.html('<h1>Dummy</h1>');
            this.$el.append('<p>I am a freaking dummy dialog.</p>');
            this.$el.append('<input route="back" type="button" value="OK">');
        }
    });

    var MyRouter = Jackbone.Router.extend({
        routes: {
        // Pages
        '':      'hello',
        'hello': 'hello',
        'world': 'world',
        'dummy': 'dummy',
        // Default - catch all
        '*actions': 'defaultAction'
        },
        hello: function () {
            this.openView({name: 'Hello', Class: HelloView});
        },
        world: function () {
            this.openView({name: 'World', Class: WorldView});
        },
        dummy: function () {
            this.openDialog({name: 'Dummy', Class: DummyView});
        }
    });

    $(document).ready(function() {
        var router = new MyRouter();
        Jackbone.history.start();
        router.goto('hello');
    });

}).call(this);
