var cluster = require('cluster');

require('strong-cluster-connect-store').setup();

cluster.setupMaster({
	exec: 'server.js'
});

var cpus = 1;
for (var i = 0; i < cpus; i++) {
	cluster.fork();
}

cluster.on('online', function(worker) {
	console.log('worker ' + worker.process.pid + ' started.');
});

cluster.on('exit', function(worker, code, signal) {
	console.log('worker ' + worker.process.pid + ' died');
	cluster.fork();
});

