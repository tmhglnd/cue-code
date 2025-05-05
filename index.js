// 
// cue-code
// Sequentially evaluate code from a timeline
//
// written by Timo Hoogland (c) 2025
// www.timohoogland.com
// 
// GNU GPL v3 LICENSE
// 

const socket = io();

socket.on('connected', (id) => {
	console.log(`Connected to server with id: ${id}`);
});

let EDITOR_MODE = 'mercury';

let gridheight = 200;
let gridWidth = 200;

let regions = [];
let transport;
let editor;

let loadBtn;
let saveBtn;
let addBtn;
let fileBtn;

let colors = {
	background: 'black',
	accent: [255, 255, 255],
	contrast: 'red',
	primairy: 'darkgrey',
	secundairy: 'grey'
}

// Ask if user is sure to close or refresh and loose all code
// window.onbeforeunload = function() {
// 	return "The session may be lost if you refresh. Are you sure?";
// };

// Initialize the P5 canvas for the timeline, timer and editor div
function setup(){
	createCanvas(windowWidth, windowHeight);
	document.body.id = 'main';

	// create an instance of the Transport and Editor and display
	transport = new Transport();
	editor = new Editor();
	editor.display();

	addBtn = createButton('add region');
	addBtn.position(gridWidth, 0);
	addBtn.mousePressed(() => addRegion());

	fileBtn = createButton('add file');
	fileBtn.position(gridWidth + 100, 0);
	fileBtn.mousePressed(addFiles);

	saveBtn = createButton('save');
	saveBtn.position(gridWidth + 200, 0);
	saveBtn.mousePressed(downloadSession);

	loadBtn = createButton('load');
	loadBtn.position(gridWidth + 300, 0);
	loadBtn.mousePressed(loadSession);
}

// Refresh and draw the timeline and regions 
// Draw the playhead and progress it in time based on milliseconds
// Trigger a region if the playhead passes it
function draw(){
	background(colors.background);
	// background(editor.getStyle()['background-color']);
	
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
}

// Various actions for when clicking with the mouse in the timeline
function mousePressed(){
	// deselect all regions
	regions.forEach(r => r.selected = false);
	transport.selected = false;

	// if mouse is clicked outside timeline ignore
	if (mouseX < 0 || mouseX > gridWidth){ return; }

	// Add one/multiple regions from a file with Shift + Click
	if (keyIsDown(SHIFT)){
		addFiles();
	}

	// Add an empty region with Option + Click
	else if (keyIsDown(OPTION)){
		// let pos = transport.pixelToMs(mouseY);
		// regions.push(new Region(pos, '', transport));
		addRegion(mouseY);
	}

	else if (transport.selectPlayhead()){ return; }

	// Select a region with the mouse to edit the code or move it by dragging
	else {
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

	transport.movePlayHead();
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
		transport.reset();
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
		downloadSession();
	}
	// use O to import a session from a JSON file
	else if (keyIsDown(CONTROL) && key === 'o'){
		loadSession();
	}

	// console.log(key);
}

// resize the canvas when the window is resized
function windowResized(){
	resizeCanvas(windowWidth, windowHeight);
	editor.display();
}

// a wrapping utility funtion
function wrap(a, lo, hi){
	let r = hi - lo;
	return ((((a - lo) % r) + r) % r) + lo;
}

// convert the current session to JSON format
function sessionToJSON(){
	let file = {
		zoom: transport.zoomlevel,
		tempo: transport.tempo,
		regions: []
	};

	regions.forEach((r) => {
		file.regions.push(r.getJSON());
	});

	return JSON.stringify(file, null, 2);
}

// transform JSON format to a new session
function sessionFromJSON(json){
	// remove all regions
	regions = [];
	// get all the info from the json
	transport.zoomlevel = json.zoom;
	transport.tempo = json.tempo;
	// create new code regions with the info
	json.regions.forEach((r) => {
		regions.push(new Region(r.time, r.code, transport, r.id));
	});
}

// get all the info from the transport and regions
// export all the info as a JSON file and store to downloads
function downloadSession(){
	let a = document.createElement("a");
	let b = new Blob([ sessionToJSON() ], {type: 'text/plain'})
	a.href = URL.createObjectURL(b);
	a.download = `cue-code-session_${date()}.json`;
	a.click();
}

// import a session from a json file into the editor
// clear the current session, removing all current regions
function loadSession(){
	let input = document.createElement('input');
	input.style.display = 'none';
	input.type = 'file';
	input.accept = '.json';
	input.onchange = (e) => {
		if (e.target.files.length > 0){
			let read = new FileReader();
			read.onload = (f) => {
				sessionFromJSON(JSON.parse(f.target.result));
			};
			read.readAsText(e.target.files[0]);
		}
	}
	input.click();
}

// add one or multiple files to the session
function addFiles(){
	let mousePos = mouseY;
	let input = document.createElement('input');
	input.style.display = 'none';
	input.type = 'file';
	input.multiple = true;
	input.onchange = (e) => {
		for (let i = 0; i < e.target.files.length; i++){
			let read = new FileReader();
			read.onload = (f) => {
				// let pos = transport.pixelToMs(mousePos + i * 100);
				// regions.push(new Region(pos, f.target.result, transport));
				addRegion(mousePos + i * 100, f.target.result)
			};
			read.readAsText(e.target.files[i]);
		}
	}
	input.click();
}

// add a region based on y pixel location with code
// if no y is provided, randomly generate a position
function addRegion(y, txt=''){
	if (y === undefined){ y = random(height); }
	console.log(y, txt);
	regions.push(new Region(transport.pixelToMs(y), txt, transport));
}

// send the to be evaluated code over the web socket
function evaluate(code){
	socket.emit('eval', code);
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
		this.selected = false;

		this.tempo = 100;

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

	reset(){
		transport.position = 0;
		regions.forEach((r) => r._playhead = -1);
	}

	progress(){
		if (this.running){
			this.position += (millis() - this.prevTime);
			this.prevTime = millis();
		}
	}

	playhead(){
		strokeWeight(5);
		stroke(colors.contrast);
		line(0, this.position / this.zoomlevel - this.focus, gridWidth, this.position / this.zoomlevel - this.focus);
	}

	selectPlayhead(){
		let y = this.msToPixel(this.position);
		this.selected = mouseY > y - 10 && mouseY < y + 10;
		return this.selected;
	}

	movePlayHead(){
		if (this.selected){
			this.position = Math.max(0, this.pixelToMs(mouseY));
			regions.forEach(r => r._playhead = this.position);
		}
	}

	zoomIn(){
		this.zoomlevel = Math.max(2, this.zoomlevel / 1.05);
	}

	zoomOut(){
		this.zoomlevel *= 1.05;
	}

	moveFocus(delta){
		this.focus = Math.max(0, this.focus + delta * 0.5);
	}

 	grid(){
		let stepsize = 1000;
		// let highlight = 0;
		// console.log(Math.log(this.zoomlevel/5)/Math.log(5));

		if (this.zoomlevel < 5){
			stepsize = 250 / this.zoomlevel;
		} else if (this.zoomlevel < 50){
			// highlight = 5;
			stepsize = 1000 / this.zoomlevel;
		} else if (this.zoomlevel < 500){
			// highlight = 6;
			stepsize = 10000 / this.zoomlevel;
		} else if (this.zoomlevel < 5000){
			// highlight = 10;
			stepsize = 60000 / this.zoomlevel;
		} else {
			// highlight = 60;
			stepsize = 600000 / this.zoomlevel;
		} 

		let numlines = Math.ceil(height / stepsize);

		for (let l = 0; l < numlines; l++){
			let p = wrap(l * stepsize - this.focus, 0, numlines * stepsize);
			strokeWeight(1);
			stroke(colors.primairy);
			line(0, p, gridWidth, p);

			noStroke();
			fill(colors.secundairy);
			textAlign(RIGHT, TOP);
			textSize(14);
			text(this.msToTimestamp(this.pixelToMs(p + 0.00001)), gridWidth, p+2);
		}
	}

	timestamp(){
		// noStroke();
		stroke(colors.accent);
		strokeWeight(2);
		fill(colors.accent);
		textFont('courier new');
		
		textAlign(LEFT, BOTTOM);
		textSize(32);
		text(this.msToTimestamp(this.position), gridWidth + 10, height - 10);
	}

	pixelToMs(y){
		return (y + this.focus) * this.zoomlevel; 
	}

	msToPixel(ms){
		return ms / this.zoomlevel - this.focus; 
	}

	msToTimestamp(millisec){
		let ms = (Math.floor(millisec % 1000)).toString().padStart(3, 0);
		let sec = (Math.floor(millisec / 1000) % 60).toString().padStart(2, 0);
		let min = (Math.floor(millisec / 60000)).toString().padStart(2, 0);
		return `${min}:${sec}.${ms}`;
	}
}

// A region is a single block of code. The code can be editted in the editor
// when the region is selected by clicking.
// The region can be moved by click/dragging it over the timeline
// It is also connected to the global transport so it knows when to play
class Region {
	constructor(t=0, txt='', transport, id){
		this.id = id ? id : Math.floor(Math.random() * 10000);

		this.x = 0;
		this.y = 0;
		this.time = t;
		this.w = gridWidth;
		this.h = 25;

		this.selected = false;
		this.selectionOffset = [ 0, 0 ];
		this.isPlaying = false;
		this._playhead = -1;

		this.code = CodeMirror.Doc(txt, EDITOR_MODE);
		this.transport = transport;
	}

	draw(){
		// convert the time to a y location
		this.y = this.transport.msToPixel(this.time);

		// only draw the region and flash if within the limits of the screen
		if (this.y + this.h >= 0 && this.y < height){
			stroke('black');
			strokeWeight(2);
			fill(255, 255, 255, 100);
			if (this.selected){
				strokeWeight(2);
				stroke(colors.accent);
			}
			rect(this.x, this.y, this.w, this.h);
			// display a flashing white image when the region is triggered
			if (this.isPlaying > 0){
				fill(255, 255, 255, this.isPlaying * 255);
				// fill(colors.accent);
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
			evaluate(this.code.getValue());
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
			id: this.id,
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
		this.editor.style('color', colors.accent);
		this.editor.style('z-index', 1000);
		this.editor.id('editor');

		let extraKeys = {
			'Alt-/': 'toggleComment',
			'Ctrl-/': 'toggleComment',
			'Shift-Alt-7': 'toggleComment',
			'Shift-Ctrl-7': 'toggleComment',
			'Alt-Enter': () => { evaluate(this.cm.getValue()) },
			'Ctrl-Enter': () => { evaluate(this.cm.getValue()) },
			'Ctrl-S' : () => { downloadSession() },
			'Alt-S' : () => { downloadSession() },
		}
		
		// initialize the codemirror editor with some settings
		this.cm = CodeMirror(document.getElementById('editor'), {
			theme: 'material-darker',
			mode: EDITOR_MODE,
			value: '',
			cursorHeight: 0.85,
			cursorWidth: 1,
			lineNumbers: true,
			cursorHeight: 1,
			indentUnit: 4,
			indentWithTabs: false,
			styleActiveLine: true,
			matchBrackets: true,
			lineWrapping: true,
			// cursorScrollMargin: 20,
			showCursorWhenSelecting: true,
			showHint: false,
			extraKeys: extraKeys
		});

		this.themes = [ 'gruvbox-dark', 'material-darker', '3024-night', 'abbott', 'ayu-dark', 'ayu-mirage', 'base16-dark', 'bespin', 'blackboard', 'cobalt', 'material-ocean', 'monokai', 'moxer', 'panda-syntax', 'rubyblue', 'shadowfox', 'the-matrix', 'tomorrow-night-eighties', 'yonce' ].sort();

		this.themeMenu = createSelect();
		for (var i = 0; i < this.themes.length; i++){
			this.themeMenu.option(this.themes[i]);
		}
		this.themeMenu.position(gridWidth + 400, 0);
		this.themeMenu.selected('material-darker');
		this.themeMenu.elt.onchange = () => this.setTheme();
	}

	setTheme(){
		this.cm.setOption('theme', this.themeMenu.value());
		let s = this.getStyle();

		colors.background = s['background-color'];
		colors.accent = s['color'];
	}

	getStyle(){
		let e = document.querySelector('.CodeMirror');
		let style = getComputedStyle(e);
		return style;
	}

	display(){
		this.editor.position(gridWidth, 50);
		this.editor.size(width - gridWidth);
		this.cm.setSize('100%', height - 100);
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

// return the date and time formatted as a string
function date(){
	let now = new Date();
	let dd = String(now.getDate()).padStart(2, '0');
	let mm = String(now.getMonth() + 1).padStart(2, '0');
	let yyyy = now.getFullYear();
	let hh = String(now.getHours()).padStart(2, '0');
	let mi = String(now.getMinutes()).padStart(2, '0');
	let ss = String(now.getSeconds()).padStart(2, '0');
	return `${yyyy}-${mm}-${dd}_${hh}.${mi}.${ss}`;
}