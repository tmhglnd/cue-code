
let zoomlevel = 20;
// let zoomslider;

let gridheight = 250;
let gridWidth = 200;

let regions = [];
let transport;
let editor;

let snap = true;

let focusposition = 0;

let addFilesButton;

function setup(){
	createCanvas(windowWidth, windowHeight);
	document.body.id = 'main';

	transport = new Transport();

	editor = new Editor();
}

function draw(){
	background('black');
	// translate(focusposition);
	
	transport.grid();
	transport.progress();

	regions.forEach(r => {
		if (transport.running){
			r.play(transport.position / zoomlevel);
		}
		r.draw();
	});
	transport.playhead();
	
	// transport.timestamp();

	editor.display();
}

function mousePressed(){
	if (keyIsDown(SHIFT)){
		let x = mouseX;
		let input = document.createElement('input');
		input.style.display = 'none';
		input.type = 'file';
		input.multiple = false;
		input.onchange = (e) => {
			if (e.target.files.length > 0){
				let read = new FileReader();
				read.onload = (f) => {
					regions.push(new Region(0, mouseY, f.target.result));
					// console.log(f.target.result);
				};
				read.readAsText(e.target.files[0]);
			}
			console.log(e.target.files);
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
}

function keyPressed(){
	if (document.activeElement.id !== 'main') return;

	if (keyCode === 32){
		if (transport.running){ 
			transport.stop();
		} else {
			transport.start();
		}
	}

	if (key === 'w'){
		transport.position = 0;
	}
}

function windowResized(){
	resizeCanvas(windowWidth, windowHeight);
}

class Transport {
	constructor(){
		this.position = 0;
		this.running = false;
		this.startTime = 0;
		this.prevTime = 0;
	}

	start(){
		this.running = true;
		// this.startTime = this.position;
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
		line(0, this.position / zoomlevel, gridWidth, this.position / zoomlevel);
	}

 	grid(){
		let y = 0;
		while( y < height ){
			strokeWeight(1);
			stroke('darkgrey');
			// line(x, 0, x, gridheight);
			line(0, y, gridWidth, y);
			// x += 1000 / zoomlevel;
			y += 1000 / zoomlevel;
		}
	}

	timestamp(){
		noStroke();
		fill('white');
		textSize(32);

		let ms = Math.floor(this.position % 1000);
		let sec = (Math.floor((this.position / 1000) % 60)).toString().padStart(2, 0);
		let min = (Math.floor(this.position / 60000)).toString().padStart(2, 0);
		text(`${min}:${sec}.${ms}`, 20, height-20);
	}
}

class Region {
	constructor(x=0, y=0, txt=''){
		this.x = x;
		this.y = y;
		this.w = gridWidth;
		this.h = 50;
		// this.h = gridheight;
		this.selected = false;
		this.selectionOffset = [ 0, 0 ];
		this.isPlaying = false;

		this.code = CodeMirror.Doc(txt, 'javascript');
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
		if (this.isPlaying){
			fill('white');
		}
		rect(this.x, this.y, this.w, this.h);
	}

	play(playhead){
		if (this.inboundsY(playhead) !== this.isPlaying && !this.isPlaying){
			console.log('eval:', this.getJSON());
		}
		this.isPlaying = this.inboundsY(playhead);
	}

	move(){
		if (this.selected){
			// this.x = constrain(mouseX - this.selectionOffset[0], 0, width-this.w);
			this.y = constrain(mouseY - this.selectionOffset[1], 0, height-this.h);

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
		return x > this.x && x < this.x+this.w;
	}

	inboundsY(y){
		return y > this.y && y < this.y+this.h;
	}

	getJSON(){
		return {
			time_ms: (this.x / 1000) * zoomlevel,
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
		this.editor.position(gridWidth, 0);
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