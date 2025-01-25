const BLACK_KEY_HEIGHT_PCT = 0.6;

class Keyboard {
    constructor(start_y, end_y, offset) {
        this.start_y = start_y;
        this.end_y = end_y;
        this.height = this.end_y - this.start_y;
        this.offset = offset;
        this.currently_sounding = new Set();
        this.synths = {};
        for (let key = Math.floor(this.left_key()); key <= Math.ceil(this.right_key()); ++key) {
            this.synths[key] = new p5.MonoSynth();
        }
    }

    left_key() {
        return left_key + this.offset;
    }
    right_key() {
        return right_key + this.offset;
    }

    draw(highlights) {
        let key_width_top = width / (right_key - left_key);
        let black_key_height = this.height * BLACK_KEY_HEIGHT_PCT

        for (let key = Math.floor(this.left_key()); key < Math.ceil(this.right_key()); ++key) {
            let left_x = map(key, this.left_key(), this.right_key(), 0, width);

            if (is_black_key(key)) {
                fill(highlights.includes(key) ? "orange" : "black");
                rect(left_x, this.start_y, key_width_top, black_key_height);
            } else {
                fill(highlights.includes(key) ? "red" : "white");

                let left_extension = is_black_key(key - 1);
                let right_extension = is_black_key(key + 1);

                let key_top_left = left_x;
                let key_top_right = left_x + key_width_top;

                let key_ext_left = key_top_left - key_width_top / 2;
                let key_ext_right = key_top_right + key_width_top / 2;

                let ext_vertex_y = this.start_y + black_key_height;

                beginShape();

                vertex(key_top_left, this.start_y);
                vertex(key_top_right, this.start_y);

                if (right_extension) {
                    vertex(key_top_right, ext_vertex_y);
                    vertex(key_ext_right, ext_vertex_y);
                    vertex(key_ext_right, this.end_y);
                } else {
                    vertex(key_top_right, this.end_y);
                }

                if (left_extension) {
                    vertex(key_ext_left, this.end_y);
                    vertex(key_ext_left, ext_vertex_y);
                    vertex(key_top_left, ext_vertex_y);
                } else {
                    vertex(key_top_left, this.end_y);
                }

                endShape();

            }
        }
    }

    get_hovered_key(x, y) {
        if (y < this.start_y || y > this.end_y) return null;

        let x_pos_mapped = map(x, 0, width, this.left_key(), this.right_key());
        let key = Math.floor(x_pos_mapped);
        let y_pos = map(y, this.start_y, this.end_y, 0, 1);

        if (y_pos > BLACK_KEY_HEIGHT_PCT && is_black_key(key)) {
            if (x_pos_mapped % 1 > 0.5) {
                key += 1;
            } else {
                key -= 1;
            }
        }

        return key;
    }

    update_touches(touches) {
        let should_be_sounding = new Set();

        for (let touch of touches) {
            let note = this.get_hovered_key(touch.x, touch.y);
            if (note != null) {
                should_be_sounding.add(note);
            }
        }

        if (mouseIsPressed) {
            let note = this.get_hovered_key(mouseX, mouseY);
            if (note != null) {
                should_be_sounding.add(note);
            }
        }

        this.update_sounds(should_be_sounding);
    }

    update_sounds(should_be_sounding) {
        for (let note of this.currently_sounding) {
            if (!should_be_sounding.has(note)) {
                if (this.currently_sounding.has(note)) {
                    this.synths[note].triggerRelease();
                    this.currently_sounding.delete(note);
                }
            }
        }

        for (let note of should_be_sounding) {
            if (!this.currently_sounding.has(note)) {
                this.synths[note].triggerAttack(midiToFreq(note), 0.2);
                this.currently_sounding.add(note);
            }
        }
    }
}

let key1;
let key2;
let key3;

// let polySynth = new p5.PolySynth();

let left_key = 60;
let right_key = 96;

function setup() {
    createCanvas(innerWidth, innerHeight);
    // fullscreen(true);

    userStartAudio();

    key1 = new Keyboard(0, height / 3, 0);
    key2 = new Keyboard(height / 3, height * 2 / 3, 1/3);
    key3 = new Keyboard(height * 2 / 3, height, 2/3);
}

function draw() {
    background(220);

    let all_touches_and_mouse = [];
    for (let touch of touches) {
        all_touches_and_mouse.push([touch.x, touch.y]);
    }
    all_touches_and_mouse.push([mouseX, mouseY]);

    key1.draw(all_touches_and_mouse.map((t) => key1.get_hovered_key(t[0], t[1])));
    key2.draw(all_touches_and_mouse.map((t) => key2.get_hovered_key(t[0], t[1])));
    key3.draw(all_touches_and_mouse.map((t) => key3.get_hovered_key(t[0], t[1])));
}

function update_all_touches() {
    key1.update_touches(touches);
    key2.update_touches(touches);
    key3.update_touches(touches);
}

function mousePressed() {
    update_all_touches();
}
function mouseReleased() {
    update_all_touches();
}
function touchStarted() {
    update_all_touches();
}
function touchMoved() {
    update_all_touches();
}
function touchEnded() {
    update_all_touches();
}

function is_black_key(key_number) {
    let pitch_class = key_number % 12;
    return pitch_class == 1 || pitch_class == 3 || pitch_class == 6 || pitch_class == 8 || pitch_class == 10;
}
