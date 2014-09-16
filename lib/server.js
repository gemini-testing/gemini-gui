'use strict';
var path = require('path'),
    express = require('express'),
    bodyParser = require('body-parser'),
    exphbs  = require('express-handlebars'),
    q = require('q'),

    App = require('./app');

exports.start = function(options) {
    var app = new App();
    return app.load(options)
        .then(function() {
            var server = express();
            server.engine('.hbs', exphbs({
                extname: '.hbs',
                partialsDir: path.join(__dirname, 'views', 'partials')
            }));

            server.set('view engine', '.hbs');
            server.set('views', path.join(__dirname, 'views'));

            server.use(bodyParser.json());
            server.use(express.static(path.join(__dirname, 'static')));
            server.use(App.refPrefix, express.static(app.referenceDir));
            server.use(App.currentPrefix, express.static(app.currentDir));
            server.use(App.diffPrefix, express.static(app.diffDir));

            server.get('/', function(req, res) {
                app.readTests(options.testFiles)
                    .then(function(suites) {
                        res.render('main', {
                            suites: suites
                        });
                    })
                    .catch(function(e) {
                        res.status(500).send(e.stack);
                    });
            });

            server.get('/events', function(req, res) {
                res.writeHead(200, {'Content-Type': 'text/event-stream'});

                app.addClient(res);
            });

            server.post('/run', function(req, res) {
                app.run(options.testFiles).done();
                res.send({status: 'ok'});
            });

            server.post('/update-ref', function(req, res) {
                app.updateReferenceImage(req.body)
                    .done(function(referenceURL) {
                        res.send({referenceURL: referenceURL});
                    }, function(error) {
                        res.status(500);
                        res.send({error: error.message});
                    });
            });

            return q.nfcall(server.listen.bind(server), options.port, 'localhost')
                .then(function() {
                    return {
                        url: 'http://localhost:' + options.port
                    };
                });
        });
};
