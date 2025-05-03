
let gridheight = 250;
let gridWidth = 200;

let regions = [];
let transport;
let editor;

let snap = true;

let addFilesButton;

function setup(){
	createCanvas(windowWidth, windowHeight);
	document.body.id = 'main';

	transport = new Transport();

	editor = new Editor();
}

function draw(){
	background('black');
	
	transport.grid();
	transport.progress();

	regions.forEach(r => {
		if (transport.running){
			r.play(transport.position);
		}
		r.draw();
	});
	transport.playhead();
	
	transport.timestamp();

	editor.display();
}

function mousePressed(){
	if (keyIsDown(SHIFT)){
		let x = mouseX;
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
			// console.log(e.target.files);
		}
		input.click();
	}

	regions.forEach(r => r.selected = false);
	for (let r=regions.length-1; r>=0; r--){
		if (regions[r].select()) {
			// console.log(regions[r].code);
			editor.swapDoc(regions[r].code);
			// regions[r].bindToEditor(editor);
			return;
		}
	}
}

function mouseDragged(){
	regions.forEach(r => r.move());

	// transport.movePlayHead();
}

function mouseWheel(event){
	if (mouseX > 0 && mouseX < gridWidth){
		transport.moveFocus(event.deltaY);
	}
}

function keyPressed(){
	if (document.activeElement.id !== 'main') { return }
	else if (keyCode === 32){
		if (transport.running){ 
			transport.stop();
		} else {
			transport.start();
		}
	}

	else if (key === 'w'){
		transport.position = 0;
	}
	else if (keyIsDown(CONTROL) && key === '='){
		transport.zoomIn();
	}
	else if (keyIsDown(CONTROL) && key === '-'){
		transport.zoomOut();
	}

	else if (keyIsDown(CONTROL) && key === 's'){
		exportSession();
	}

	// console.log(key);
}

function windowResized(){
	resizeCanvas(windowWidth, windowHeight);
}

function wrap(a, lo, hi){
	let r = hi - lo;
	return ((((a - lo) % r) + r) % r) + lo;
}

function exportSession(){
	let file = {
		// name: 'empty',
		// date: 'today',
		// length: 10,
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

// function importSession(){
// }

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
		// line(this.position / zoomlevel, 0, this.position / zoomlevel, gridheight);
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
		stroke('black');
		strokeWeight(1);
		// noStroke();
		fill('grey');
		if (this.selected){
			strokeWeight(3);
			stroke('white');
			// fill('lightgrey');
		}
		this.y = this.transport.msToPixel(this.time);
		rect(this.x, this.y, this.w, this.h);

		if (this.isPlaying > 0){
			fill(255, 255, 255, this.isPlaying * 255);
			rect(this.x, this.y, this.w, this.h);
			this.isPlaying -= 0.02;
		}
	}

	play(playhead){
		if (this._playhead < this.time && playhead > this.time){
			this.isPlaying = 1;
			console.log('eval:', this.getJSON());
		}
		this._playhead = playhead;

		// let p = this.transport.msToPixel(playhead);
		// // playhead = this.transport.msToPixel(playhead);		
		// if (this.inboundsY(p) !== this.isPlaying && !this.isPlaying){
		// 	console.log('eval:', this.getJSON());
		// }
		// this.isPlaying = this.inboundsY(p);
	}

	move(){
		if (this.selected){
			// this.x = constrain(mouseX - this.selectionOffset[0], 0, width-this.w);
			// this.y = constrain(mouseY - this.selectionOffset[1], 0, height-this.h);
			// this.y = Math.max(0, mouseY - this.selectionOffset[1]);

			this.time = Math.max(0, this.transport.pixelToMs(mouseY - this.selectionOffset[1]));

			// if (snap){
			// 	this.x = this.x 
			// }
		}
	}

	select(){
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

class Editor {
	constructor(){
		this.editor = createElement('div');
		this.editor.style('color', 'white');
		this.editor.style('z-index', 1000);
		this.editor.id('editor');
	
		this.cm = CodeMirror(document.getElementById('editor'), {
			lineNumbers: true,
			theme: 'gruvbox-dark',
			mode: 'javascript',
			value: ''
		});
	}

	display(){
		// this.editor.position(0, gridheight);
		this.editor.position(gridWidth, 50);
		// this.editor.size(width);
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
		this.cm.swapDoc(doc);
	}
}