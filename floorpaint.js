const TILE_SIZE = 16;
const BLACK = '#000000';
const BLUE = '#3030f0';
const GREEN = '#008000';
const RED = '#f00000';

function Tile() {
    this.state = 0;
}
Tile.prototype = {
    activate: function() {
        if (this.state == 0) {
            this.state = 1;
            return true;
        }
        return false;
    },
    block: function() {
        if (this.state == 0) {
            this.state = 2;
            return true;
        }
        return false;
    },
    deactivate: function() {
        if (this.state == 1) {
            this.state = 0;
            return true;
        }
        return false;
    },
    getColor: function() {
        return [BLUE, GREEN, BLACK][this.state];
    },
}

function Room($status, size, obstacles) {
    this.$status = $status;
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
        var blocked = this.tiles[location.join(',')].block();
        if (blocked) {
            obstacles--;
        }
    }
}
Room.prototype = {
    activate: function(location) {
        key = location.join(',');
        var activated = this.tiles[key] && this.tiles[key].activate();
        if (activated) {
            this.active_tiles++;
        }
        return activated;
    },
    deactivate: function(location) {
        var deactivated = this.tiles[location.join(',')].deactivate();
        if (deactivated) {
            this.active_tiles--;
        }
        return deactivated;
    },
    isComplete: function() {
        return (this.active_tiles == this.active_tiles_max);
    },
    reset: function() {
        for (var key in this.tiles) {
            this.tiles[key].deactivate();
        }
        this.active_tiles = 0;
    },
    draw: function(context) {
        for (var x = 0; x < this.width; x++) {
            for (var y = 0; y < this.height; y++) {
                context.fillStyle = this.tiles[[x,y].join(',')].getColor();
                context.fillRect(x * (TILE_SIZE + 1) + 1,
                                 y * (TILE_SIZE + 1) + 1,
                                 TILE_SIZE, TILE_SIZE);
            }
        }
        if (this.isComplete()) {
            this.$status.text('you win!');
        }
    },
}

function Player(room, start_location, context) {
    this.room = room;
    this.start_location = start_location;
    this.context = context;
    this.location = start_location;
    this.move([0,0]);
}
Player.prototype = {
    draw: function(context) {
        this.room.draw(context);
        var x = this.location[0], y = this.location[1];
        context.fillStyle = RED;
        context.fillRect(x * (TILE_SIZE + 1) + 1,
                         y * (TILE_SIZE + 1) + 1,
                         TILE_SIZE, TILE_SIZE);
    },
    move: function(direction) {
        var dx = direction[0], dy = direction[1];
        var new_location = [this.location[0] + dx,
                            this.location[1] + dy];
        var activated = this.room.activate(new_location);
        if (activated) {
            this.location = new_location;
        }
        this.draw(this.context);
        return activated;
    },
    reset: function() {
        this.room.reset();
        this.location = this.start_location;
        this.move([0,0]);
        this.draw(this.context);
    },
}

function handleKey(ev, player) {
    var direction;
    switch (ev.keyCode) {
        case 37: // left
            direction = [-1,0];
            break;
        case 38: // up
            direction = [0,-1];
            break;
        case 39: // right
            direction = [1,0];
            break;
        case 40: // down
            direction = [0,1];
            break;
    }
    if (direction) {
        player.move(direction);
    }
    return true;
}

function hasSolution(room, location) {
    var activated = room.activate(location);
    if (!activated) {
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

$(document).ready(function() {
    $document = $(document)
    context = $('#game')[0].getContext('2d');
    $status = $('#status');
    room = new Room($status, [6,6]);
    player = new Player(room, [0,0], context);
    handleKeyCallback = function(ev) {
        handleKey(ev, player);
    };
    $('#reset').click(function() {
        player.reset();
        $status.text(" ");
    });
    $('#check').click(function() {
        $status.text("checking...");
        $document.unbind('keydown');
        room.reset();
        $status.text(hasSolution(player.room, [0,0]) ? 'yup!' : 'nope.');
        player.reset();
        $document.keydown(handleKeyCallback);
    });
    $document.keydown(handleKeyCallback);
});
