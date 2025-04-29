
let zoomlevel = 20;
// let zoomslider;

let gridheight = 250;

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

	// for (let i=0; i<3; i++){
	// 	regions.push(new Region());
	// }

	editor = new Editor();

	// addFilesButton = createButton('add file');
	// addFilesButton.position(0, -200);
	// addFilesButton.style('z-index', 2000);
}

function draw(){
	background('black');

	translate(focusposition);
	
	transport.grid();
	transport.progress();

	regions.forEach(r => {
		if (transport.running){
			r.play(transport.position / zoomlevel);
		}
		r.draw();
	});
	transport.playhead();
	
	// regions.forEach(r => r.display());

	transport.timestamp();

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
					regions.push(new Region(x, f.target.result));
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
		line(this.position / zoomlevel, 0, this.position / zoomlevel, gridheight);
	}

 	grid(){
		let x = 0;
		while( x < width ){
			// strokeWeight((i % 4 === 0) ? 3 : 1);
			strokeWeight(1);
			stroke('darkgrey');
			line(x, 0, x, gridheight);
			x += 1000 / zoomlevel;
		}
		// for (let i=0; i<width*zoomlevel; i++){
		// }
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
	constructor(x=0, txt=''){
		this.x = x;
		// this.y = random(height);
		this.y = 0;
		this.w = 100;
		this.h = gridheight;
		this.selected = false;
		this.selectionOffset = [ 0, 0 ];
		this.isPlaying = false;

		this.code = CodeMirror.Doc(txt);
	}

	draw(){
		stroke('black');
		strokeWeight(2);
		fill('darkgrey');
		if (this.isPlaying){
			fill('white');
		}
		rect(this.x, this.y, this.w, this.h);
	}

	play(playhead){
		if (this.inboundsX(playhead) !== this.isPlaying && !this.isPlaying){
			console.log('eval:', this.getJSON());
		}
		this.isPlaying = this.inboundsX(playhead);
	}

	move(){
		if (this.selected){
			this.x = constrain(mouseX - this.selectionOffset[0], 0, width-this.w);
			this.y = constrain(mouseY - this.selectionOffset[1], 0, gridheight-this.h);

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
			value: ''
		});
	}

	display(){
		this.editor.position(0, gridheight);
		this.editor.size(width);
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