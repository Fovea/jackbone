(function () {

    var MyView = Jackbone.View.extend({
        render: function () {
            this.$el.html('<h1 id="myview">MyView</h1>');
        }
    });

    var MyRouter = Jackbone.Router.extend({
        routes: {
        // Pages
        '':      'myview',
        'myview': 'myview',
        // Default - catch all
        '*actions': 'defaultAction'
        },
        myview: function () {
            this.openView({name: 'MyView', Class: MyView});
        },
    });

    $(document).ready(function () {
        var router = new MyRouter();
        Jackbone.history.start();
        router.goto('myview');

        test("Initialization test", function (test) {
            TestChain.init();
            TestChain.add(0,0, function () { ok($('h1#myview').length == 1, "Passed!"); }, 1);
            TestChain.start();
        });
    });

}).call(this);
