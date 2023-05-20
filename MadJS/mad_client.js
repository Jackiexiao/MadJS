"use strict";

///////////
// Local App constants and global variables
///////////
let canvas, context; // the canvas and context we will draw the game cells on
let cells_client = []; // This is the array of cell objects as understood by the client. Currently is only used for rendering.
let game_tick_local;
let local_player_id = 0 // TODO temp syntax - don't want this hardcoded
const active_cell = [0,0]; // will hold the row/col pair of currently selected coordinates, if any
const VALID_KEY_PRESSES = ['W', 'w', 'A', 'a', 'S', 's', 'D', 'd', 'E', 'e', 'Q', 'q', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight'] //, 37]
const local_move_queue = [];
let local_queued_move_counter = 0; // this gets incremented every time the users queues a move and serves as the move's unique identifier, both locally and on the server (each player has a separate queue)
let move_mode; // values are defined in the ACTION_MOVE_ constants

let sprite_sheet; //graphical goodness

const MIN_SCALE = 1;
const MAX_SCALE = 15;
const DEFAULT_ZOOM = 4;
let zoom_scale = DEFAULT_ZOOM; // for scroll wheel zooming

const DEFAULT_CANVAS_WIDTH = 50;
const DEFAULT_CANVAS_HEIGHT = 50;
const DEFAULT_FONT_SIZE = 18;
let font_size = DEFAULT_FONT_SIZE;

const RENDER_REFRESH_TIME = 50 // time in ms to wait after rendering before rendering. Due to how setTimeout works, may be up to 16 ms late

let new_game_overlay_visible = false;

// var localStorage = window.localStorage; // TODO remove if this doesn't get implemented
// window.localStorage.setItem('myKey', 'myValue');
let myValue = localStorage.getItem('myKey');
console.log(myValue)

///////////
// Server constants and global variables
///////////

const DEFAULT_TICK_SPEED = 500; // default ms to wait before rendering each new frame

 

///////////
// Local App classes and functions
///////////

function show_new_game_overlay() {
    if(game.game_on) {
        toggle_pause()
    }
    
    document.getElementById('mad-overlay').style.display = 'block';
    new_game_overlay_visible = true;
}
function hide_new_game_overlay() {
    document.getElementById('mad-overlay').style.display = 'none';
    new_game_overlay_visible = false;
    
    toggle_pause() // TODO currently this will always unpause the game, even if the game was paused when the overlay was opened. Evaluate desire behavior
}

function game_loop_client() {
    if (true) {
        render_board(); // Redraw the game canvas        
    }
    setTimeout( () => { window.requestAnimationFrame(() => game_loop_client()); }, RENDER_REFRESH_TIME) // therefore each game loop will last at least tick_time ms    
}

function add_slider(overlay_inner, id_prefix, display_name, min, max, step, starting_val) {

    let header_p = document.createElement('p');
    let slider_div = document.createElement('div');
    let slider_range = document.createElement('input')
    
    let lbl_slider_val = document.createElement('label')
    lbl_slider_val.id = `${id_prefix}_label`;
    lbl_slider_val.htmlFor = 'slider_range';
    lbl_slider_val.innerHTML= starting_val;

    header_p.innerHTML = display_name
    slider_range.type = 'range';
    slider_range.id = `${id_prefix}_range`
    slider_range.setAttribute('name', display_name);
    slider_range.setAttribute('min', min)
    slider_range.setAttribute('max', max)
    slider_range.setAttribute('step', step)
    slider_range.value = starting_val;
    slider_range.addEventListener('change', function() {
        document.getElementById(`${id_prefix}_label`).innerHTML = `${slider_range.value}`;
    }, false);

    overlay_inner.appendChild(slider_div);
    slider_div.appendChild(header_p);
    slider_div.appendChild(slider_range);
    slider_div.appendChild(lbl_slider_val);

    // # Fog of
//     var x = document.createElement("INPUT");
// x.setAttribute("type", "checkbox");
}

function populate_new_game_overlay(){
    let overlay = document.getElementById('mad-overlay');
    
    let overlay_container_box = document.createElement('div');
    overlay_container_box.id = 'mad-overlay-container';
    overlay_container_box.addEventListener('click', function(e) { e.stopPropagation(); }); // prevent clicking on the new game box from closing the overlay
    overlay.appendChild(overlay_container_box)
    
    let overlay_inner = document.createElement('div');
    overlay_inner.id = 'mad-overlay-inner';
    overlay_container_box.appendChild(overlay_inner)
    
    let input_name = document.createElement('input');
    input_name.id = 'input_name';
    input_name.type = 'text';
    input_name.value='Player One';
    
    let lbl_input = document.createElement('label');
    lbl_input.id = 'lbl_input_name';
    lbl_input.htmlFor = 'input_name';
    lbl_input.innerHTML='Name';

    overlay_inner.appendChild(lbl_input);
    overlay_inner.appendChild(input_name);

    add_slider(overlay_inner, 'bots', 'Bots', 1, 10, 1, 3);
    add_slider(overlay_inner, 'rows', 'Rows', 10, 30, 1, 15);
    add_slider(overlay_inner, 'cols', 'Cols', 10, 45, 1, 15);
    add_slider(overlay_inner, 'mountains', 'Mountain Spawn Rate', 1, 100, 1, 15);
    add_slider(overlay_inner, 'ships', 'Ship Spawn Rate', 1, 100, 1, 5);
    add_slider(overlay_inner, 'swamps', 'Swamp Spawn rate', 1, 100, 1, 5);
    
    
    //document.getElementById('id').checked
    let lbl_fow = document.createElement('label')
    lbl_fow.innerHTML='Fog of War';

    let radio_fog_on = document.createElement('input');
    radio_fog_on.id = 'radio_fog_on';
    radio_fog_on.type = 'radio';
    radio_fog_on.name='Fog of War';
    radio_fog_on.value='On';
    radio_fog_on.checked= true;
    let lbl_fow_on = document.createElement('label')
    lbl_fow_on.innerHTML='On';
    
    
    let radio_fog_off = document.createElement('input');
    radio_fog_off.id = 'radio_fog_off';
    radio_fog_off.type = 'radio';
    radio_fog_off.name='Fog of War';
    radio_fog_off.value='Off';
    let lbl_fow_off = document.createElement('label')
    lbl_fow_off.innerHTML='Off';
    
    overlay_inner.appendChild(lbl_fow);
    overlay_inner.appendChild(document.createElement('br'));
    overlay_inner.appendChild(radio_fog_on);
    overlay_inner.appendChild(lbl_fow_on);
    overlay_inner.appendChild(document.createElement('br'));
    overlay_inner.appendChild(radio_fog_off);
    overlay_inner.appendChild(lbl_fow_off);
    overlay_inner.appendChild(document.createElement('br'));
    
    let ok_button = document.createElement('button');
    ok_button.innerHTML = 'Create Game'
    ok_button.addEventListener('click', launch_new_game);
    overlay_inner.appendChild(ok_button);
       
}

function launch_new_game(event) {
    console.log('launch new game!')

    let player_name = document.getElementById('input_name').value;
    let n_rows = document.getElementById('rows_range').value;
    let n_cols = document.getElementById('cols_range').value;
    
    let num_bots = document.getElementById('bots_range').value;

    let water_weight = 100;
    let mountain_weight = Number(document.getElementById('mountains_range').value);
    let ship_weight  = Number(document.getElementById('ships_range').value);
    let swamp_weight = Number(document.getElementById('swamps_range').value);

    let fog_of_war = document.getElementById('radio_fog_on').checked
 
    game = new Game(n_rows, n_cols, fog_of_war);
    game.add_human('12345678', player_name, '#0a5a07'); // todo add color selection
    
    const bot_color_options = ['#C50F1F', '#C19C00', '#881798', '#E74856', '#16C60C', '#F9A1A5', '#B4009E', '#61D6D6', '#2222F2', '#0C0C0C', '#B9B165'];
    const bot_name_options = [ 'Admiral Blunderdome', 'Admiral Clumso', 'Admiral Tripfoot', 'Admiral Klutz', 'Admiral Fumblebum', 'Captain Bumblebling', 
                                'Admiral Fuming Bull', 'Commodore Rage', 'Commodore Clumsy', 'Seadog Scatterbrain', 'The Crazed Seadog', 'Admiral Irritable', 
                                'Captain Crazy', 'The Mad Mariner', 'The Lunatic Lighthousekeeper', 'The Poetic Pirate', 'The Fiery Fisherman', 'The Irascible Islander', 
                                'The Tempestuous Troubadour', 'The Irate Inventor', 'The Eccentric Explorer', 'Tempestuous King Triton', 'Mad Mariner', 
                                'Wrathful Wave Rider', 'Vivid Voyager', 'Rhyming Rover', 'Bluemad Admiral Bee', 'The Scarlet Steersman', 'Jocular Jade Jack Tar', 
                                'Captain Kindly', 'Captain Cruelty', 'Commodore Limpy']; 
    
    for (let i = 0; i < num_bots; i++) {
        let bot_color_index = Math.floor(Math.random()*bot_color_options.length);
        let bot_color = bot_color_options[bot_color_index];
        bot_color_options.splice(bot_color_index, 1);

        let bot_name_index = Math.floor(Math.random()*bot_name_options.length);
        let bot_name = bot_name_options[bot_name_index];
        bot_name_options.splice(bot_name_index, 1);

        game.add_bot('bot personality', bot_name, bot_color);

    };

    // console.log(`got here. num players = ${game.players.length}`)

    game.spawn_admirals(25); // create an admiral entity for each player, param is the number of troops they start with
    game.spawn_terrain(water_weight, mountain_weight, swamp_weight, ship_weight);
    
    game.status = GAME_STATUS_IN_PROGRESS
    //game.game_on = true; // start with the simulation running instead of paused
    
    new_game_client();
    game.send_game_state_to_players();
    
    hide_new_game_overlay()
}


//game init on server, event handlers on client side, canvas/context def on client
function init_client(game_config_json){
    console.log('Initializing a Madmirals instance')
    
    // init_server();
    // Add event listener on keydown
    document.addEventListener('keydown', (event) => {
        if (VALID_KEY_PRESSES.includes(event.key) && !new_game_overlay_visible) {
            event.preventDefault();
            handle_key_press(event.key)
        }
    }, false);

    move_mode = ACTION_MOVE_NORMAL

    canvas = document.getElementById('canvas'); // Get a reference to the canvas
    canvas.style.zIndex = "-1"; // set to a low z index to make overlapping elements cover the canvas
    context = canvas.getContext('2d');

    canvas.height = CellClient.height*game.num_rows // canvas width must match cols*col_size
    canvas.width = CellClient.width*game.num_cols // canvas width must match cols*col_size

    canvas.addEventListener('mousedown', function (event) { canvas_mouse_handler(event) }, false); //our main click handler function
    canvas.addEventListener('contextmenu', function(event) { event.preventDefault(); }, false); // prevent right clicks from bringing up the context menu
    canvas.addEventListener('wheel', function (event) { wheel_handler(event) },  {passive: true}); // zoom in/out with the scroll wheel
    drag_canvas_event_handler(canvas); // custom function to handle dragging the canvas while the mouse is down
    
    sprite_sheet = new Image();
    sprite_sheet.onload = function() {
        //context.drawImage(sprite_sheet, 10, 10);
        console.log('sprite drawn')
       
    };
    //sprite_sheet.src = './img/sample_sprite_sheet.png';
    sprite_sheet.src = './img/sprites3.png';

    // create_board_cells(num_rows, num_cols); // Create an array of Cells objects, each representing one cell in the simulation
    create_client_cells(game.num_rows, game.num_cols); // Create an array of Cells objects, each representing one cell in the simulation
    render_board(); // display the starting conditions for the sim
    
    populate_new_game_overlay();

    window.requestAnimationFrame(() => game_loop_client()); // start the game loop
}

function new_game_client() {
    //call this after a new game has been created at the server level
    canvas.height = CellClient.height*game.num_rows // canvas width must match cols*col_size
    canvas.width = CellClient.width*game.num_cols // canvas width must match cols*col_size
    create_client_cells(game.num_rows, game.num_cols); // Create an array of Cells objects, each representing one cell in the simulation
    render_board(); // display the starting conditions for the sim
  
    window.requestAnimationFrame(() => game_loop_client()); // start the game loop
}
class CellClient {
    static width = DEFAULT_CANVAS_WIDTH;
    static height = DEFAULT_CANVAS_HEIGHT;
    static grid_color = '#222222' //'#bb00ff'
    static mountain_color = '#555555'
    
    static swamp_color = '#0E735A'
    static high_tide_color = '#0E306C'
    static low_tide_color = '#2A77E4' //'#1A57C4'
    static neutral_entity_color = '#BBBBBB'
    static hidden_color = '#113366'
            
    constructor(context, id, row, col) {
        this.context = context; // the context of the canvas we'll be drawing to
        this.id = id //position w/in the 1d array of cells
        this.row = row;
        this.col = col;
        this.owner = null
        this.troops = 0
        this.terrain = TERRAIN_TYPE_WATER //water is traversable, mountains are not
        this.entity = null // what type of entity (if any) is here - eg admiral
        this.visible = false // can the user view this cell at the moment? If not, it should be blackened out
    }   

    get_water_color() {
        // game_tick_server
        // context.fillStyle = "rgba(0, 0, 0, 0.2)";
        //     cell.context.fillRect((cell.col-1)*CellClient.width, cell.row*CellClient.height, CellClient.width, CellClient.height);

        if (game.game_tick_server % 200 > 100) {
            return CellClient.high_tide_color;
        }
        else {
            return CellClient.low_tide_color;
        }

    }

    get_swamp_color() {
        if (game.game_tick_server % 200 > 100) {
            return CellClient.high_tide_color;
        }
        else {
            return CellClient.swamp_color;
        }
    }

    draw_cell() {
        //First draw a grid around the cell
        //Draw outline around the cell

        let water_color = this.get_water_color(); // different at low and hide tide
        let swamp_color = this.get_swamp_color(); // different at low and hide tide
        

        this.context.strokeStyle = CellClient.water_color;
        this.context.lineWidth = 1;
        this.context.strokeRect(this.col*CellClient.width, this.row*CellClient.height, CellClient.width, CellClient.height)
        
        if (this.visible) {


            if (this.terrain == TERRAIN_TYPE_MOUNTAIN) {
                this.context.fillStyle = CellClient.mountain_color            
                this.context.fillRect(this.col*CellClient.width, this.row*CellClient.height, CellClient.width, CellClient.height)
            } else if (this.terrain == TERRAIN_TYPE_SWAMP) {
                this.context.fillStyle = swamp_color         
                this.context.fillRect(this.col*CellClient.width, this.row*CellClient.height, CellClient.width, CellClient.height)
            } else {
                this.context.fillStyle = water_color            
                this.context.fillRect(this.col*CellClient.width, this.row*CellClient.height, CellClient.width, CellClient.height)    
            }
            
            if (this.owner != null) { // Otherwise, if the spot is owned, draw a circle over it in the owner's color
                // this.draw_circle();
                // this.draw_outline();
                this.context.fillStyle = game.players[this.owner].color         
                this.context.fillRect(this.col*CellClient.width, this.row*CellClient.height, CellClient.width, CellClient.height)
                
            } 

            // this.draw_outline(water_color);
            
            if (this.terrain != TERRAIN_TYPE_WATER) { 
                this.draw_sprite(this.terrain);
            };

            // // If there is an admiral here, draw a star to represent it
            // if (this.entity == ENTITY_TYPE_ADMIRAL ) { //&& false) {
            //     this.draw_star(5);
            // } else if (this.entity != null) { 
            //     this.draw_sprite(this.entity);
            // };
            if (this.entity != null) { 
                this.draw_sprite(this.entity);
            };
            


            this.draw_troops();
        }
    }

    draw_outline(color) {

        // this.context.strokeRect(this.col*CellClient.width, this.row*CellClient.height, CellClient.width, CellClient.height)    
   
        this.context.strokeStyle = color;    
        let x, y, line_width;
        line_width = 5
        x = this.col*CellClient.width; // + line_width/2;
        y = this.row*CellClient.height;
        this.context.beginPath();
        this.context.lineWidth = line_width;
        this.context.moveTo(x + line_width/2,                       y + line_width/2);
        this.context.lineTo(x+CellClient.width - line_width/2,      y + line_width/2);
        this.context.lineTo(x+CellClient.width - line_width/2,      y+CellClient.height - line_width/2);
        this.context.lineTo(x + line_width/2,                                      y+CellClient.height - line_width/2);
        this.context.lineTo(x + line_width/2,                                         y);
        
        
        
        this.context.stroke();

        // this.context.arc(x, y, radius, 0, 2 * Math.PI, false);
        
        // this.context.fill(); // apply the solid color

    }

    draw_circle() {
        this.context.beginPath()
        // Draw the circle containing the cell, its remains, or nothing
        let x, y, radius;
        x = this.col*CellClient.width + CellClient.width/2;
        y = this.row*CellClient.height + CellClient.height/2;
        radius = CellClient.width/2 - 1;

        this.context.beginPath();
        this.context.arc(x, y, radius, 0, 2 * Math.PI, false);
        this.context.fillStyle = game.players[this.owner].color;
        this.context.fill(); // apply the solid color
    
    }

    draw_sprite(entity_or_terrain) {
        let sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight; // variable names via the docs https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage
        
        switch (entity_or_terrain) {
            case ENTITY_TYPE_SHIP: 
                sx = 250; 
                sy = 0;
                break;
            case ENTITY_TYPE_SHIP_2: 
                sx = 500; 
                sy = 0;
                break;
            case ENTITY_TYPE_SHIP_3: 
                sx = 0; 
                sy = 250;
                break;
            case ENTITY_TYPE_SHIP_4: 
                sx = 250; 
                sy = 250;
                break;
            case ENTITY_TYPE_ADMIRAL: 
                sx = 500; 
                sy = 250;
                break;
            case TERRAIN_TYPE_MOUNTAIN:
                sx = 250;
                sy = 500;
                break;
            case TERRAIN_TYPE_SWAMP:
                sx = 0;
                sy = 500;
                break;                
            
        };
        
        sWidth = 250;
        sHeight = 250;
        dx = this.col*CellClient.width;
        dy = this.row*CellClient.height;
        dWidth = CellClient.width;
        dHeight = CellClient.height;

        this.context.drawImage(sprite_sheet, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
        
    }

    draw_star(num_points=5) { // Draws an n-pointed star within the bounds of the cell, representing an Admiral or ship cell
    // Credit to https://stackoverflow.com/a/45140101
        //let num_points = 5 //Math.floor(Math.random() * 7 + 3)
        let inset = .5
        let x = this.col*CellClient.width + CellClient.width/2;
        let y = this.row*CellClient.height + CellClient.height/2;
        let radius = CellClient.width/2;
        let fillColor = (this.owner !=null) ? game.players[this.owner].color: CellClient.neutral_entity_color;

        this.context.save();
        this.context.fillStyle = fillColor;
        this.context.beginPath();
        this.context.translate(x, y);
        this.context.moveTo(0, 0-radius);
        for (let i = 0; i < num_points; i++) {
            this.context.rotate(Math.PI / num_points);
            this.context.lineTo(0, 0 - (radius*inset));
            this.context.rotate(Math.PI / num_points);
            this.context.lineTo(0, 0 - radius);
        }
        this.context.closePath();
        this.context.fill();
        this.context.restore();
    }
    
    draw_troops() {
        let x = this.col*CellClient.width + CellClient.width/2;
        let y = this.row*CellClient.height + CellClient.height/2;
        // Add the number of troops (if any)
        if (this.troops != 0) {
            this.context.font = `${font_size}px Comic Sans MS`;
            this.context.fillStyle = '#FFFFFF';
            this.context.textBaseline = 'middle';
            this.context.textAlign = 'center';
            this.context.fillText(this.troops, x, y, CellClient.width); //limit the width to the size of the cell, squeezing text if need be
        }
        
    }

    draw_arrow(dir, action) { // Draw an arrow over the cell to indicate a queued move
        let arrow_color = '#FFFFFF';
        if (action == ACTION_MOVE_ALL) {arrow_color = '#FF0000'} 
        else if (action == ACTION_MOVE_HALF) {arrow_color = '#FFcc00'} 
        
        this.context.beginPath();
        let x_origin, y_start, x_dest, y_dest;
        const strokeWidth = 2;

        x_origin = this.col*CellClient.width + CellClient.width/2;
        y_start = this.row*CellClient.height + CellClient.height/2;
        
        if (dir == 'up') {
            x_dest=x_origin
            y_dest=y_start - CellClient.height/2;
        } else if (dir == 'down') {
            x_dest=x_origin;
            y_dest=y_start + CellClient.height/2;
        } else if (dir == 'left') {
            x_dest=x_origin - CellClient.width/2;
            y_dest=y_start;
        } else if (dir == 'right') {
            x_dest=x_origin+CellClient.width/2;
            y_dest=y_start;
        } else 
        
        // this.context.beginPath();
        this.context.lineWidth = 1; //for some reason this needs to be called both before and after drawing the line, or the arrows won't render correctly
        this.context.strokeStyle = arrow_color;
        this.context.strokeWidth = strokeWidth
        this.context.stroke();
        
        // Inspired by / adapted from https://stackoverflow.com/a/6333775 :
        let arrow_head_length = CellClient.width/7; // length of arrow head in pixels
        let dx = x_dest - x_origin;
        let dy = y_dest - y_start;
        let angle = Math.atan2(dy, dx);
        this.context.moveTo(x_origin, y_start);
        this.context.lineTo(x_dest, y_dest);
        this.context.lineTo(x_dest - arrow_head_length * Math.cos(angle - Math.PI / 6), y_dest - arrow_head_length * Math.sin(angle - Math.PI / 6));
        this.context.moveTo(x_dest, y_dest);
        this.context.lineTo(x_dest - arrow_head_length * Math.cos(angle + Math.PI / 6), y_dest - arrow_head_length * Math.sin(angle + Math.PI / 6));
        this.context.lineWidth = 1; //for some reason this needs to be called both before and after drawing the line, or the arrows won't render correctly
        this.context.strokeStyle = arrow_color;
        this.context.strokeWidth = strokeWidth
        this.context.stroke();
    }
};

function create_client_cells(n_rows, n_cols) { // in the future this will only be defined on the client side
    // console.log('creating client cell grid')
    cells_client = []; // reset the array of cells, in case this isn't first game of session

    let id;
    id = 0
    for(let r = 0; r < n_rows; r++) {
        for(let c = 0; c < n_cols; c++) {
            cells_client.push(new CellClient(context, id, r, c));
            id++;
        }
    }
}

function render_board() {    
    context.fillStyle=CellClient.hidden_color  
    context.fillRect(0, 0, canvas.width, canvas.height); // Clear the board
    
    // Draw each gridline and object on the canvas
    for (let i = 0; i < cells_client.length; i++) {
        cells_client[i].draw_cell();
    }

    //Add the highlights around the active cell (if present)
    highlight_active_cell()

    // Draw arrows over each square containig one or more queued moves
    local_move_queue.forEach(move => {
        let id;
        id = move.row * game.num_cols + move.col; // id 0 is the topleft most cells, and there num_cols cols per row        
        cells_client[id].draw_arrow(move.dir, move.action);
    }); 

    // display the turn number
    if (game_tick_local) {
        document.getElementById('turn_counter').innerText = `Turn ${game_tick_local}`
        document.getElementById('turn_counter_scoreboard').innerText = `Turn ${game_tick_local}`
    }    
}

// Show the user where they are by highlighting the active cell
function highlight_active_cell() {
    cells_client.forEach(cell => {
        if(cell.row == active_cell[0] && cell.col == active_cell[1]) {
            cell.context.lineWidth = 5;
            
            if (move_mode == ACTION_MOVE_NORMAL) { cell.context.strokeStyle = '#FFFFFF'; }
            else if (move_mode == ACTION_MOVE_ALL) { cell.context.strokeStyle = '#FF0000'; }
            else if (move_mode == ACTION_MOVE_HALF) { cell.context.strokeStyle = '#FFcc00'; }
    
            cell.context.strokeRect(cell.col*CellClient.width, cell.row*CellClient.height, CellClient.width, CellClient.height);
            
            // Slightly darken the cells around the active cell to highlight its location
            context.fillStyle = "rgba(0, 0, 0, 0.2)";
            cell.context.fillRect((cell.col-1)*CellClient.width, cell.row*CellClient.height, CellClient.width, CellClient.height);
            cell.context.fillRect((cell.col+1)*CellClient.width, cell.row*CellClient.height, CellClient.width, CellClient.height);
            cell.context.fillRect((cell.col)*CellClient.width, (cell.row-1)*CellClient.height, CellClient.width, CellClient.height);
            cell.context.fillRect((cell.col)*CellClient.width, (cell.row+1)*CellClient.height, CellClient.width, CellClient.height);
        }
    }); 
}

function canvas_mouse_handler(event) {
    event.preventDefault() // prevent default mouse behavior, mainly preventing middle click from activating scroll mode
        
    if (event.button == 0) { //left click
        let mousePos = get_mouse_position(canvas, event);
        let selection_changed = select_cell_at(mousePos.x, mousePos.y);

        if(selection_changed) {
            move_mode = ACTION_MOVE_NORMAL;
        } else { //cycle through the options by repeatedly clicking on the same cell, makes it easier for users without mice to play
            switch (move_mode) {
                case ACTION_MOVE_NORMAL: move_mode = ACTION_MOVE_HALF; break;
                case ACTION_MOVE_HALF: move_mode = ACTION_MOVE_ALL; break;
                case ACTION_MOVE_ALL: move_mode = ACTION_MOVE_NORMAL; break;
            };
        }
            

    } else if (event.button == 1) { // middle click
        let mousePos = get_mouse_position(canvas, event);
        let selection_changed = select_cell_at(mousePos.x, mousePos.y);          
        move_mode = ACTION_MOVE_ALL; 

    } else if (event.button == 2) { // right click 
        let mousePos = get_mouse_position(canvas, event);
        let selection_changed = select_cell_at(mousePos.x, mousePos.y);         
        move_mode = ACTION_MOVE_HALF; 
    };
}

// Zoom in or out when the scrollwheel is used. Scale cells and inner text at the same rate
// Originally zoomed the canvas in or out, but as this scales the whole canvas, it didn't reveal any additional cells
function wheel_handler(event) {
    // event.preventDefault(); 
    
    if (event.deltaY > 0 && zoom_scale > MIN_SCALE) { // zoom out
        zoom_scale --;
    } else if (event.deltaY < 0 && zoom_scale < MAX_SCALE)  { //zoom in
        zoom_scale ++;
    };

    CellClient.height = Math.round(DEFAULT_CANVAS_HEIGHT*(zoom_scale/DEFAULT_ZOOM));
    CellClient.width = Math.round(DEFAULT_CANVAS_WIDTH*(zoom_scale/DEFAULT_ZOOM));
    font_size = Math.round(DEFAULT_FONT_SIZE*(zoom_scale/DEFAULT_ZOOM));

        // canvas.height = CellClient.height*num_rows // canvas width must match cols*col_size
    // canvas.width = CellClient.width*num_cols // canvas width must match cols*col_size
    canvas.width = CellClient.width*game.num_cols;
    canvas.height = CellClient.height*game.num_rows;

    render_board();
}

//Get Mouse Position
function get_mouse_position(canvas, event) {
    let rect = canvas.getBoundingClientRect();
    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };
}

function select_cell_at(x, y) { // returns true if the active cell changed, and false if the cell was already selected
    let row, col, id;
    row = Math.floor(y/CellClient.height)
    col = Math.floor(x/CellClient.width)
    // console.log(`Selecting cell ${row},${col}`)
    let selection_changed = active_cell[0] != row || active_cell[1] != col;

    active_cell[0] = row;
    active_cell[1] = col;
    
    render_board();

    return selection_changed;
}

function handle_key_press(key_key) {
    //If they user has pressed a movement key, then try to move the active cell
    let dir, target_row, target_col;
    
    
    if ((key_key == 'W' || key_key == 'w' || key_key == 'ArrowUp') && active_cell[0] > 0) {
        target_row = active_cell[0] - 1
        target_col = active_cell[1]
        add_to_queue(active_cell[0], active_cell[1], target_row, target_col, 'up')
    } else if ((key_key == 'A' || key_key == 'a' || key_key == 'ArrowLeft') && active_cell[1] > 0) { // left
        target_row = active_cell[0]
        target_col = active_cell[1] - 1
        add_to_queue(active_cell[0], active_cell[1], target_row, target_col, 'left')
    } else if ((key_key == 'S' || key_key == 's' || key_key == 'ArrowDown') && active_cell[0] < game.num_rows - 1) { // down
        target_row = active_cell[0] + 1
        target_col = active_cell[1]
        add_to_queue(active_cell[0], active_cell[1], target_row, target_col, 'down')
    } else if ((key_key == 'D' || key_key == 'd' || key_key == 'ArrowRight') && active_cell[1] < game.num_cols - 1) { // right
        target_row = active_cell[0]
        target_col = active_cell[1] + 1
        add_to_queue(active_cell[0], active_cell[1], target_row, target_col, 'right')
    } else {
        if (key_key == 'Q' || key_key == 'q' || key_key == '') { 
            cancel_queue()
            
        } else if (key_key == 'E' || key_key == 'e') {
            undo_queued_move(); //undo last queued move and return active cell to it
            
        }
    };
}

function cancel_queue() { //undo all queued moves
    server_receives_cancel_queue(local_player_id)
    local_move_queue.length = 0 // empty the queue list. Do not bother updating active cell location
    render_board();
}

function undo_queued_move() { //undo last queued move and return active cell to it
    if (local_move_queue.length > 0) {
        let popped = local_move_queue.pop();
        
        active_cell[0] = popped.row;
        active_cell[1] = popped.col;
        
        server_receives_undo_queued_move(local_player_id, popped.id)

        render_board();
    }
}

function weighted_choice(arr_options) {
//Given an array of objects containing a key 'weight' containing a non-negative number. The bigger the number, the more likely it is to be picked
    let total_weight = 0; 
    arr_options.forEach(option => { total_weight += Math.max(option.weight,0) }); // sum up the individual weights to determine the scale of our randrange

    let rand_weight = Math.random()*total_weight;

    let traversed_weight = 0, arr_pos = -1;
    while(traversed_weight < rand_weight && arr_pos < arr_options.length - 1) {
        arr_pos++;
        traversed_weight += arr_options[arr_pos].weight
    }
    return arr_options[arr_pos]

}

function test_weighted_choice() {
    let num_tests = 10000;
    let weighted_choice_data = [
        {'value1':'value_0', 'other_val_1':'test', 'weight':0}, // 0 should never be selected
        {'value1':'value_1', 'other_val_1':'test', 'weight':1},
        {'value1':'value_2', 'other_val_1':'test', 'weight':2},
        {'value1':'value_3', 'other_val_1':'test', 'weight':3},
        {'value1':'value_4', 'other_val_1':'test', 'weight':4},
        {'value1':'value_5', 'other_val_1':'test', 'weight':5},
        {'value1':'value_6', 'other_val_1':'test', 'weight':6},
        {'value1':'value_7', 'other_val_1':'test', 'weight':7},
        {'value1':'value_8', 'other_val_1':'test', 'weight':8},
        {'value1':'value_9', 'other_val_1':'test', 'weight':9}, // a weight of 9 should be selected ~9x as often as a weight of 1
        {'value1':'value_10', 'other_val_1':'test', 'weight':-10}, // should default to 0
    ];

    let arr_results = new Array(11).fill(0);

    for (let i = 0; i < num_tests; i++) {
        let result = weighted_choice(weighted_choice_data)
        arr_results[result.weight] ++
    };
    console.log(arr_results) // results with a sample size of 10,000: [0, 240, 447, 711, 851, 1127, 1322, 1586, 1710, 2006, 0]
}
      

function add_to_queue(source_row, source_col, target_row, target_col, dir) {
    local_queued_move_counter ++;
    let new_move = {'id':local_queued_move_counter, 'row':active_cell[0], 'col':active_cell[1], 'dir':dir, 'queuer':0,'target_row':target_row, 'target_col':target_col, 'action':move_mode}
    //to do queuer: 0 assumes player is always player 0
    server_receives_new_queued_moved(local_player_id, new_move)
    local_move_queue.push(new_move) //TODO owner = 0 is a stand-in for the user, for now
    
    if (move_mode == ACTION_MOVE_HALF) {move_mode = ACTION_MOVE_NORMAL} // if we had right clicked to move half and half applied the half move in the above step, then we want to revert to normal movement mode

    // Update the active/highlighted cell to match the new target
    active_cell[0] = target_row
    active_cell[1] = target_col
    
    render_board();

}
// Adapted from https://www.w3schools.com/howto/howto_js_draggable.asp, but my version's even cooler
function drag_canvas_event_handler(canvas_element) {
    let x_dest = 0, y_dest = 0, x_origin = 0, y_origin = 0;
    let mousedown_timer = null; // delay drag until the mouse has been briefly held down, to avoid accidental dragging during normal play
    canvas_element.onmousedown = mouse_down_on_canvas;

    function mouse_down_on_canvas(event) {
        if (event.button == 0) { // if left click
            event = event || window.event;
            event.preventDefault();

            mousedown_timer = Date.now()

            x_origin = event.clientX;
            y_origin = event.clientY;

            document.onmouseup = stop_dragging; // stop dragging when the mouse is unclicked (even if it's outside the bounds of the canvas) 
            document.onmousemove = drag_canvas; // drag whenever the mouse is clicked is moving (even if it's outside the bounds of the canvas) 
        };
    }

    function drag_canvas(event) {
        event = event || window.event;
        event.preventDefault();

        if (Date.now() - mousedown_timer > 125) {
            // calculate the new cursor position:
            x_dest = x_origin - event.clientX;
            y_dest = y_origin - event.clientY;
            x_origin = event.clientX;
            y_origin = event.clientY;

            // set the element's new position:
            canvas_element.style.top = (canvas_element.offsetTop - y_dest) + "px";
            canvas_element.style.left = (canvas_element.offsetLeft - x_dest) + "px";
        }
    }

    function stop_dragging() { // stop moving when mouse button is released:    
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

function toggle_pause() { //single player mode only. 
// In order to keep the faux separation of server and client, this function cannot access game_on directly. 
// This function would become an event handler when node mode activated
    let new_pause_status = toggle_pause_server() 
    
    // Update the button text to indicate the action it would perform
    document.getElementById('pause_resume_button').innerText = new_pause_status ? 'Pause' : 'Play';
}

function client_receives_game_state_here(json) {
    if (cells_client.length > 0) {    
        //console.log('Attempting a new way of rendering')
        
        game_tick_local = json.game.turn // update the turn count
        
        // Update the board to contain only info the player should currently be able to see
        cells_client.forEach(cell => {
            cell.owner = null;
            cell.troops = 0;
            cell.entity = null;
            cell.terrain = null;
            cell.visible = false;
        });
                
        json.board.forEach(new_cell => {
            if('owner' in new_cell) { cells_client[new_cell.id].owner = new_cell.owner };
            if('troops' in new_cell) { cells_client[new_cell.id].troops = new_cell.troops };
            if('entity' in new_cell) { cells_client[new_cell.id].entity = new_cell.entity };
            if('terrain' in new_cell) { cells_client[new_cell.id].terrain = new_cell.terrain };
            if('visible' in new_cell) { cells_client[new_cell.id].visible = new_cell.visible };
        });

        let scoreboard_data = json.scoreboard;
        scoreboard_data.sort((a, b) => (a.troops > b.troops) ? -1 : 1); //sort by troops, descending
        
        const table_body = scoreboard_data.map(value => {
            let bg_color = value.admirals == 0 ? CellClient.neutral_entity_color : value.color; // remove the player's fleet color from the scoreboard if they're out of the game
            return (
                `<tr bgcolor="${bg_color}">
                <td style="color:#FFFFFF;text-align:center">${value.display_name}</td>
                <td style="color:#FFFFFF;text-align:center">${value.admirals}</td>
                <td style="color:#FFFFFF;text-align:center">${value.ships}</td>
                <td style="color:#FFFFFF;text-align:center">${value.troops}</td>
                </tr>`
            );
        }).join('');
        document.getElementById('scoreboard_body').innerHTML = table_body;
    
    } else {console.log('Not ready yet!')}

    
    // Update the local move queue - if one or more moves has been removed by the server, remove them from the front of the local queue
    let new_min_queue_id = json.game.next_queue_id

    if (new_min_queue_id == '-1') {
        //console.log('got here')
        local_move_queue.length = 0;
    } else {
        let not_caught_up = true;
        while (local_move_queue.length>0 && not_caught_up) {
            if (local_move_queue[0].id < new_min_queue_id) {
                local_move_queue.shift();
            } else { not_caught_up = false; } //escape 
        };
    }
    
}