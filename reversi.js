Array.prototype.sample = function() {
  return this[Math.floor(Math.random() * this.length)];
}

Reversi = {};

Reversi.Game = function(p1, p2) {
  this.board = new Reversi.Board();
  this.p1 = new Reversi.Player(p1);
  this.p2 = new Reversi.Player(p2);
  this.board.draw();
}

Reversi.Game.prototype.start = function() {
  this.turn(this.p1);
}

Reversi.Game.prototype.turn = function(player) {
  var self = this;

  if (this.isEnd()) { this.bless(); return; }

  if (player.ai) {
    cell = this.board.selectables(player).sample();
    if (cell) {
      this.board.reverse(player, cell[0], cell[1]);
      this.cleanup();
    }
    this.turn(this.nextPlayer(player));
  } else {
    $.each(this.board.selectables(player), function(_, cell) {
      self.board.$cell(cell).
        css({"background-color": "#2ecc71", "cursor": "pointer"}).
        on('click', function() {
          self.board.reverse(player, cell[0], cell[1]);
          self.cleanup();
          self.turn(self.nextPlayer(player));
        });
    });
  }
}

Reversi.Game.prototype.cleanup = function() {
  this.board.$cells().each(function() {
    $(this).css({"background-color": "", "cursor": ""}).off();
  });
  this.board.draw();
}

Reversi.Game.prototype.nextPlayer = function(player) {
  if (player === this.p1) return this.p2;
  else return this.p1;
}

Reversi.Game.prototype.isEnd = function() {
  return !this.board.hasEmpty() ||
         (this.board.selectables(this.p1).length == 0 &&
          this.board.selectables(this.p2).length == 0);
}

Reversi.Game.prototype.bless = function() {
  var status;
  status = this.board.status();
  if (status.black > status.white) {
    alert("You win! Congratulation!");
  } else if (status.black < status.white) {
    alert("You lose...");
  } else {
    alert("Draw.")
  }
}


Reversi.Stone = {
  white: true,
  black: false,
  empty: undefined,
  toEmoji: function(stone) {
    switch (stone) {
      case this.white: return '○';
      case this.black: return '●';
      default: return '　';
    }
  }
}


Reversi.Board = function() {
  this.width = 8;
  this.height = 8;
  this.cells = initCell(this.width, this.height);

  function initCell(width, height) {
    var ret = Array(height),
        i, j;
    for (j=0; j<height; j++) {
      ret[j] = Array(width);
      for (i=0; i<width; i++) {
        // Initial stones
        if (height/2-1 == j && width/2-1 == i || height/2 == j && width/2 == i) {
          ret[j][i] = Reversi.Stone.white;
        } else if (height/2 == j && width/2-1 == i || height/2-1 == j && width/2 == i)  {
          ret[j][i] = Reversi.Stone.black;
        }  else {
          ret[j][i] = Reversi.Stone.empty;
        }
      }
    }
    return ret;
  }
}

Reversi.Board.prototype.draw = function() {
  var i, j,
      table, tr;
  this.$table().remove();
  table = '<table>';
  for (j=0; j<this.height; j++) {
    tr = '<tr data-j="' + j + '">'
    for (i=0; i<this.width; i++) {
      tr += '<td data-j='+j+' data-i='+i+'>'+Reversi.Stone.toEmoji(this.cells[j][i])+'</td>';
    }
    tr += '</tr>';
    table += tr;
  }
  table += '</table>';
  this.$board().append(table);
}

Reversi.Board.prototype.status = function() {
  var i, j,
      ret = {white: 0, black: 0};
  for (j=0; j<this.height; j++) {
    for (i=0; i<this.width; i++) {
      switch(this.cells[j][i]) {
        case Reversi.Stone.white: ret.white += 1; break;
        case Reversi.Stone.black: ret.black += 1; break;
      }
    }
  }
  return ret;
}

Reversi.Board.prototype.$board = function() {
  return $("#board");
}

Reversi.Board.prototype.$table = function() {
  return $("#board table");
}

Reversi.Board.prototype.$cells = function() {
  return $("#board td");
}

Reversi.Board.prototype.$cell = function(cell) {
  return $("#board td[data-j="+cell[0]+"][data-i="+cell[1]+"]");
}

Reversi.Board.prototype.isEmpty = function(stone) {
  return Reversi.Stone.empty === stone;
}

Reversi.Board.prototype.hasEmpty = function() {
  var i, j,
      ret = false;
  end:
  for (j=0; j<this.height; j++) {
    for (i=0; i<this.width; i++) {
      if (this.isEmpty(this.cells[j][i])) {
        ret = true;
        break end;
      }
    }
  }
  return ret;
}

Reversi.Board.prototype.aroundEnemies = function(j, i, stone) {
  var enemyStone = !stone,
      aroundCells = [[j-1, i-1], [j-1, i+0], [j-1, i+1],
                     [j+0, i-1],             [j+0, i+1],
                     [j+1, i-1], [j+1, i+0], [j+1, i+1]];
      enemies = [],
      self = this;
  $.each(aroundCells, function(_, cell) {
    if (!self.sentry(cell) && self.cells[cell[0]][cell[1]] === enemyStone) {
      enemies.push([cell[0], cell[1]]);
    }
  });
  return enemies;
}

Reversi.Board.prototype.sentry = function(cell) {
  return cell[0] < 0 || cell[0] >= this.height ||
         cell[1] < 0 || cell[1] >= this.width
}

Reversi.Board.prototype.selectables = function(player) {
  var i, j,
      ret = [];
  for (j=0; j<this.height; j++) {
    for (i=0; i<this.width; i++) {
      if (this.isEmpty(this.cells[j][i]) &&
          this.reversables(j, i, player.stone).length > 0) {
        ret.push([j, i]);
      }
    }
  }
  return ret;
}

Reversi.Board.prototype.reversables = function(j, i, stone) {
  var ret = [],
      self = this;
  $.each(this.aroundEnemies(j, i, stone), function(_, enemy) {
    var _i, _j;
    _j = j - enemy[0];
    _i = i - enemy[1];
    enemy[0] = enemy[0] - _j;
    enemy[1] = enemy[1] - _i;
    while (!self.sentry(enemy)) {
      if (self.cells[enemy[0]][enemy[1]] === stone) {
        ret.push([enemy[0], enemy[1]]);
      }
      enemy[0] -= _j;
      enemy[1] -= _i;
    }
  });
  return ret;
}

Reversi.Board.prototype.reverse = function(player, j, i) {
  var reversables,
      self = this;
  this.cells[j][i] = player.stone;
  reversables = this.reversables(j, i, player.stone);
  $.each(reversables, function(_, reversable) {
    var _i, _j, __i, __j;
    _j = reversable[0] - j;
    _i = reversable[1] - i;
    if (_j != 0) { _j = _j / Math.abs(_j); }
    if (_i != 0) { _i = _i / Math.abs(_i); }
    __j = j + _j;
    __i = i + _i;
    while (__j != reversable[0] || __i != reversable[1]) {
      self.cells[__j][__i] = player.stone;
      __j += _j;
      __i += _i;
    }
  });
}

Reversi.Player = function(params) {
  this.ai = params.ai;
  this.stone = params.stone;
}

