"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _jest = _interopRequireDefault(require("jest"));

function main() {
  return _regenerator["default"].async(function main$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.next = 2;
          return _regenerator["default"].awrap(_jest["default"].runCLI());

        case 2:
        case "end":
          return _context.stop();
      }
    }
  });
}

main();