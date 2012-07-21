var ctx, player;
var TILE_SIZE = 16;
var BLACK = '#000000';
var BLUE = '#3030f0';
var GREEN = '#008000';
var RED = '#f00000';
var KEY_LEFT = 37;
var KEY_UP = 38;
var KEY_RIGHT = 39;
var KEY_DOWN = 40;

function Tile() {
    this.state = 0;
}
Tile.prototype = {
    activate: function() {
        if (this.state == 0) {
            this.state = 1;
        }
        else {
            throw 'NOPE';
        }
    },
    block: function() {
        if (this.state == 0) {
            this.state = 2;
        }
        else {
            throw 'NOPE';
        }
    },
    deactivate: function() {
        if (this.state == 1) {
            this.state = 0;
        }
    },
    getColor: function() {
        return [BLUE, GREEN, BLACK][this.state];
    },
}

function Room(size, obstacles) {
    this.width = size[0];
    this.height = size[1];
    if (typeof obstacles === 'undefined') {
        max_obstacles = Math.floor(this.width * this.height / 32);
        obstacles = 1 + Math.floor(Math.random() * max_obstacles);
    }
    this.active_tiles = 0;
    this.active_tiles_max = this.width * this.height - obstacles;

    // Create tiles
    this.tiles = {};
    for (var x = 0; x < this.width; x++) {
        for (var y = 0; y < this.height; y++) {
            this.tiles[[x,y].join(',')] = new Tile();
        }
    }

    // Create obstacles
    while (obstacles > 0) {
        var location = [
            Math.floor(Math.random() * this.width),
            Math.floor(Math.random() * this.height),
        ];
        try {
            this.tiles[location.join(',')].block();
            obstacles--;
        }
        catch (e) {
        }
    }
}
Room.prototype = {
    activate: function(location) {
        this.tiles[location.join(',')].activate();
        this.active_tiles++;
    },
    deactivate: function(location) {
        this.tiles[location.join(',')].deactivate();
        this.active_tiles--;
    },
    isComplete: function() {
        return (this.active_tiles > this.active_tiles_max);
    },
    reset: function() {
        for (var key in this.tiles) {
            this.tiles[key].deactivate();
        }
    },
    draw: function(ctx) {
        for (var x = 0; x < this.width; x++) {
            for (var y = 0; y < this.height; y++) {
                ctx.fillStyle = this.tiles[[x,y].join(',')].getColor();
                ctx.fillRect(x * (TILE_SIZE + 1) + 1,
                             y * (TILE_SIZE + 1) + 1,
                             TILE_SIZE, TILE_SIZE);
            }
        }
        if (this.room.isComplete()) {
            $('#win').show('fast');
        }
        else {
            $('#win').hide();
        }
    },
}

function Player(room, start_location) {
    this.room = room;
    if (typeof start_location === 'undefined') {
        start_location = [0,0];
    }
    this.start_location = start_location;
    this.location = start_location;
    this.move([0,0]);
}
Player.prototype = {
    draw: function(ctx) {
        this.room.draw(ctx);
        var x = this.location[0], y = this.location[1];
        ctx.fillStyle = RED;
        ctx.fillRect(x * (TILE_SIZE + 1) + 1,
                     y * (TILE_SIZE + 1) + 1,
                     TILE_SIZE, TILE_SIZE);
    },
    move: function(direction) {
        var dx = direction[0], dy = direction[1];
        var new_location = [this.location[0] + dx,
                            this.location[1] + dy];
        this.room.activate(new_location);
        this.location = new_location;
        this.draw(ctx);
    },
    reset: function() {
        this.room.reset();
        this.location = this.start_location;
        this.move([0,0]);
    },
}

function handleKey(ev) {
    switch (ev.keyCode) {
        case KEY_LEFT:
            direction = [-1,0];
            break;
        case KEY_UP:
            direction = [0,-1];
            break;
        case KEY_RIGHT:
            direction = [1,0];
            break;
        case KEY_DOWN:
            direction = [0,1];
            break;
        default:
            return true;
    }
    try {
        player.move(direction);
    }
    catch (e) {
        return true;
    }
}

function hasSolution(room, location) {
    if (typeof location === 'undefined') {
        location = [0,0];
    }
    try {
        room.activate(location);
    }
    catch (e) {
        return false;
    }
    if (room.isComplete()) {
        return true;
    }
    var x = location[0], y = location[1];
    result = (hasSolution(room, [x+1,y]) ||
              hasSolution(room, [x-1,y]) ||
              hasSolution(room, [x,y+1]) ||
              hasSolution(room, [x,y-1]));
    if (!result) {
        room.deactivate(location);
    }
    return result;
}

function newRoom() {
    player = new Player(new Room([8,8]));
    $('#reset').click(function() {
        player.reset()
    });
}

$(document).ready(function() {
    ctx = $('#game')[0].getContext('2d');
    $('#new').click(newRoom);
    $(document).keydown(handleKey);
    newRoom();
});
