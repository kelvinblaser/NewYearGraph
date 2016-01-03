var graph = {};
/****************************************
		Initialize 
****************************************/
// Get view element width and height
graph.view_el = document.getElementsByClassName('view')[0];
rect = graph.view_el.getBoundingClientRect();
graph.width = (rect.width-2);  // Subtract 2 to account for 
graph.height = (rect.height-2);// border width.

// Set initial zoom and zoom parameters
graph.zoom = 1.0;
graph.zoom_factor = Math.pow(2.0,1.0/12); // Very Musical
graph.zoom_max = 16.0;
graph.zoom_min = 0.5;

// Offset tells where to place the image relative to the view window.
graph.offset = {};  
if (graph.width > graph.height) {
	graph.offset.x = (graph.width-graph.height)/2;
	graph.offset.y = 0;
}
else {
	graph.offset.x = 0;
	graph.offset.y = (graph.height-graph.width)/2;
}

// Pan and zoom parameters used in event handlers
graph.mouseDown = false;
graph.delta_min = 2;

/*****************************************************
  Generate the Graph
		Vertices and Edges will be stored as points in a 
		1x1 square in the first quadrant.  They will then 
		be properly scaled and offset when drawn in the 
		view element by graph.draw
*****************************************************/
/* Create Vertices */
graph.num_vertices = 64;  // Could make this interactive with a form?
graph.make_vertices = function () {
	var rad = 2*Math.PI / this.num_vertices;
	this.vertices = [];
	for(i = 0; i < this.num_vertices; i++) {
		v = {};
		v.x = 0.49*Math.cos(rad * i)+0.5;
		v.y = 0.49*Math.sin(rad * i)+0.5;
		this.vertices.push(v);
	}
}
graph.make_vertices();

/* Create Lines */
graph.make_lines = function () {
	this.lines = [];
	v = this.vertices;
	for (i = 0; i < this.num_vertices; i++) {
		for (j = 0; j < i; j++) {
			var line = {};
			line.x1 = v[i].x;
			line.y1 = v[i].y;
			line.x2 = v[j].x;
			line.y2 = v[j].y;
			this.lines.push(line);
		}
	}
}
graph.make_lines();

/****************************************
		Create SVG image 
****************************************/
graph.draw = function () {
	// Calculate conversions
	rect = graph.view_el.getBoundingClientRect(); // In case size of view_el has changed
	this.width = (rect.width-2);  // Subtract 2 to account for 
	this.height = (rect.height-2);// border width.
	var conv_factor = Math.min(this.width, this.height) * this.zoom;

	// start svg msg
	var msg = '<svg width="' + this.width +
						'" height="' + this.height + '">';
	
	// add vertices
	for (i = 0; i < this.vertices.length; i++) {
		vert = this.vertices[i];
		var x = vert.x*conv_factor + this.offset.x;
		var y = vert.y*conv_factor + this.offset.y;
		msg += '<circle cx="' + x + 
					 '" cy="' + y + 
					 '" r="5" fill="black" stroke-width="1" />';
	}
	// add lines (edges)
	for (i = 0; i < this.lines.length; i++) {
		line = this.lines[i];
		var x1 = line.x1*conv_factor + this.offset.x;
		var y1 = line.y1*conv_factor + this.offset.y;
		var x2 = line.x2*conv_factor + this.offset.x;
		var y2 = line.y2*conv_factor + this.offset.y;
		msg += '<line x1="' + x1 + 
					 '" y1="' + y1 +
					 '" x2="' + x2 +
					 '" y2="' + y2 + 
					 '" stroke="black" stroke-width="1" />';
	} 
	
	// end svg
	msg += '</svg>'
	// embed svg in HTML
	graph.view_el.innerHTML = msg;
}
graph.draw();

/************************************************
	Pan and Zoom Event Handlers
		Panning and zooming are done by changing 
		graph.zoom and graph.offset, then redrawing
		the svg.  Zooms are done in such a way as to
		make the mouse position a fixed point in the 
		image.
************************************************/
graph.zoom_in = function (x,y) {
	// Don't zoom if zoomed too far
	if (graph.zoom > graph.zoom_max) {
		return;
	}
	// x and y are mouse locations relative to the view window
	graph.zoom *= graph.zoom_factor;
	graph.offset.x = (graph.offset.x - x)*graph.zoom_factor + x;
	graph.offset.y = (graph.offset.y - y)*graph.zoom_factor + y;
	graph.draw();
}

graph.zoom_out = function(x,y) {
	// Don't zoom if zoomed too far
	if (graph.zoom < graph.zoom_min) {
		return;
	}
	// x and y are mouse locations relative to the view window
	graph.zoom /= graph.zoom_factor;
	graph.offset.x = (graph.offset.x - x)/graph.zoom_factor + x;
	graph.offset.y = (graph.offset.y - y)/graph.zoom_factor + y;
	graph.draw();
}

function MouseWheelHandler(e) {
	e.preventDefault();
	var rect = graph.view_el.getBoundingClientRect();
	var x = e.clientX - rect.left;
	var y = e.clientY - rect.top;
	if (e.deltaY < 0) {
		graph.zoom_in(x, y);
	}
	else {
		graph.zoom_out(x, y);
	}
	return false;
}

/* Click and Drag - Next 3 functions */
function MouseDownHandler(e) {
	e.preventDefault();
	var rect = graph.view_el.getBoundingClientRect();
	graph.mouseDown = true;
	graph.view_el.style.cursor = 'default';
	graph.view_el.style.cursor = 'move';
	graph.panX = e.clientX - rect.left;
	graph.panY = e.clientY - rect.top;
	return false;
}

function MouseMoveHandler(e) {
	if (!graph.mouseDown) {
		return false;
	}
	if (Math.abs(e.offsetX - graph.panX) >= graph.delta_min ||
			Math.abs(e.offsetY - graph.panY) >= graph.delta_min) {
		var rect = graph.view_el.getBoundingClientRect();
		var x = e.clientX - rect.left;
		var y = e.clientY - rect.top;
		graph.offset.x += x - graph.panX;
		graph.offset.y += y - graph.panY;
		graph.panX = x;
		graph.panY = y;
		graph.draw();
	}
	return false;
}

function MouseUpHandler(e) {
	if (graph.mouseDown) {
		var rect = graph.view_el.getBoundingClientRect();
		var x = e.clientX - rect.left;
		var y = e.clientY - rect.top;
		graph.offset.x += x - graph.panX;
		graph.offset.y += y - graph.panY;
		graph.mouseDown = false;
		graph.view_el.style.cursor = 'default';
		graph.view_el.style.cursor = 'grab';
		graph.draw();
	}
	return false;
}

// This is my attempt at addressing browser compatibility.
// If your browser doesn't render the svg or handle pan and zoom
// events, get a new browser.
if (graph.view_el.addEventListener) {
	graph.view_el.addEventListener('wheel', MouseWheelHandler);
	graph.view_el.addEventListener('mousedown', MouseDownHandler);
	document.addEventListener('mousemove', MouseMoveHandler);
	document.addEventListener('mouseup', MouseUpHandler);
}
else {
	graph.view_el.onwheel = MouseWheelHandler;
	graph.view_el.onmousedown = MouseDownHandler;
	document.onmousemove = MouseMoveHandler;
	document.onmouseup = MouseUpHandler;
}