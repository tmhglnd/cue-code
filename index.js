
const socket = io();

socket.on('connected', (id) => {
	console.log(`Connected to server with id: ${id}`);
});

let gridheight = 250;
let gridWidth = 200;

let regions = [];
let transport;
let editor;

// Initialize the P5 canvas for the timeline, timer and editor div
function setup(){
	// frameRate(60);
	createCanvas(windowWidth, windowHeight);
	document.body.id = 'main';

	// create an instance of the Transport and Editor
	transport = new Transport();
	editor = new Editor();
}

// Refresh and draw the timeline and regions 
// Draw the playhead and progress it in time based on milliseconds
// Trigger a region if the playhead passes it
function draw(){
	background('black');
	
	// draw the grid and progress the playhead when playing
	transport.grid();
	transport.progress();
	
	// if running check for triggering the code regions
	regions.forEach(region => {
		if (transport.running){
			region.play(transport.position);
		}
		region.draw();
	});

	// draw everything else
	transport.playhead();
	transport.timestamp();
	editor.display();
}

// Various actions for when clicking with the mouse in the timeline
function mousePressed(){
	// Add one/multiple regions from a file with Shift + Click
	if (keyIsDown(SHIFT)){
		let input = document.createElement('input');
		input.style.display = 'none';
		input.type = 'file';
		input.multiple = true;
		input.onchange = (e) => {
			for (let i = 0; i < e.target.files.length; i++){
				let read = new FileReader();
				read.onload = (f) => {
					let pos = transport.pixelToMs(mouseY + i * 100);
					regions.push(new Region(pos, f.target.result, transport));
				};
				read.readAsText(e.target.files[i]);
			}
		}
		input.click();
	}

	// Add an empty region with Option + Click
	else if (keyIsDown(OPTION)){
		let pos = transport.pixelToMs(mouseY);
		regions.push(new Region(pos, '', transport));
	}

	// Select a region with the mouse to edit the code or move it by dragging
	else {
		regions.forEach(r => r.selected = false);
		for (let r = regions.length-1; r >= 0; r--){
			if (regions[r].select()) {
				editor.swapDoc(regions[r].code);
				return;
			}
		}
	}
}

function mouseDragged(){
	// if the mouse is dragged and a region is selected, move it
	regions.forEach(r => r.move());
	// transport.movePlayHead();
}

function mouseWheel(event){
	// if the mouse is scrolling and within the transport grid, move focus
	if (mouseX > 0 && mouseX < gridWidth){
		transport.moveFocus(event.deltaY);
	}
}

// Various actions based on when keys are pressed
function keyPressed(){
	// if not focused in the main document or timeline, return
	if (document.activeElement.id !== 'main') { return; }

	// use SPACE to resume/pause the playhead
	else if (keyCode === 32){
		if (transport.running){ 
			transport.stop();
		} else {
			transport.start();
		}
	}

	// use W to return to the beginning
	else if (key === 'w'){
		transport.position = 0;
	}
	// use CTRL + to zoom in on the timeline
	else if (keyIsDown(CONTROL) && key === '='){
		transport.zoomIn();
	}
	// use CTRL - to zoom out on the timeline
	else if (keyIsDown(CONTROL) && key === '-'){
		transport.zoomOut();
	}
	// use S to export the session as a JSON file
	else if (keyIsDown(CONTROL) && key === 's'){
		exportSession();
	}

	// console.log(key);
}

// resize the canvas when the window is resized
function windowResized(){
	resizeCanvas(windowWidth, windowHeight);
}

// a wrapping utility funtion
function wrap(a, lo, hi){
	let r = hi - lo;
	return ((((a - lo) % r) + r) % r) + lo;
}

// get all the info from the transport and regions
// export all the info as a JSON file and store to downloads
function exportSession(){
	let file = {
		zoom: transport.zoomlevel,
		// tempo: 100,
		regions: []
	};

	regions.forEach((r) => {
		file.regions.push(r.getJSON());
	});

	console.log(file);

	// new File([this.cm.getValue()], `${f}.txt`, { type: 'text/plain;charset=utf-8' })
}

// import a session from a json file into the editor
// clear the current session, removing all current regions
function importSession(){
	return;
}

// the global transport is a infinte scrollable timeline with a playhead
// it can be started/paused, zoomed in/out, scrolled through
// it displays the current time in min:sec.ms
// it has a method to convert from pixel location to milliseconds and vice versa
class Transport {
	constructor(){
		this.position = 0;
		this.running = false;
		this.startTime = 0;
		this.prevTime = 0;

		this.zoomlevel = 25;
		this.focus = 0;
	}

	start(){
		this.running = true;
		this.prevTime = millis();
	}

	stop(){
		this.running = false;
		// socket.emit('silence', true);
	}

	progress(){
		if (this.running){
			this.position += (millis() - this.prevTime);
			this.prevTime = millis();
		}
	}

	playhead(){
		strokeWeight(5);
		stroke('red');
		line(0, this.position / this.zoomlevel - this.focus, gridWidth, this.position / this.zoomlevel - this.focus);
	}

	// movePlayHead(){
	// 	if (mouseX > 0 && mouseX < gridWidth && mouseY < this.position + 2 && mouseY > this.position - 2){
	// 		this.position = mouseY;
	// 	}
	// }

	zoomIn(){
		this.zoomlevel = Math.max(1, this.zoomlevel - 1);
	}

	zoomOut(){
		this.zoomlevel++;
	}

	moveFocus(delta){
		this.focus = Math.min(10000, Math.max(0, this.focus + delta * 0.5));
	}

 	grid(){
		let stepsize = 1000 / this.zoomlevel;
		let numlines = Math.ceil(height / stepsize);

		for (let l = 0; l < numlines; l++){
			let p = wrap(l * stepsize - this.focus, 0, numlines * stepsize);
			strokeWeight(1);
			stroke('darkgrey');
			line(0, p, gridWidth, p);
		}
	}

	timestamp(){
		noStroke();
		fill('white');
		textFont('courier new');
		
		textAlign(RIGHT, TOP);
		textSize(32);

		let ms = (Math.floor(this.position % 1000)).toString().padStart(3, 0);
		let sec = (Math.floor((this.position / 1000) % 60)).toString().padStart(2, 0);
		let min = (Math.floor(this.position / 60000)).toString().padStart(2, 0);
		text(`${min}:${sec}.${ms}`, width - 10, 10);
	}

	pixelToMs(y){
		return (y + this.focus) * this.zoomlevel; 
	}

	msToPixel(ms){
		return ms / this.zoomlevel - this.focus; 
	}
}

// A region is a single block of code. The code can be editted in the editor
// when the region is selected by clicking.
// The region can be moved by click/dragging it over the timeline
// It is also connected to the global transport so it knows when to play
class Region {
	constructor(t=0, txt='', transport){
		this.id = Math.floor(Math.random() * 10000);

		this.x = 0;
		this.y = 0;
		this.time = t;
		this.w = gridWidth;
		this.h = 50;
		// this.h = gridheight;
		this.selected = false;
		this.selectionOffset = [ 0, 0 ];
		this.isPlaying = false;
		this._playhead = -1;

		this.code = CodeMirror.Doc(txt, 'javascript');
		this.transport = transport;
	}

	draw(){
		// convert the time to a y location
		this.y = this.transport.msToPixel(this.time);

		// only draw the region and flash if within the limits of the screen
		if (this.y + this.h >= 0 && this.y < height){
			stroke('black');
			strokeWeight(1);
			// noStroke();
			fill('grey');
			if (this.selected){
				strokeWeight(3);
				stroke('white');
				// fill('lightgrey');
			}
			rect(this.x, this.y, this.w, this.h);
			// display a flashing white image when the region is triggered
			if (this.isPlaying > 0){
				fill(255, 255, 255, this.isPlaying * 255);
				rect(this.x, this.y, this.w, this.h);
				this.isPlaying -= 0.02;
			}
		}
	}

	play(playhead){
		// if the playhead was before the time of the region, and
		// then moved over the time or equal to the time, trigger the play
		if (this._playhead < this.time && playhead >= this.time){
			this.isPlaying = 1;
			socket.emit('eval', this.code.getValue());
			editor.swapDoc(this.code);
			console.log('eval:', this.getJSON());
		}
		this._playhead = playhead;
	}

	move(){
		// move the region when selected, clamp below 0 to 0
		if (this.selected){
			this.time = Math.max(0, this.transport.pixelToMs(mouseY - this.selectionOffset[1]));
		}
	}

	select(){
		// check if the region is selected and where it was selected
		this.selected = this.inboundsX(mouseX) && this.inboundsY(mouseY);
		this.selectionOffset = [ mouseX - this.x, mouseY - this.y ];
		return this.selected;
	}

	inboundsX(x){
		return x > this.x && x < this.x + this.w;
	}

	inboundsY(y){
		return y > this.y && y < this.y + this.h;
	}

	getJSON(){
		return {
			time: this.time,
			code: this.code.getValue()
		}
	}
}

// The editor is a made with the CodeMirror5 library
// it is displayed in a div created in P5 and added to the canvas
// the document of the editor is swapped based on the selected region
class Editor {
	constructor(){
		this.editor = createElement('div');
		this.editor.style('color', 'white');
		this.editor.style('z-index', 1000);
		this.editor.id('editor');
		
		// initialize the codemirror editor with some settings
		this.cm = CodeMirror(document.getElementById('editor'), {
			lineNumbers: true,
			theme: 'gruvbox-dark',
			mode: 'javascript',
			value: ''
		});
	}

	display(){
		this.editor.position(gridWidth, 50);
		this.editor.size(width - gridWidth);
		this.cm.setSize('100%', height);
	}

	setValue(t){
		this.cm.setValue(t);
	}

	getValue(){
		return this.cm.getValue();
	}

	swapDoc(doc){
		// this method swaps the connected document of the editor
		// based on the selected region
		this.cm.swapDoc(doc);
	}
}