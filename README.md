```
░▒█▀▀▄░▒█░▒█░▒█▀▀▀░░░░▒█▀▀▄░▒█▀▀▀█░▒█▀▀▄░▒█▀▀▀
░▒█░░░░▒█░▒█░▒█▀▀▀░▀▀░▒█░░░░▒█░░▒█░▒█░▒█░▒█▀▀▀
░▒█▄▄▀░░▀▄▄▀░▒█▄▄▄░░░░▒█▄▄▀░▒█▄▄▄█░▒█▄▄█░▒█▄▄▄

  ░██▄░▀▄▀░░░▀█▀░█▄▒▄█░█▄█░▄▀▒░█▒░░█▄░█░█▀▄
  ▒█▄█░▒█▒▒░░▒█▒░█▒▀▒█▒█▒█░▀▄█▒█▄▄░█▒▀█▒█▄▀

- SEQUENTIALLY EVALUATE CODE FROM A TIMELINE -
```

# ⏱ Cue Code

Sequentially evaluate code snippets from a timeline. A tool to help the process of making creative coding compositions for music and visuals (or any other reason you might find this helpful!). It is inspired by the workflow of a DAW (Digital Audio Workstation) where sounds are placed on a timeline. In this project you place blocks of code on a timeline that can be edited individually. The timeline is vertical (like a tracker), mainly because this makes gives the code editor more space on the screen.

This tool was mainly created for my personal usage when making compositions with the [Mercury live coding environment](https://mercury.timohoogland.com/), but you can surely fork and adapt this project for usage with other languages!

[![](https://img.shields.io/static/v1?label=Join%20the%20Discord&message=%E2%9D%A4&logo=Discord)](https://discord.gg/vt59NYU)
[![](https://img.shields.io/static/v1?label=Support%20on%20Ko-Fi&message=%E2%9D%A4&logo=Kofi)](https://ko-fi.com/I2I3SV7FX)
[![](https://img.shields.io/static/v1?label=Support%20on%20Patreon&message=%E2%9D%A4&logo=Patreon)](https://www.patreon.com/bePatron?u=9649817)

## 🚀 Install

1. download the repository with

`git clone https://github.com/tmhglnd/cue-code`

2. navigate to the folder and install dependencies

```
cd cue-code
npm install
```

3. start the server

`node server.js`

4. open a browser and go to

`http://localhost:8001`

## 🕹 Usage

### Connect to Interpreter

This project does not include any interpreter and audio/visual engine. Therefore the code needs to be evaluated elsewhere. This is done by sending the code from the region to the server via a web-socket. From there the server forwards the code as an OSC-message to your desired port.

#### Setup osc-address and port

By default, when starting the server with `node server.js` the default port the server will listen at is: `8001`. The default port the server will send the code to is: `4880` and the osc-address is `/mercury-code`. These settings can be adjusted by using the following flags in the terminal command:

```
-p, --port <number>        the port to receive your code on (default: "4880")
-a, --address <string>     the address to receive your code on (default: "/mercury-code")
-s, --serverport <number>  the port the server listens on (default: "8001")
-m, --mute <string>        the mute message to silence your sound with (default: "silence")
-h, --help                 display help for command
```

### Interface

The interface consists of **4 areas**: a **timeline**, a **menubar**, a **code-editor** and a **clock-display**. Note: Some shortkeys depend on the area you are focused on. You can focus on an area by clicking it with the mouse.

#### Timeline

The timeline displays all the code-regions in your project.

- Add an empty region: `option/alt` `click` or click: *add region*
- Add a region from file: `shift` `click` or click: *add file* (multiple selection possible)
- Move a region: `click` the region to select it, then `drag` up or down
- Remove a region: `click` the region to select it, then press `backspace/delete`
- Zoom the timeline: `ctrl` `+` to zoom in, `ctrl` `-` to zoom out
- Scroll the timeline: `scroll` with the mousewheel or 2 fingers
- Start/Pause playback: `space`
- Reset playback to start: `enter`

#### Clock

The clock on the bottom of the screen displays the time the playhead is located at in `minutes:seconds.milliseconds`.

#### Menubar

- *add region* - add an empty region in the timeline
- *add file* - add a region with code from a file (multiple selection possible)
- *save* - export the current session in a `.json` format
- *load* - import a session from a `.json` format
- *theme* - select a theme for the editor from the drop-down menu

#### Editor

- Evaluate code directly: `Ctrl/Alt` `Enter`

The editor allows you to type code that is connected to a specific region in the timeline. First select the region you want to edit, then start typing code. When selecting another region the documents are automatically swapped.

The syntax highlighting is by default `mercury`, although this highlighting also works quite okay for other languages such as JavaScript and C++. For other languages it also could work, but the `comment` is not correct if it is other than `//`. You can adjust the syntax in the code by including another mode for `CodeMirror`.

## 🔋 Powered By

This project was developed as part of the [Mercury](https://www.timohoogland.com/mercury-livecoding/) and [Drumcode](https://www.timohoogland.com/drum-code/) projects.

- These projects were funded by [**Creative Industries Fund NL**](https://stimuleringsfonds.nl/en/)
- These projects were supported by [**Creative Coding Utrecht**](https://creativecodingutrecht.nl/)

## 📄 License

- [The GNU GPL v.3 License](https://choosealicense.com/licenses/gpl-3.0/) (c) Timo Hoogland 2025

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.