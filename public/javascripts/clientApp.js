$(document).ready(init());

function init() {
	$('#myModal').modal({
		keyboard: true
	});

	socket();
	// testing / development, production will have these value set druing login.
	//CookieManager.setValue("username", "matthewborden");
}

function socket() {
  var socket = io.connect('http://localhost');
  socket.on('sendData', function (data) {
    console.log(data);
    socket.emit('my other event', { my: Math.pow(10,120) });
  });
}