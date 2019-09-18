(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
var bezierCurve = require('../lib/index')

window.bezierCurve = bezierCurve
},{"../lib/index":4}],2:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.bezierCurveToPolyline = bezierCurveToPolyline;
exports.getBezierCurveLength = getBezierCurveLength;
exports["default"] = void 0;

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var sqrt = Math.sqrt,
    pow = Math.pow,
    ceil = Math.ceil,
    abs = Math.abs; // Initialize the number of points per curve

var defaultSegmentPointsNum = 50;
/**
 * @example data structure of bezierCurve
 * bezierCurve = [
 *  // Starting point of the curve
 *  [10, 10],
 *  // BezierCurve segment data (controlPoint1, controlPoint2, endPoint)
 *  [
 *    [20, 20], [40, 20], [50, 10]
 *  ],
 *  ...
 * ]
 */

/**
 * @description               Abstract the curve as a polyline consisting of N points
 * @param {Array} bezierCurve bezierCurve data
 * @param {Number} precision  calculation accuracy. Recommended for 1-20. Default = 5
 * @return {Object}           Calculation results and related data
 * @return {Array}            Option.segmentPoints Point data that constitutes a polyline after calculation
 * @return {Number}           Option.cycles Number of iterations
 * @return {Number}           Option.rounds The number of recursions for the last iteration
 */

function abstractBezierCurveToPolyline(bezierCurve) {
  var precision = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 5;
  var segmentsNum = bezierCurve.length - 1;
  var startPoint = bezierCurve[0];
  var endPoint = bezierCurve[segmentsNum][2];
  var segments = bezierCurve.slice(1);
  var getSegmentTPointFuns = segments.map(function (seg, i) {
    var beginPoint = i === 0 ? startPoint : segments[i - 1][2];
    return createGetBezierCurveTPointFun.apply(void 0, [beginPoint].concat((0, _toConsumableArray2["default"])(seg)));
  }); // Initialize the curve to a polyline

  var segmentPointsNum = new Array(segmentsNum).fill(defaultSegmentPointsNum);
  var segmentPoints = getSegmentPointsByNum(getSegmentTPointFuns, segmentPointsNum); // Calculate uniformly distributed points by iteratively

  var result = calcUniformPointsByIteration(segmentPoints, getSegmentTPointFuns, segments, precision);
  result.segmentPoints.push(endPoint);
  return result;
}
/**
 * @description  Generate a method for obtaining corresponding point by t according to curve data
 * @param {Array} beginPoint    BezierCurve begin point. [x, y]
 * @param {Array} controlPoint1 BezierCurve controlPoint1. [x, y]
 * @param {Array} controlPoint2 BezierCurve controlPoint2. [x, y]
 * @param {Array} endPoint      BezierCurve end point. [x, y]
 * @return {Function} Expected function
 */


function createGetBezierCurveTPointFun(beginPoint, controlPoint1, controlPoint2, endPoint) {
  return function (t) {
    var tSubed1 = 1 - t;
    var tSubed1Pow3 = pow(tSubed1, 3);
    var tSubed1Pow2 = pow(tSubed1, 2);
    var tPow3 = pow(t, 3);
    var tPow2 = pow(t, 2);
    return [beginPoint[0] * tSubed1Pow3 + 3 * controlPoint1[0] * t * tSubed1Pow2 + 3 * controlPoint2[0] * tPow2 * tSubed1 + endPoint[0] * tPow3, beginPoint[1] * tSubed1Pow3 + 3 * controlPoint1[1] * t * tSubed1Pow2 + 3 * controlPoint2[1] * tPow2 * tSubed1 + endPoint[1] * tPow3];
  };
}
/**
 * @description Get the distance between two points
 * @param {Array} point1 BezierCurve begin point. [x, y]
 * @param {Array} point2 BezierCurve controlPoint1. [x, y]
 * @return {Number} Expected distance
 */


function getTwoPointDistance(_ref, _ref2) {
  var _ref3 = (0, _slicedToArray2["default"])(_ref, 2),
      ax = _ref3[0],
      ay = _ref3[1];

  var _ref4 = (0, _slicedToArray2["default"])(_ref2, 2),
      bx = _ref4[0],
      by = _ref4[1];

  return sqrt(pow(ax - bx, 2) + pow(ay - by, 2));
}
/**
 * @description Get the sum of the array of numbers
 * @param {Array} nums An array of numbers
 * @return {Number} Expected sum
 */


function getNumsSum(nums) {
  return nums.reduce(function (sum, num) {
    return sum + num;
  }, 0);
}
/**
 * @description Get the distance of multiple sets of points
 * @param {Array} segmentPoints Multiple sets of point data
 * @return {Array} Distance of multiple sets of point data
 */


function getSegmentPointsDistance(segmentPoints) {
  return segmentPoints.map(function (points, i) {
    return new Array(points.length - 1).fill(0).map(function (temp, j) {
      return getTwoPointDistance(points[j], points[j + 1]);
    });
  });
}
/**
 * @description Get the distance of multiple sets of points
 * @param {Array} segmentPoints Multiple sets of point data
 * @return {Array} Distance of multiple sets of point data
 */


function getSegmentPointsByNum(getSegmentTPointFuns, segmentPointsNum) {
  return getSegmentTPointFuns.map(function (getSegmentTPointFun, i) {
    var tGap = 1 / segmentPointsNum[i];
    return new Array(segmentPointsNum[i]).fill('').map(function (foo, j) {
      return getSegmentTPointFun(j * tGap);
    });
  });
}
/**
 * @description Get the sum of deviations between line segment and the average length
 * @param {Array} segmentPointsDistance Segment length of polyline
 * @param {Number} avgLength            Average length of the line segment
 * @return {Number} Deviations
 */


function getAllDeviations(segmentPointsDistance, avgLength) {
  return segmentPointsDistance.map(function (seg) {
    return seg.map(function (s) {
      return abs(s - avgLength);
    });
  }).map(function (seg) {
    return getNumsSum(seg);
  }).reduce(function (total, v) {
    return total + v;
  }, 0);
}
/**
 * @description Calculate uniformly distributed points by iteratively
 * @param {Array} segmentPoints        Multiple setd of points that make up a polyline
 * @param {Array} getSegmentTPointFuns Functions of get a point on the curve with t
 * @param {Array} segments             BezierCurve data
 * @param {Number} precision           Calculation accuracy
 * @return {Object} Calculation results and related data
 * @return {Array}  Option.segmentPoints Point data that constitutes a polyline after calculation
 * @return {Number} Option.cycles Number of iterations
 * @return {Number} Option.rounds The number of recursions for the last iteration
 */


function calcUniformPointsByIteration(segmentPoints, getSegmentTPointFuns, segments, precision) {
  // The number of loops for the current iteration
  var rounds = 4; // Number of iterations

  var cycles = 1;

  var _loop = function _loop() {
    // Recalculate the number of points per curve based on the last iteration data
    var totalPointsNum = segmentPoints.reduce(function (total, seg) {
      return total + seg.length;
    }, 0); // Add last points of segment to calc exact segment length

    segmentPoints.forEach(function (seg, i) {
      return seg.push(segments[i][2]);
    });
    var segmentPointsDistance = getSegmentPointsDistance(segmentPoints);
    var lineSegmentNum = segmentPointsDistance.reduce(function (total, seg) {
      return total + seg.length;
    }, 0);
    var segmentlength = segmentPointsDistance.map(function (seg) {
      return getNumsSum(seg);
    });
    var totalLength = getNumsSum(segmentlength);
    var avgLength = totalLength / lineSegmentNum; // Check if precision is reached

    var allDeviations = getAllDeviations(segmentPointsDistance, avgLength);
    if (allDeviations <= precision) return "break";
    totalPointsNum = ceil(avgLength / precision * totalPointsNum * 1.1);
    var segmentPointsNum = segmentlength.map(function (length) {
      return ceil(length / totalLength * totalPointsNum);
    }); // Calculate the points after redistribution

    segmentPoints = getSegmentPointsByNum(getSegmentTPointFuns, segmentPointsNum);
    totalPointsNum = segmentPoints.reduce(function (total, seg) {
      return total + seg.length;
    }, 0);
    var segmentPointsForLength = JSON.parse(JSON.stringify(segmentPoints));
    segmentPointsForLength.forEach(function (seg, i) {
      return seg.push(segments[i][2]);
    });
    segmentPointsDistance = getSegmentPointsDistance(segmentPointsForLength);
    lineSegmentNum = segmentPointsDistance.reduce(function (total, seg) {
      return total + seg.length;
    }, 0);
    segmentlength = segmentPointsDistance.map(function (seg) {
      return getNumsSum(seg);
    });
    totalLength = getNumsSum(segmentlength);
    avgLength = totalLength / lineSegmentNum;
    var stepSize = 1 / totalPointsNum / 10; // Recursively for each segment of the polyline

    getSegmentTPointFuns.forEach(function (getSegmentTPointFun, i) {
      var currentSegmentPointsNum = segmentPointsNum[i];
      var t = new Array(currentSegmentPointsNum).fill('').map(function (foo, j) {
        return j / segmentPointsNum[i];
      }); // Repeated recursive offset

      for (var r = 0; r < rounds; r++) {
        var distance = getSegmentPointsDistance([segmentPoints[i]])[0];
        var deviations = distance.map(function (d) {
          return d - avgLength;
        });
        var offset = 0;

        for (var j = 0; j < currentSegmentPointsNum; j++) {
          if (j === 0) return;
          offset += deviations[j - 1];
          t[j] -= stepSize * offset;
          if (t[j] > 1) t[j] = 1;
          if (t[j] < 0) t[j] = 0;
          segmentPoints[i][j] = getSegmentTPointFun(t[j]);
        }
      }
    });
    rounds *= 4;
    cycles++;
  };

  do {
    var _ret = _loop();

    if (_ret === "break") break;
  } while (rounds <= 1025);

  segmentPoints = segmentPoints.reduce(function (all, seg) {
    return all.concat(seg);
  }, []);
  return {
    segmentPoints: segmentPoints,
    cycles: cycles,
    rounds: rounds
  };
}
/**
 * @description Get the polyline corresponding to the Bezier curve
 * @param {Array} bezierCurve BezierCurve data
 * @param {Number} precision  Calculation accuracy. Recommended for 1-20. Default = 5
 * @return {Array|Boolean} Point data that constitutes a polyline after calculation (Invalid input will return false)
 */


function bezierCurveToPolyline(bezierCurve) {
  var precision = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 5;

  if (!bezierCurve) {
    console.error('bezierCurveToPolyline: Missing parameters!');
    return false;
  }

  if (!(bezierCurve instanceof Array)) {
    console.error('bezierCurveToPolyline: Parameter bezierCurve must be an array!');
    return false;
  }

  if (typeof precision !== 'number') {
    console.error('bezierCurveToPolyline: Parameter precision must be a number!');
    return false;
  }

  var _abstractBezierCurveT = abstractBezierCurveToPolyline(bezierCurve, precision),
      segmentPoints = _abstractBezierCurveT.segmentPoints;

  return segmentPoints;
}
/**
 * @description Get the bezier curve length
 * @param {Array} bezierCurve bezierCurve data
 * @param {Number} precision  calculation accuracy. Recommended for 5-10. Default = 5
 * @return {Number|Boolean} BezierCurve length (Invalid input will return false)
 */


function getBezierCurveLength(bezierCurve) {
  var precision = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 5;

  if (!bezierCurve) {
    console.error('getBezierCurveLength: Missing parameters!');
    return false;
  }

  if (!(bezierCurve instanceof Array)) {
    console.error('getBezierCurveLength: Parameter bezierCurve must be an array!');
    return false;
  }

  if (typeof precision !== 'number') {
    console.error('getBezierCurveLength: Parameter precision must be a number!');
    return false;
  }

  var _abstractBezierCurveT2 = abstractBezierCurveToPolyline(bezierCurve, precision),
      segmentPoints = _abstractBezierCurveT2.segmentPoints; // Calculate the total length of the points that make up the polyline


  var pointsDistance = getSegmentPointsDistance([segmentPoints])[0];
  var length = getNumsSum(pointsDistance);
  return length;
}

var _default = bezierCurveToPolyline;
exports["default"] = _default;
},{"@babel/runtime/helpers/interopRequireDefault":7,"@babel/runtime/helpers/slicedToArray":12,"@babel/runtime/helpers/toConsumableArray":13}],3:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

/**
 * @description Abstract the polyline formed by N points into a set of bezier curve
 * @param {Array} polyline A set of points that make up a polyline
 * @param {Boolean} close  Closed curve
 * @param {Number} offsetA Smoothness
 * @param {Number} offsetB Smoothness
 * @return {Array|Boolean} A set of bezier curve (Invalid input will return false)
 */
function polylineToBezierCurve(polyline) {
  var close = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
  var offsetA = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0.25;
  var offsetB = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0.25;

  if (!(polyline instanceof Array)) {
    console.error('polylineToBezierCurve: Parameter polyline must be an array!');
    return false;
  }

  if (polyline.length <= 2) {
    console.error('polylineToBezierCurve: Converting to a curve requires at least 3 points!');
    return false;
  }

  var startPoint = polyline[0];
  var bezierCurveLineNum = polyline.length - 1;
  var bezierCurvePoints = new Array(bezierCurveLineNum).fill(0).map(function (foo, i) {
    return [].concat((0, _toConsumableArray2["default"])(getBezierCurveLineControlPoints(polyline, i, close, offsetA, offsetB)), [polyline[i + 1]]);
  });
  if (close) closeBezierCurve(bezierCurvePoints, startPoint);
  bezierCurvePoints.unshift(polyline[0]);
  return bezierCurvePoints;
}
/**
 * @description Get the control points of the Bezier curve
 * @param {Array} polyline A set of points that make up a polyline
 * @param {Number} index   The index of which get controls points's point in polyline
 * @param {Boolean} close  Closed curve
 * @param {Number} offsetA Smoothness
 * @param {Number} offsetB Smoothness
 * @return {Array} Control points
 */


function getBezierCurveLineControlPoints(polyline, index) {
  var close = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
  var offsetA = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0.25;
  var offsetB = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 0.25;
  var pointNum = polyline.length;
  if (pointNum < 3 || index >= pointNum) return;
  var beforePointIndex = index - 1;
  if (beforePointIndex < 0) beforePointIndex = close ? pointNum + beforePointIndex : 0;
  var afterPointIndex = index + 1;
  if (afterPointIndex >= pointNum) afterPointIndex = close ? afterPointIndex - pointNum : pointNum - 1;
  var afterNextPointIndex = index + 2;
  if (afterNextPointIndex >= pointNum) afterNextPointIndex = close ? afterNextPointIndex - pointNum : pointNum - 1;
  var pointBefore = polyline[beforePointIndex];
  var pointMiddle = polyline[index];
  var pointAfter = polyline[afterPointIndex];
  var pointAfterNext = polyline[afterNextPointIndex];
  return [[pointMiddle[0] + offsetA * (pointAfter[0] - pointBefore[0]), pointMiddle[1] + offsetA * (pointAfter[1] - pointBefore[1])], [pointAfter[0] - offsetB * (pointAfterNext[0] - pointMiddle[0]), pointAfter[1] - offsetB * (pointAfterNext[1] - pointMiddle[1])]];
}
/**
 * @description Get the last curve of the closure
 * @param {Array} bezierCurve A set of sub-curve
 * @param {Array} startPoint  Start point
 * @return {Array} The last curve for closure
 */


function closeBezierCurve(bezierCurve, startPoint) {
  var firstSubCurve = bezierCurve[0];
  var lastSubCurve = bezierCurve.slice(-1)[0];
  bezierCurve.push([getSymmetryPoint(lastSubCurve[1], lastSubCurve[2]), getSymmetryPoint(firstSubCurve[0], startPoint), startPoint]);
  return bezierCurve;
}
/**
 * @description Get the symmetry point
 * @param {Array} point       Symmetric point
 * @param {Array} centerPoint Symmetric center
 * @return {Array} Symmetric point
 */


function getSymmetryPoint(point, centerPoint) {
  var _point = (0, _slicedToArray2["default"])(point, 2),
      px = _point[0],
      py = _point[1];

  var _centerPoint = (0, _slicedToArray2["default"])(centerPoint, 2),
      cx = _centerPoint[0],
      cy = _centerPoint[1];

  var minusX = cx - px;
  var minusY = cy - py;
  return [cx + minusX, cy + minusY];
}

var _default = polylineToBezierCurve;
exports["default"] = _default;
},{"@babel/runtime/helpers/interopRequireDefault":7,"@babel/runtime/helpers/slicedToArray":12,"@babel/runtime/helpers/toConsumableArray":13}],4:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "bezierCurveToPolyline", {
  enumerable: true,
  get: function get() {
    return _bezierCurveToPolyline.bezierCurveToPolyline;
  }
});
Object.defineProperty(exports, "getBezierCurveLength", {
  enumerable: true,
  get: function get() {
    return _bezierCurveToPolyline.getBezierCurveLength;
  }
});
Object.defineProperty(exports, "polylineToBezierCurve", {
  enumerable: true,
  get: function get() {
    return _polylineToBezierCurve["default"];
  }
});
exports["default"] = void 0;

var _bezierCurveToPolyline = require("./core/bezierCurveToPolyline");

var _polylineToBezierCurve = _interopRequireDefault(require("./core/polylineToBezierCurve"));

var _default = {
  bezierCurveToPolyline: _bezierCurveToPolyline.bezierCurveToPolyline,
  getBezierCurveLength: _bezierCurveToPolyline.getBezierCurveLength,
  polylineToBezierCurve: _polylineToBezierCurve["default"]
};
exports["default"] = _default;
},{"./core/bezierCurveToPolyline":2,"./core/polylineToBezierCurve":3,"@babel/runtime/helpers/interopRequireDefault":7}],5:[function(require,module,exports){
function _arrayWithHoles(arr) {
  if (Array.isArray(arr)) return arr;
}

module.exports = _arrayWithHoles;
},{}],6:[function(require,module,exports){
function _arrayWithoutHoles(arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) {
      arr2[i] = arr[i];
    }

    return arr2;
  }
}

module.exports = _arrayWithoutHoles;
},{}],7:[function(require,module,exports){
function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {
    "default": obj
  };
}

module.exports = _interopRequireDefault;
},{}],8:[function(require,module,exports){
function _iterableToArray(iter) {
  if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter);
}

module.exports = _iterableToArray;
},{}],9:[function(require,module,exports){
function _iterableToArrayLimit(arr, i) {
  if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) {
    return;
  }

  var _arr = [];
  var _n = true;
  var _d = false;
  var _e = undefined;

  try {
    for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
      _arr.push(_s.value);

      if (i && _arr.length === i) break;
    }
  } catch (err) {
    _d = true;
    _e = err;
  } finally {
    try {
      if (!_n && _i["return"] != null) _i["return"]();
    } finally {
      if (_d) throw _e;
    }
  }

  return _arr;
}

module.exports = _iterableToArrayLimit;
},{}],10:[function(require,module,exports){
function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance");
}

module.exports = _nonIterableRest;
},{}],11:[function(require,module,exports){
function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance");
}

module.exports = _nonIterableSpread;
},{}],12:[function(require,module,exports){
var arrayWithHoles = require("./arrayWithHoles");

var iterableToArrayLimit = require("./iterableToArrayLimit");

var nonIterableRest = require("./nonIterableRest");

function _slicedToArray(arr, i) {
  return arrayWithHoles(arr) || iterableToArrayLimit(arr, i) || nonIterableRest();
}

module.exports = _slicedToArray;
},{"./arrayWithHoles":5,"./iterableToArrayLimit":9,"./nonIterableRest":10}],13:[function(require,module,exports){
var arrayWithoutHoles = require("./arrayWithoutHoles");

var iterableToArray = require("./iterableToArray");

var nonIterableSpread = require("./nonIterableSpread");

function _toConsumableArray(arr) {
  return arrayWithoutHoles(arr) || iterableToArray(arr) || nonIterableSpread();
}

module.exports = _toConsumableArray;
},{"./arrayWithoutHoles":6,"./iterableToArray":8,"./nonIterableSpread":11}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJidWlsZC9lbnRyeS5qcyIsImxpYi9jb3JlL2JlemllckN1cnZlVG9Qb2x5bGluZS5qcyIsImxpYi9jb3JlL3BvbHlsaW5lVG9CZXppZXJDdXJ2ZS5qcyIsImxpYi9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9AYmFiZWwvcnVudGltZS9oZWxwZXJzL2FycmF5V2l0aEhvbGVzLmpzIiwibm9kZV9tb2R1bGVzL0BiYWJlbC9ydW50aW1lL2hlbHBlcnMvYXJyYXlXaXRob3V0SG9sZXMuanMiLCJub2RlX21vZHVsZXMvQGJhYmVsL3J1bnRpbWUvaGVscGVycy9pbnRlcm9wUmVxdWlyZURlZmF1bHQuanMiLCJub2RlX21vZHVsZXMvQGJhYmVsL3J1bnRpbWUvaGVscGVycy9pdGVyYWJsZVRvQXJyYXkuanMiLCJub2RlX21vZHVsZXMvQGJhYmVsL3J1bnRpbWUvaGVscGVycy9pdGVyYWJsZVRvQXJyYXlMaW1pdC5qcyIsIm5vZGVfbW9kdWxlcy9AYmFiZWwvcnVudGltZS9oZWxwZXJzL25vbkl0ZXJhYmxlUmVzdC5qcyIsIm5vZGVfbW9kdWxlcy9AYmFiZWwvcnVudGltZS9oZWxwZXJzL25vbkl0ZXJhYmxlU3ByZWFkLmpzIiwibm9kZV9tb2R1bGVzL0BiYWJlbC9ydW50aW1lL2hlbHBlcnMvc2xpY2VkVG9BcnJheS5qcyIsIm5vZGVfbW9kdWxlcy9AYmFiZWwvcnVudGltZS9oZWxwZXJzL3RvQ29uc3VtYWJsZUFycmF5LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBOztBQ0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOVVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9HQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJ2YXIgYmV6aWVyQ3VydmUgPSByZXF1aXJlKCcuLi9saWIvaW5kZXgnKVxuXG53aW5kb3cuYmV6aWVyQ3VydmUgPSBiZXppZXJDdXJ2ZSIsIlwidXNlIHN0cmljdFwiO1xuXG52YXIgX2ludGVyb3BSZXF1aXJlRGVmYXVsdCA9IHJlcXVpcmUoXCJAYmFiZWwvcnVudGltZS9oZWxwZXJzL2ludGVyb3BSZXF1aXJlRGVmYXVsdFwiKTtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHMuYmV6aWVyQ3VydmVUb1BvbHlsaW5lID0gYmV6aWVyQ3VydmVUb1BvbHlsaW5lO1xuZXhwb3J0cy5nZXRCZXppZXJDdXJ2ZUxlbmd0aCA9IGdldEJlemllckN1cnZlTGVuZ3RoO1xuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSB2b2lkIDA7XG5cbnZhciBfc2xpY2VkVG9BcnJheTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KHJlcXVpcmUoXCJAYmFiZWwvcnVudGltZS9oZWxwZXJzL3NsaWNlZFRvQXJyYXlcIikpO1xuXG52YXIgX3RvQ29uc3VtYWJsZUFycmF5MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQocmVxdWlyZShcIkBiYWJlbC9ydW50aW1lL2hlbHBlcnMvdG9Db25zdW1hYmxlQXJyYXlcIikpO1xuXG52YXIgc3FydCA9IE1hdGguc3FydCxcbiAgICBwb3cgPSBNYXRoLnBvdyxcbiAgICBjZWlsID0gTWF0aC5jZWlsLFxuICAgIGFicyA9IE1hdGguYWJzOyAvLyBJbml0aWFsaXplIHRoZSBudW1iZXIgb2YgcG9pbnRzIHBlciBjdXJ2ZVxuXG52YXIgZGVmYXVsdFNlZ21lbnRQb2ludHNOdW0gPSA1MDtcbi8qKlxuICogQGV4YW1wbGUgZGF0YSBzdHJ1Y3R1cmUgb2YgYmV6aWVyQ3VydmVcbiAqIGJlemllckN1cnZlID0gW1xuICogIC8vIFN0YXJ0aW5nIHBvaW50IG9mIHRoZSBjdXJ2ZVxuICogIFsxMCwgMTBdLFxuICogIC8vIEJlemllckN1cnZlIHNlZ21lbnQgZGF0YSAoY29udHJvbFBvaW50MSwgY29udHJvbFBvaW50MiwgZW5kUG9pbnQpXG4gKiAgW1xuICogICAgWzIwLCAyMF0sIFs0MCwgMjBdLCBbNTAsIDEwXVxuICogIF0sXG4gKiAgLi4uXG4gKiBdXG4gKi9cblxuLyoqXG4gKiBAZGVzY3JpcHRpb24gICAgICAgICAgICAgICBBYnN0cmFjdCB0aGUgY3VydmUgYXMgYSBwb2x5bGluZSBjb25zaXN0aW5nIG9mIE4gcG9pbnRzXG4gKiBAcGFyYW0ge0FycmF5fSBiZXppZXJDdXJ2ZSBiZXppZXJDdXJ2ZSBkYXRhXG4gKiBAcGFyYW0ge051bWJlcn0gcHJlY2lzaW9uICBjYWxjdWxhdGlvbiBhY2N1cmFjeS4gUmVjb21tZW5kZWQgZm9yIDEtMjAuIERlZmF1bHQgPSA1XG4gKiBAcmV0dXJuIHtPYmplY3R9ICAgICAgICAgICBDYWxjdWxhdGlvbiByZXN1bHRzIGFuZCByZWxhdGVkIGRhdGFcbiAqIEByZXR1cm4ge0FycmF5fSAgICAgICAgICAgIE9wdGlvbi5zZWdtZW50UG9pbnRzIFBvaW50IGRhdGEgdGhhdCBjb25zdGl0dXRlcyBhIHBvbHlsaW5lIGFmdGVyIGNhbGN1bGF0aW9uXG4gKiBAcmV0dXJuIHtOdW1iZXJ9ICAgICAgICAgICBPcHRpb24uY3ljbGVzIE51bWJlciBvZiBpdGVyYXRpb25zXG4gKiBAcmV0dXJuIHtOdW1iZXJ9ICAgICAgICAgICBPcHRpb24ucm91bmRzIFRoZSBudW1iZXIgb2YgcmVjdXJzaW9ucyBmb3IgdGhlIGxhc3QgaXRlcmF0aW9uXG4gKi9cblxuZnVuY3Rpb24gYWJzdHJhY3RCZXppZXJDdXJ2ZVRvUG9seWxpbmUoYmV6aWVyQ3VydmUpIHtcbiAgdmFyIHByZWNpc2lvbiA9IGFyZ3VtZW50cy5sZW5ndGggPiAxICYmIGFyZ3VtZW50c1sxXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzFdIDogNTtcbiAgdmFyIHNlZ21lbnRzTnVtID0gYmV6aWVyQ3VydmUubGVuZ3RoIC0gMTtcbiAgdmFyIHN0YXJ0UG9pbnQgPSBiZXppZXJDdXJ2ZVswXTtcbiAgdmFyIGVuZFBvaW50ID0gYmV6aWVyQ3VydmVbc2VnbWVudHNOdW1dWzJdO1xuICB2YXIgc2VnbWVudHMgPSBiZXppZXJDdXJ2ZS5zbGljZSgxKTtcbiAgdmFyIGdldFNlZ21lbnRUUG9pbnRGdW5zID0gc2VnbWVudHMubWFwKGZ1bmN0aW9uIChzZWcsIGkpIHtcbiAgICB2YXIgYmVnaW5Qb2ludCA9IGkgPT09IDAgPyBzdGFydFBvaW50IDogc2VnbWVudHNbaSAtIDFdWzJdO1xuICAgIHJldHVybiBjcmVhdGVHZXRCZXppZXJDdXJ2ZVRQb2ludEZ1bi5hcHBseSh2b2lkIDAsIFtiZWdpblBvaW50XS5jb25jYXQoKDAsIF90b0NvbnN1bWFibGVBcnJheTJbXCJkZWZhdWx0XCJdKShzZWcpKSk7XG4gIH0pOyAvLyBJbml0aWFsaXplIHRoZSBjdXJ2ZSB0byBhIHBvbHlsaW5lXG5cbiAgdmFyIHNlZ21lbnRQb2ludHNOdW0gPSBuZXcgQXJyYXkoc2VnbWVudHNOdW0pLmZpbGwoZGVmYXVsdFNlZ21lbnRQb2ludHNOdW0pO1xuICB2YXIgc2VnbWVudFBvaW50cyA9IGdldFNlZ21lbnRQb2ludHNCeU51bShnZXRTZWdtZW50VFBvaW50RnVucywgc2VnbWVudFBvaW50c051bSk7IC8vIENhbGN1bGF0ZSB1bmlmb3JtbHkgZGlzdHJpYnV0ZWQgcG9pbnRzIGJ5IGl0ZXJhdGl2ZWx5XG5cbiAgdmFyIHJlc3VsdCA9IGNhbGNVbmlmb3JtUG9pbnRzQnlJdGVyYXRpb24oc2VnbWVudFBvaW50cywgZ2V0U2VnbWVudFRQb2ludEZ1bnMsIHNlZ21lbnRzLCBwcmVjaXNpb24pO1xuICByZXN1bHQuc2VnbWVudFBvaW50cy5wdXNoKGVuZFBvaW50KTtcbiAgcmV0dXJuIHJlc3VsdDtcbn1cbi8qKlxuICogQGRlc2NyaXB0aW9uICBHZW5lcmF0ZSBhIG1ldGhvZCBmb3Igb2J0YWluaW5nIGNvcnJlc3BvbmRpbmcgcG9pbnQgYnkgdCBhY2NvcmRpbmcgdG8gY3VydmUgZGF0YVxuICogQHBhcmFtIHtBcnJheX0gYmVnaW5Qb2ludCAgICBCZXppZXJDdXJ2ZSBiZWdpbiBwb2ludC4gW3gsIHldXG4gKiBAcGFyYW0ge0FycmF5fSBjb250cm9sUG9pbnQxIEJlemllckN1cnZlIGNvbnRyb2xQb2ludDEuIFt4LCB5XVxuICogQHBhcmFtIHtBcnJheX0gY29udHJvbFBvaW50MiBCZXppZXJDdXJ2ZSBjb250cm9sUG9pbnQyLiBbeCwgeV1cbiAqIEBwYXJhbSB7QXJyYXl9IGVuZFBvaW50ICAgICAgQmV6aWVyQ3VydmUgZW5kIHBvaW50LiBbeCwgeV1cbiAqIEByZXR1cm4ge0Z1bmN0aW9ufSBFeHBlY3RlZCBmdW5jdGlvblxuICovXG5cblxuZnVuY3Rpb24gY3JlYXRlR2V0QmV6aWVyQ3VydmVUUG9pbnRGdW4oYmVnaW5Qb2ludCwgY29udHJvbFBvaW50MSwgY29udHJvbFBvaW50MiwgZW5kUG9pbnQpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uICh0KSB7XG4gICAgdmFyIHRTdWJlZDEgPSAxIC0gdDtcbiAgICB2YXIgdFN1YmVkMVBvdzMgPSBwb3codFN1YmVkMSwgMyk7XG4gICAgdmFyIHRTdWJlZDFQb3cyID0gcG93KHRTdWJlZDEsIDIpO1xuICAgIHZhciB0UG93MyA9IHBvdyh0LCAzKTtcbiAgICB2YXIgdFBvdzIgPSBwb3codCwgMik7XG4gICAgcmV0dXJuIFtiZWdpblBvaW50WzBdICogdFN1YmVkMVBvdzMgKyAzICogY29udHJvbFBvaW50MVswXSAqIHQgKiB0U3ViZWQxUG93MiArIDMgKiBjb250cm9sUG9pbnQyWzBdICogdFBvdzIgKiB0U3ViZWQxICsgZW5kUG9pbnRbMF0gKiB0UG93MywgYmVnaW5Qb2ludFsxXSAqIHRTdWJlZDFQb3czICsgMyAqIGNvbnRyb2xQb2ludDFbMV0gKiB0ICogdFN1YmVkMVBvdzIgKyAzICogY29udHJvbFBvaW50MlsxXSAqIHRQb3cyICogdFN1YmVkMSArIGVuZFBvaW50WzFdICogdFBvdzNdO1xuICB9O1xufVxuLyoqXG4gKiBAZGVzY3JpcHRpb24gR2V0IHRoZSBkaXN0YW5jZSBiZXR3ZWVuIHR3byBwb2ludHNcbiAqIEBwYXJhbSB7QXJyYXl9IHBvaW50MSBCZXppZXJDdXJ2ZSBiZWdpbiBwb2ludC4gW3gsIHldXG4gKiBAcGFyYW0ge0FycmF5fSBwb2ludDIgQmV6aWVyQ3VydmUgY29udHJvbFBvaW50MS4gW3gsIHldXG4gKiBAcmV0dXJuIHtOdW1iZXJ9IEV4cGVjdGVkIGRpc3RhbmNlXG4gKi9cblxuXG5mdW5jdGlvbiBnZXRUd29Qb2ludERpc3RhbmNlKF9yZWYsIF9yZWYyKSB7XG4gIHZhciBfcmVmMyA9ICgwLCBfc2xpY2VkVG9BcnJheTJbXCJkZWZhdWx0XCJdKShfcmVmLCAyKSxcbiAgICAgIGF4ID0gX3JlZjNbMF0sXG4gICAgICBheSA9IF9yZWYzWzFdO1xuXG4gIHZhciBfcmVmNCA9ICgwLCBfc2xpY2VkVG9BcnJheTJbXCJkZWZhdWx0XCJdKShfcmVmMiwgMiksXG4gICAgICBieCA9IF9yZWY0WzBdLFxuICAgICAgYnkgPSBfcmVmNFsxXTtcblxuICByZXR1cm4gc3FydChwb3coYXggLSBieCwgMikgKyBwb3coYXkgLSBieSwgMikpO1xufVxuLyoqXG4gKiBAZGVzY3JpcHRpb24gR2V0IHRoZSBzdW0gb2YgdGhlIGFycmF5IG9mIG51bWJlcnNcbiAqIEBwYXJhbSB7QXJyYXl9IG51bXMgQW4gYXJyYXkgb2YgbnVtYmVyc1xuICogQHJldHVybiB7TnVtYmVyfSBFeHBlY3RlZCBzdW1cbiAqL1xuXG5cbmZ1bmN0aW9uIGdldE51bXNTdW0obnVtcykge1xuICByZXR1cm4gbnVtcy5yZWR1Y2UoZnVuY3Rpb24gKHN1bSwgbnVtKSB7XG4gICAgcmV0dXJuIHN1bSArIG51bTtcbiAgfSwgMCk7XG59XG4vKipcbiAqIEBkZXNjcmlwdGlvbiBHZXQgdGhlIGRpc3RhbmNlIG9mIG11bHRpcGxlIHNldHMgb2YgcG9pbnRzXG4gKiBAcGFyYW0ge0FycmF5fSBzZWdtZW50UG9pbnRzIE11bHRpcGxlIHNldHMgb2YgcG9pbnQgZGF0YVxuICogQHJldHVybiB7QXJyYXl9IERpc3RhbmNlIG9mIG11bHRpcGxlIHNldHMgb2YgcG9pbnQgZGF0YVxuICovXG5cblxuZnVuY3Rpb24gZ2V0U2VnbWVudFBvaW50c0Rpc3RhbmNlKHNlZ21lbnRQb2ludHMpIHtcbiAgcmV0dXJuIHNlZ21lbnRQb2ludHMubWFwKGZ1bmN0aW9uIChwb2ludHMsIGkpIHtcbiAgICByZXR1cm4gbmV3IEFycmF5KHBvaW50cy5sZW5ndGggLSAxKS5maWxsKDApLm1hcChmdW5jdGlvbiAodGVtcCwgaikge1xuICAgICAgcmV0dXJuIGdldFR3b1BvaW50RGlzdGFuY2UocG9pbnRzW2pdLCBwb2ludHNbaiArIDFdKTtcbiAgICB9KTtcbiAgfSk7XG59XG4vKipcbiAqIEBkZXNjcmlwdGlvbiBHZXQgdGhlIGRpc3RhbmNlIG9mIG11bHRpcGxlIHNldHMgb2YgcG9pbnRzXG4gKiBAcGFyYW0ge0FycmF5fSBzZWdtZW50UG9pbnRzIE11bHRpcGxlIHNldHMgb2YgcG9pbnQgZGF0YVxuICogQHJldHVybiB7QXJyYXl9IERpc3RhbmNlIG9mIG11bHRpcGxlIHNldHMgb2YgcG9pbnQgZGF0YVxuICovXG5cblxuZnVuY3Rpb24gZ2V0U2VnbWVudFBvaW50c0J5TnVtKGdldFNlZ21lbnRUUG9pbnRGdW5zLCBzZWdtZW50UG9pbnRzTnVtKSB7XG4gIHJldHVybiBnZXRTZWdtZW50VFBvaW50RnVucy5tYXAoZnVuY3Rpb24gKGdldFNlZ21lbnRUUG9pbnRGdW4sIGkpIHtcbiAgICB2YXIgdEdhcCA9IDEgLyBzZWdtZW50UG9pbnRzTnVtW2ldO1xuICAgIHJldHVybiBuZXcgQXJyYXkoc2VnbWVudFBvaW50c051bVtpXSkuZmlsbCgnJykubWFwKGZ1bmN0aW9uIChmb28sIGopIHtcbiAgICAgIHJldHVybiBnZXRTZWdtZW50VFBvaW50RnVuKGogKiB0R2FwKTtcbiAgICB9KTtcbiAgfSk7XG59XG4vKipcbiAqIEBkZXNjcmlwdGlvbiBHZXQgdGhlIHN1bSBvZiBkZXZpYXRpb25zIGJldHdlZW4gbGluZSBzZWdtZW50IGFuZCB0aGUgYXZlcmFnZSBsZW5ndGhcbiAqIEBwYXJhbSB7QXJyYXl9IHNlZ21lbnRQb2ludHNEaXN0YW5jZSBTZWdtZW50IGxlbmd0aCBvZiBwb2x5bGluZVxuICogQHBhcmFtIHtOdW1iZXJ9IGF2Z0xlbmd0aCAgICAgICAgICAgIEF2ZXJhZ2UgbGVuZ3RoIG9mIHRoZSBsaW5lIHNlZ21lbnRcbiAqIEByZXR1cm4ge051bWJlcn0gRGV2aWF0aW9uc1xuICovXG5cblxuZnVuY3Rpb24gZ2V0QWxsRGV2aWF0aW9ucyhzZWdtZW50UG9pbnRzRGlzdGFuY2UsIGF2Z0xlbmd0aCkge1xuICByZXR1cm4gc2VnbWVudFBvaW50c0Rpc3RhbmNlLm1hcChmdW5jdGlvbiAoc2VnKSB7XG4gICAgcmV0dXJuIHNlZy5tYXAoZnVuY3Rpb24gKHMpIHtcbiAgICAgIHJldHVybiBhYnMocyAtIGF2Z0xlbmd0aCk7XG4gICAgfSk7XG4gIH0pLm1hcChmdW5jdGlvbiAoc2VnKSB7XG4gICAgcmV0dXJuIGdldE51bXNTdW0oc2VnKTtcbiAgfSkucmVkdWNlKGZ1bmN0aW9uICh0b3RhbCwgdikge1xuICAgIHJldHVybiB0b3RhbCArIHY7XG4gIH0sIDApO1xufVxuLyoqXG4gKiBAZGVzY3JpcHRpb24gQ2FsY3VsYXRlIHVuaWZvcm1seSBkaXN0cmlidXRlZCBwb2ludHMgYnkgaXRlcmF0aXZlbHlcbiAqIEBwYXJhbSB7QXJyYXl9IHNlZ21lbnRQb2ludHMgICAgICAgIE11bHRpcGxlIHNldGQgb2YgcG9pbnRzIHRoYXQgbWFrZSB1cCBhIHBvbHlsaW5lXG4gKiBAcGFyYW0ge0FycmF5fSBnZXRTZWdtZW50VFBvaW50RnVucyBGdW5jdGlvbnMgb2YgZ2V0IGEgcG9pbnQgb24gdGhlIGN1cnZlIHdpdGggdFxuICogQHBhcmFtIHtBcnJheX0gc2VnbWVudHMgICAgICAgICAgICAgQmV6aWVyQ3VydmUgZGF0YVxuICogQHBhcmFtIHtOdW1iZXJ9IHByZWNpc2lvbiAgICAgICAgICAgQ2FsY3VsYXRpb24gYWNjdXJhY3lcbiAqIEByZXR1cm4ge09iamVjdH0gQ2FsY3VsYXRpb24gcmVzdWx0cyBhbmQgcmVsYXRlZCBkYXRhXG4gKiBAcmV0dXJuIHtBcnJheX0gIE9wdGlvbi5zZWdtZW50UG9pbnRzIFBvaW50IGRhdGEgdGhhdCBjb25zdGl0dXRlcyBhIHBvbHlsaW5lIGFmdGVyIGNhbGN1bGF0aW9uXG4gKiBAcmV0dXJuIHtOdW1iZXJ9IE9wdGlvbi5jeWNsZXMgTnVtYmVyIG9mIGl0ZXJhdGlvbnNcbiAqIEByZXR1cm4ge051bWJlcn0gT3B0aW9uLnJvdW5kcyBUaGUgbnVtYmVyIG9mIHJlY3Vyc2lvbnMgZm9yIHRoZSBsYXN0IGl0ZXJhdGlvblxuICovXG5cblxuZnVuY3Rpb24gY2FsY1VuaWZvcm1Qb2ludHNCeUl0ZXJhdGlvbihzZWdtZW50UG9pbnRzLCBnZXRTZWdtZW50VFBvaW50RnVucywgc2VnbWVudHMsIHByZWNpc2lvbikge1xuICAvLyBUaGUgbnVtYmVyIG9mIGxvb3BzIGZvciB0aGUgY3VycmVudCBpdGVyYXRpb25cbiAgdmFyIHJvdW5kcyA9IDQ7IC8vIE51bWJlciBvZiBpdGVyYXRpb25zXG5cbiAgdmFyIGN5Y2xlcyA9IDE7XG5cbiAgdmFyIF9sb29wID0gZnVuY3Rpb24gX2xvb3AoKSB7XG4gICAgLy8gUmVjYWxjdWxhdGUgdGhlIG51bWJlciBvZiBwb2ludHMgcGVyIGN1cnZlIGJhc2VkIG9uIHRoZSBsYXN0IGl0ZXJhdGlvbiBkYXRhXG4gICAgdmFyIHRvdGFsUG9pbnRzTnVtID0gc2VnbWVudFBvaW50cy5yZWR1Y2UoZnVuY3Rpb24gKHRvdGFsLCBzZWcpIHtcbiAgICAgIHJldHVybiB0b3RhbCArIHNlZy5sZW5ndGg7XG4gICAgfSwgMCk7IC8vIEFkZCBsYXN0IHBvaW50cyBvZiBzZWdtZW50IHRvIGNhbGMgZXhhY3Qgc2VnbWVudCBsZW5ndGhcblxuICAgIHNlZ21lbnRQb2ludHMuZm9yRWFjaChmdW5jdGlvbiAoc2VnLCBpKSB7XG4gICAgICByZXR1cm4gc2VnLnB1c2goc2VnbWVudHNbaV1bMl0pO1xuICAgIH0pO1xuICAgIHZhciBzZWdtZW50UG9pbnRzRGlzdGFuY2UgPSBnZXRTZWdtZW50UG9pbnRzRGlzdGFuY2Uoc2VnbWVudFBvaW50cyk7XG4gICAgdmFyIGxpbmVTZWdtZW50TnVtID0gc2VnbWVudFBvaW50c0Rpc3RhbmNlLnJlZHVjZShmdW5jdGlvbiAodG90YWwsIHNlZykge1xuICAgICAgcmV0dXJuIHRvdGFsICsgc2VnLmxlbmd0aDtcbiAgICB9LCAwKTtcbiAgICB2YXIgc2VnbWVudGxlbmd0aCA9IHNlZ21lbnRQb2ludHNEaXN0YW5jZS5tYXAoZnVuY3Rpb24gKHNlZykge1xuICAgICAgcmV0dXJuIGdldE51bXNTdW0oc2VnKTtcbiAgICB9KTtcbiAgICB2YXIgdG90YWxMZW5ndGggPSBnZXROdW1zU3VtKHNlZ21lbnRsZW5ndGgpO1xuICAgIHZhciBhdmdMZW5ndGggPSB0b3RhbExlbmd0aCAvIGxpbmVTZWdtZW50TnVtOyAvLyBDaGVjayBpZiBwcmVjaXNpb24gaXMgcmVhY2hlZFxuXG4gICAgdmFyIGFsbERldmlhdGlvbnMgPSBnZXRBbGxEZXZpYXRpb25zKHNlZ21lbnRQb2ludHNEaXN0YW5jZSwgYXZnTGVuZ3RoKTtcbiAgICBpZiAoYWxsRGV2aWF0aW9ucyA8PSBwcmVjaXNpb24pIHJldHVybiBcImJyZWFrXCI7XG4gICAgdG90YWxQb2ludHNOdW0gPSBjZWlsKGF2Z0xlbmd0aCAvIHByZWNpc2lvbiAqIHRvdGFsUG9pbnRzTnVtICogMS4xKTtcbiAgICB2YXIgc2VnbWVudFBvaW50c051bSA9IHNlZ21lbnRsZW5ndGgubWFwKGZ1bmN0aW9uIChsZW5ndGgpIHtcbiAgICAgIHJldHVybiBjZWlsKGxlbmd0aCAvIHRvdGFsTGVuZ3RoICogdG90YWxQb2ludHNOdW0pO1xuICAgIH0pOyAvLyBDYWxjdWxhdGUgdGhlIHBvaW50cyBhZnRlciByZWRpc3RyaWJ1dGlvblxuXG4gICAgc2VnbWVudFBvaW50cyA9IGdldFNlZ21lbnRQb2ludHNCeU51bShnZXRTZWdtZW50VFBvaW50RnVucywgc2VnbWVudFBvaW50c051bSk7XG4gICAgdG90YWxQb2ludHNOdW0gPSBzZWdtZW50UG9pbnRzLnJlZHVjZShmdW5jdGlvbiAodG90YWwsIHNlZykge1xuICAgICAgcmV0dXJuIHRvdGFsICsgc2VnLmxlbmd0aDtcbiAgICB9LCAwKTtcbiAgICB2YXIgc2VnbWVudFBvaW50c0Zvckxlbmd0aCA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoc2VnbWVudFBvaW50cykpO1xuICAgIHNlZ21lbnRQb2ludHNGb3JMZW5ndGguZm9yRWFjaChmdW5jdGlvbiAoc2VnLCBpKSB7XG4gICAgICByZXR1cm4gc2VnLnB1c2goc2VnbWVudHNbaV1bMl0pO1xuICAgIH0pO1xuICAgIHNlZ21lbnRQb2ludHNEaXN0YW5jZSA9IGdldFNlZ21lbnRQb2ludHNEaXN0YW5jZShzZWdtZW50UG9pbnRzRm9yTGVuZ3RoKTtcbiAgICBsaW5lU2VnbWVudE51bSA9IHNlZ21lbnRQb2ludHNEaXN0YW5jZS5yZWR1Y2UoZnVuY3Rpb24gKHRvdGFsLCBzZWcpIHtcbiAgICAgIHJldHVybiB0b3RhbCArIHNlZy5sZW5ndGg7XG4gICAgfSwgMCk7XG4gICAgc2VnbWVudGxlbmd0aCA9IHNlZ21lbnRQb2ludHNEaXN0YW5jZS5tYXAoZnVuY3Rpb24gKHNlZykge1xuICAgICAgcmV0dXJuIGdldE51bXNTdW0oc2VnKTtcbiAgICB9KTtcbiAgICB0b3RhbExlbmd0aCA9IGdldE51bXNTdW0oc2VnbWVudGxlbmd0aCk7XG4gICAgYXZnTGVuZ3RoID0gdG90YWxMZW5ndGggLyBsaW5lU2VnbWVudE51bTtcbiAgICB2YXIgc3RlcFNpemUgPSAxIC8gdG90YWxQb2ludHNOdW0gLyAxMDsgLy8gUmVjdXJzaXZlbHkgZm9yIGVhY2ggc2VnbWVudCBvZiB0aGUgcG9seWxpbmVcblxuICAgIGdldFNlZ21lbnRUUG9pbnRGdW5zLmZvckVhY2goZnVuY3Rpb24gKGdldFNlZ21lbnRUUG9pbnRGdW4sIGkpIHtcbiAgICAgIHZhciBjdXJyZW50U2VnbWVudFBvaW50c051bSA9IHNlZ21lbnRQb2ludHNOdW1baV07XG4gICAgICB2YXIgdCA9IG5ldyBBcnJheShjdXJyZW50U2VnbWVudFBvaW50c051bSkuZmlsbCgnJykubWFwKGZ1bmN0aW9uIChmb28sIGopIHtcbiAgICAgICAgcmV0dXJuIGogLyBzZWdtZW50UG9pbnRzTnVtW2ldO1xuICAgICAgfSk7IC8vIFJlcGVhdGVkIHJlY3Vyc2l2ZSBvZmZzZXRcblxuICAgICAgZm9yICh2YXIgciA9IDA7IHIgPCByb3VuZHM7IHIrKykge1xuICAgICAgICB2YXIgZGlzdGFuY2UgPSBnZXRTZWdtZW50UG9pbnRzRGlzdGFuY2UoW3NlZ21lbnRQb2ludHNbaV1dKVswXTtcbiAgICAgICAgdmFyIGRldmlhdGlvbnMgPSBkaXN0YW5jZS5tYXAoZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICByZXR1cm4gZCAtIGF2Z0xlbmd0aDtcbiAgICAgICAgfSk7XG4gICAgICAgIHZhciBvZmZzZXQgPSAwO1xuXG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgY3VycmVudFNlZ21lbnRQb2ludHNOdW07IGorKykge1xuICAgICAgICAgIGlmIChqID09PSAwKSByZXR1cm47XG4gICAgICAgICAgb2Zmc2V0ICs9IGRldmlhdGlvbnNbaiAtIDFdO1xuICAgICAgICAgIHRbal0gLT0gc3RlcFNpemUgKiBvZmZzZXQ7XG4gICAgICAgICAgaWYgKHRbal0gPiAxKSB0W2pdID0gMTtcbiAgICAgICAgICBpZiAodFtqXSA8IDApIHRbal0gPSAwO1xuICAgICAgICAgIHNlZ21lbnRQb2ludHNbaV1bal0gPSBnZXRTZWdtZW50VFBvaW50RnVuKHRbal0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gICAgcm91bmRzICo9IDQ7XG4gICAgY3ljbGVzKys7XG4gIH07XG5cbiAgZG8ge1xuICAgIHZhciBfcmV0ID0gX2xvb3AoKTtcblxuICAgIGlmIChfcmV0ID09PSBcImJyZWFrXCIpIGJyZWFrO1xuICB9IHdoaWxlIChyb3VuZHMgPD0gMTAyNSk7XG5cbiAgc2VnbWVudFBvaW50cyA9IHNlZ21lbnRQb2ludHMucmVkdWNlKGZ1bmN0aW9uIChhbGwsIHNlZykge1xuICAgIHJldHVybiBhbGwuY29uY2F0KHNlZyk7XG4gIH0sIFtdKTtcbiAgcmV0dXJuIHtcbiAgICBzZWdtZW50UG9pbnRzOiBzZWdtZW50UG9pbnRzLFxuICAgIGN5Y2xlczogY3ljbGVzLFxuICAgIHJvdW5kczogcm91bmRzXG4gIH07XG59XG4vKipcbiAqIEBkZXNjcmlwdGlvbiBHZXQgdGhlIHBvbHlsaW5lIGNvcnJlc3BvbmRpbmcgdG8gdGhlIEJlemllciBjdXJ2ZVxuICogQHBhcmFtIHtBcnJheX0gYmV6aWVyQ3VydmUgQmV6aWVyQ3VydmUgZGF0YVxuICogQHBhcmFtIHtOdW1iZXJ9IHByZWNpc2lvbiAgQ2FsY3VsYXRpb24gYWNjdXJhY3kuIFJlY29tbWVuZGVkIGZvciAxLTIwLiBEZWZhdWx0ID0gNVxuICogQHJldHVybiB7QXJyYXl8Qm9vbGVhbn0gUG9pbnQgZGF0YSB0aGF0IGNvbnN0aXR1dGVzIGEgcG9seWxpbmUgYWZ0ZXIgY2FsY3VsYXRpb24gKEludmFsaWQgaW5wdXQgd2lsbCByZXR1cm4gZmFsc2UpXG4gKi9cblxuXG5mdW5jdGlvbiBiZXppZXJDdXJ2ZVRvUG9seWxpbmUoYmV6aWVyQ3VydmUpIHtcbiAgdmFyIHByZWNpc2lvbiA9IGFyZ3VtZW50cy5sZW5ndGggPiAxICYmIGFyZ3VtZW50c1sxXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzFdIDogNTtcblxuICBpZiAoIWJlemllckN1cnZlKSB7XG4gICAgY29uc29sZS5lcnJvcignYmV6aWVyQ3VydmVUb1BvbHlsaW5lOiBNaXNzaW5nIHBhcmFtZXRlcnMhJyk7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgaWYgKCEoYmV6aWVyQ3VydmUgaW5zdGFuY2VvZiBBcnJheSkpIHtcbiAgICBjb25zb2xlLmVycm9yKCdiZXppZXJDdXJ2ZVRvUG9seWxpbmU6IFBhcmFtZXRlciBiZXppZXJDdXJ2ZSBtdXN0IGJlIGFuIGFycmF5IScpO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGlmICh0eXBlb2YgcHJlY2lzaW9uICE9PSAnbnVtYmVyJykge1xuICAgIGNvbnNvbGUuZXJyb3IoJ2JlemllckN1cnZlVG9Qb2x5bGluZTogUGFyYW1ldGVyIHByZWNpc2lvbiBtdXN0IGJlIGEgbnVtYmVyIScpO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHZhciBfYWJzdHJhY3RCZXppZXJDdXJ2ZVQgPSBhYnN0cmFjdEJlemllckN1cnZlVG9Qb2x5bGluZShiZXppZXJDdXJ2ZSwgcHJlY2lzaW9uKSxcbiAgICAgIHNlZ21lbnRQb2ludHMgPSBfYWJzdHJhY3RCZXppZXJDdXJ2ZVQuc2VnbWVudFBvaW50cztcblxuICByZXR1cm4gc2VnbWVudFBvaW50cztcbn1cbi8qKlxuICogQGRlc2NyaXB0aW9uIEdldCB0aGUgYmV6aWVyIGN1cnZlIGxlbmd0aFxuICogQHBhcmFtIHtBcnJheX0gYmV6aWVyQ3VydmUgYmV6aWVyQ3VydmUgZGF0YVxuICogQHBhcmFtIHtOdW1iZXJ9IHByZWNpc2lvbiAgY2FsY3VsYXRpb24gYWNjdXJhY3kuIFJlY29tbWVuZGVkIGZvciA1LTEwLiBEZWZhdWx0ID0gNVxuICogQHJldHVybiB7TnVtYmVyfEJvb2xlYW59IEJlemllckN1cnZlIGxlbmd0aCAoSW52YWxpZCBpbnB1dCB3aWxsIHJldHVybiBmYWxzZSlcbiAqL1xuXG5cbmZ1bmN0aW9uIGdldEJlemllckN1cnZlTGVuZ3RoKGJlemllckN1cnZlKSB7XG4gIHZhciBwcmVjaXNpb24gPSBhcmd1bWVudHMubGVuZ3RoID4gMSAmJiBhcmd1bWVudHNbMV0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1sxXSA6IDU7XG5cbiAgaWYgKCFiZXppZXJDdXJ2ZSkge1xuICAgIGNvbnNvbGUuZXJyb3IoJ2dldEJlemllckN1cnZlTGVuZ3RoOiBNaXNzaW5nIHBhcmFtZXRlcnMhJyk7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgaWYgKCEoYmV6aWVyQ3VydmUgaW5zdGFuY2VvZiBBcnJheSkpIHtcbiAgICBjb25zb2xlLmVycm9yKCdnZXRCZXppZXJDdXJ2ZUxlbmd0aDogUGFyYW1ldGVyIGJlemllckN1cnZlIG11c3QgYmUgYW4gYXJyYXkhJyk7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgaWYgKHR5cGVvZiBwcmVjaXNpb24gIT09ICdudW1iZXInKSB7XG4gICAgY29uc29sZS5lcnJvcignZ2V0QmV6aWVyQ3VydmVMZW5ndGg6IFBhcmFtZXRlciBwcmVjaXNpb24gbXVzdCBiZSBhIG51bWJlciEnKTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICB2YXIgX2Fic3RyYWN0QmV6aWVyQ3VydmVUMiA9IGFic3RyYWN0QmV6aWVyQ3VydmVUb1BvbHlsaW5lKGJlemllckN1cnZlLCBwcmVjaXNpb24pLFxuICAgICAgc2VnbWVudFBvaW50cyA9IF9hYnN0cmFjdEJlemllckN1cnZlVDIuc2VnbWVudFBvaW50czsgLy8gQ2FsY3VsYXRlIHRoZSB0b3RhbCBsZW5ndGggb2YgdGhlIHBvaW50cyB0aGF0IG1ha2UgdXAgdGhlIHBvbHlsaW5lXG5cblxuICB2YXIgcG9pbnRzRGlzdGFuY2UgPSBnZXRTZWdtZW50UG9pbnRzRGlzdGFuY2UoW3NlZ21lbnRQb2ludHNdKVswXTtcbiAgdmFyIGxlbmd0aCA9IGdldE51bXNTdW0ocG9pbnRzRGlzdGFuY2UpO1xuICByZXR1cm4gbGVuZ3RoO1xufVxuXG52YXIgX2RlZmF1bHQgPSBiZXppZXJDdXJ2ZVRvUG9seWxpbmU7XG5leHBvcnRzW1wiZGVmYXVsdFwiXSA9IF9kZWZhdWx0OyIsIlwidXNlIHN0cmljdFwiO1xuXG52YXIgX2ludGVyb3BSZXF1aXJlRGVmYXVsdCA9IHJlcXVpcmUoXCJAYmFiZWwvcnVudGltZS9oZWxwZXJzL2ludGVyb3BSZXF1aXJlRGVmYXVsdFwiKTtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gdm9pZCAwO1xuXG52YXIgX3NsaWNlZFRvQXJyYXkyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChyZXF1aXJlKFwiQGJhYmVsL3J1bnRpbWUvaGVscGVycy9zbGljZWRUb0FycmF5XCIpKTtcblxudmFyIF90b0NvbnN1bWFibGVBcnJheTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KHJlcXVpcmUoXCJAYmFiZWwvcnVudGltZS9oZWxwZXJzL3RvQ29uc3VtYWJsZUFycmF5XCIpKTtcblxuLyoqXG4gKiBAZGVzY3JpcHRpb24gQWJzdHJhY3QgdGhlIHBvbHlsaW5lIGZvcm1lZCBieSBOIHBvaW50cyBpbnRvIGEgc2V0IG9mIGJlemllciBjdXJ2ZVxuICogQHBhcmFtIHtBcnJheX0gcG9seWxpbmUgQSBzZXQgb2YgcG9pbnRzIHRoYXQgbWFrZSB1cCBhIHBvbHlsaW5lXG4gKiBAcGFyYW0ge0Jvb2xlYW59IGNsb3NlICBDbG9zZWQgY3VydmVcbiAqIEBwYXJhbSB7TnVtYmVyfSBvZmZzZXRBIFNtb290aG5lc3NcbiAqIEBwYXJhbSB7TnVtYmVyfSBvZmZzZXRCIFNtb290aG5lc3NcbiAqIEByZXR1cm4ge0FycmF5fEJvb2xlYW59IEEgc2V0IG9mIGJlemllciBjdXJ2ZSAoSW52YWxpZCBpbnB1dCB3aWxsIHJldHVybiBmYWxzZSlcbiAqL1xuZnVuY3Rpb24gcG9seWxpbmVUb0JlemllckN1cnZlKHBvbHlsaW5lKSB7XG4gIHZhciBjbG9zZSA9IGFyZ3VtZW50cy5sZW5ndGggPiAxICYmIGFyZ3VtZW50c1sxXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzFdIDogZmFsc2U7XG4gIHZhciBvZmZzZXRBID0gYXJndW1lbnRzLmxlbmd0aCA+IDIgJiYgYXJndW1lbnRzWzJdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMl0gOiAwLjI1O1xuICB2YXIgb2Zmc2V0QiA9IGFyZ3VtZW50cy5sZW5ndGggPiAzICYmIGFyZ3VtZW50c1szXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzNdIDogMC4yNTtcblxuICBpZiAoIShwb2x5bGluZSBpbnN0YW5jZW9mIEFycmF5KSkge1xuICAgIGNvbnNvbGUuZXJyb3IoJ3BvbHlsaW5lVG9CZXppZXJDdXJ2ZTogUGFyYW1ldGVyIHBvbHlsaW5lIG11c3QgYmUgYW4gYXJyYXkhJyk7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgaWYgKHBvbHlsaW5lLmxlbmd0aCA8PSAyKSB7XG4gICAgY29uc29sZS5lcnJvcigncG9seWxpbmVUb0JlemllckN1cnZlOiBDb252ZXJ0aW5nIHRvIGEgY3VydmUgcmVxdWlyZXMgYXQgbGVhc3QgMyBwb2ludHMhJyk7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgdmFyIHN0YXJ0UG9pbnQgPSBwb2x5bGluZVswXTtcbiAgdmFyIGJlemllckN1cnZlTGluZU51bSA9IHBvbHlsaW5lLmxlbmd0aCAtIDE7XG4gIHZhciBiZXppZXJDdXJ2ZVBvaW50cyA9IG5ldyBBcnJheShiZXppZXJDdXJ2ZUxpbmVOdW0pLmZpbGwoMCkubWFwKGZ1bmN0aW9uIChmb28sIGkpIHtcbiAgICByZXR1cm4gW10uY29uY2F0KCgwLCBfdG9Db25zdW1hYmxlQXJyYXkyW1wiZGVmYXVsdFwiXSkoZ2V0QmV6aWVyQ3VydmVMaW5lQ29udHJvbFBvaW50cyhwb2x5bGluZSwgaSwgY2xvc2UsIG9mZnNldEEsIG9mZnNldEIpKSwgW3BvbHlsaW5lW2kgKyAxXV0pO1xuICB9KTtcbiAgaWYgKGNsb3NlKSBjbG9zZUJlemllckN1cnZlKGJlemllckN1cnZlUG9pbnRzLCBzdGFydFBvaW50KTtcbiAgYmV6aWVyQ3VydmVQb2ludHMudW5zaGlmdChwb2x5bGluZVswXSk7XG4gIHJldHVybiBiZXppZXJDdXJ2ZVBvaW50cztcbn1cbi8qKlxuICogQGRlc2NyaXB0aW9uIEdldCB0aGUgY29udHJvbCBwb2ludHMgb2YgdGhlIEJlemllciBjdXJ2ZVxuICogQHBhcmFtIHtBcnJheX0gcG9seWxpbmUgQSBzZXQgb2YgcG9pbnRzIHRoYXQgbWFrZSB1cCBhIHBvbHlsaW5lXG4gKiBAcGFyYW0ge051bWJlcn0gaW5kZXggICBUaGUgaW5kZXggb2Ygd2hpY2ggZ2V0IGNvbnRyb2xzIHBvaW50cydzIHBvaW50IGluIHBvbHlsaW5lXG4gKiBAcGFyYW0ge0Jvb2xlYW59IGNsb3NlICBDbG9zZWQgY3VydmVcbiAqIEBwYXJhbSB7TnVtYmVyfSBvZmZzZXRBIFNtb290aG5lc3NcbiAqIEBwYXJhbSB7TnVtYmVyfSBvZmZzZXRCIFNtb290aG5lc3NcbiAqIEByZXR1cm4ge0FycmF5fSBDb250cm9sIHBvaW50c1xuICovXG5cblxuZnVuY3Rpb24gZ2V0QmV6aWVyQ3VydmVMaW5lQ29udHJvbFBvaW50cyhwb2x5bGluZSwgaW5kZXgpIHtcbiAgdmFyIGNsb3NlID0gYXJndW1lbnRzLmxlbmd0aCA+IDIgJiYgYXJndW1lbnRzWzJdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMl0gOiBmYWxzZTtcbiAgdmFyIG9mZnNldEEgPSBhcmd1bWVudHMubGVuZ3RoID4gMyAmJiBhcmd1bWVudHNbM10gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1szXSA6IDAuMjU7XG4gIHZhciBvZmZzZXRCID0gYXJndW1lbnRzLmxlbmd0aCA+IDQgJiYgYXJndW1lbnRzWzRdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbNF0gOiAwLjI1O1xuICB2YXIgcG9pbnROdW0gPSBwb2x5bGluZS5sZW5ndGg7XG4gIGlmIChwb2ludE51bSA8IDMgfHwgaW5kZXggPj0gcG9pbnROdW0pIHJldHVybjtcbiAgdmFyIGJlZm9yZVBvaW50SW5kZXggPSBpbmRleCAtIDE7XG4gIGlmIChiZWZvcmVQb2ludEluZGV4IDwgMCkgYmVmb3JlUG9pbnRJbmRleCA9IGNsb3NlID8gcG9pbnROdW0gKyBiZWZvcmVQb2ludEluZGV4IDogMDtcbiAgdmFyIGFmdGVyUG9pbnRJbmRleCA9IGluZGV4ICsgMTtcbiAgaWYgKGFmdGVyUG9pbnRJbmRleCA+PSBwb2ludE51bSkgYWZ0ZXJQb2ludEluZGV4ID0gY2xvc2UgPyBhZnRlclBvaW50SW5kZXggLSBwb2ludE51bSA6IHBvaW50TnVtIC0gMTtcbiAgdmFyIGFmdGVyTmV4dFBvaW50SW5kZXggPSBpbmRleCArIDI7XG4gIGlmIChhZnRlck5leHRQb2ludEluZGV4ID49IHBvaW50TnVtKSBhZnRlck5leHRQb2ludEluZGV4ID0gY2xvc2UgPyBhZnRlck5leHRQb2ludEluZGV4IC0gcG9pbnROdW0gOiBwb2ludE51bSAtIDE7XG4gIHZhciBwb2ludEJlZm9yZSA9IHBvbHlsaW5lW2JlZm9yZVBvaW50SW5kZXhdO1xuICB2YXIgcG9pbnRNaWRkbGUgPSBwb2x5bGluZVtpbmRleF07XG4gIHZhciBwb2ludEFmdGVyID0gcG9seWxpbmVbYWZ0ZXJQb2ludEluZGV4XTtcbiAgdmFyIHBvaW50QWZ0ZXJOZXh0ID0gcG9seWxpbmVbYWZ0ZXJOZXh0UG9pbnRJbmRleF07XG4gIHJldHVybiBbW3BvaW50TWlkZGxlWzBdICsgb2Zmc2V0QSAqIChwb2ludEFmdGVyWzBdIC0gcG9pbnRCZWZvcmVbMF0pLCBwb2ludE1pZGRsZVsxXSArIG9mZnNldEEgKiAocG9pbnRBZnRlclsxXSAtIHBvaW50QmVmb3JlWzFdKV0sIFtwb2ludEFmdGVyWzBdIC0gb2Zmc2V0QiAqIChwb2ludEFmdGVyTmV4dFswXSAtIHBvaW50TWlkZGxlWzBdKSwgcG9pbnRBZnRlclsxXSAtIG9mZnNldEIgKiAocG9pbnRBZnRlck5leHRbMV0gLSBwb2ludE1pZGRsZVsxXSldXTtcbn1cbi8qKlxuICogQGRlc2NyaXB0aW9uIEdldCB0aGUgbGFzdCBjdXJ2ZSBvZiB0aGUgY2xvc3VyZVxuICogQHBhcmFtIHtBcnJheX0gYmV6aWVyQ3VydmUgQSBzZXQgb2Ygc3ViLWN1cnZlXG4gKiBAcGFyYW0ge0FycmF5fSBzdGFydFBvaW50ICBTdGFydCBwb2ludFxuICogQHJldHVybiB7QXJyYXl9IFRoZSBsYXN0IGN1cnZlIGZvciBjbG9zdXJlXG4gKi9cblxuXG5mdW5jdGlvbiBjbG9zZUJlemllckN1cnZlKGJlemllckN1cnZlLCBzdGFydFBvaW50KSB7XG4gIHZhciBmaXJzdFN1YkN1cnZlID0gYmV6aWVyQ3VydmVbMF07XG4gIHZhciBsYXN0U3ViQ3VydmUgPSBiZXppZXJDdXJ2ZS5zbGljZSgtMSlbMF07XG4gIGJlemllckN1cnZlLnB1c2goW2dldFN5bW1ldHJ5UG9pbnQobGFzdFN1YkN1cnZlWzFdLCBsYXN0U3ViQ3VydmVbMl0pLCBnZXRTeW1tZXRyeVBvaW50KGZpcnN0U3ViQ3VydmVbMF0sIHN0YXJ0UG9pbnQpLCBzdGFydFBvaW50XSk7XG4gIHJldHVybiBiZXppZXJDdXJ2ZTtcbn1cbi8qKlxuICogQGRlc2NyaXB0aW9uIEdldCB0aGUgc3ltbWV0cnkgcG9pbnRcbiAqIEBwYXJhbSB7QXJyYXl9IHBvaW50ICAgICAgIFN5bW1ldHJpYyBwb2ludFxuICogQHBhcmFtIHtBcnJheX0gY2VudGVyUG9pbnQgU3ltbWV0cmljIGNlbnRlclxuICogQHJldHVybiB7QXJyYXl9IFN5bW1ldHJpYyBwb2ludFxuICovXG5cblxuZnVuY3Rpb24gZ2V0U3ltbWV0cnlQb2ludChwb2ludCwgY2VudGVyUG9pbnQpIHtcbiAgdmFyIF9wb2ludCA9ICgwLCBfc2xpY2VkVG9BcnJheTJbXCJkZWZhdWx0XCJdKShwb2ludCwgMiksXG4gICAgICBweCA9IF9wb2ludFswXSxcbiAgICAgIHB5ID0gX3BvaW50WzFdO1xuXG4gIHZhciBfY2VudGVyUG9pbnQgPSAoMCwgX3NsaWNlZFRvQXJyYXkyW1wiZGVmYXVsdFwiXSkoY2VudGVyUG9pbnQsIDIpLFxuICAgICAgY3ggPSBfY2VudGVyUG9pbnRbMF0sXG4gICAgICBjeSA9IF9jZW50ZXJQb2ludFsxXTtcblxuICB2YXIgbWludXNYID0gY3ggLSBweDtcbiAgdmFyIG1pbnVzWSA9IGN5IC0gcHk7XG4gIHJldHVybiBbY3ggKyBtaW51c1gsIGN5ICsgbWludXNZXTtcbn1cblxudmFyIF9kZWZhdWx0ID0gcG9seWxpbmVUb0JlemllckN1cnZlO1xuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSBfZGVmYXVsdDsiLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQgPSByZXF1aXJlKFwiQGJhYmVsL3J1bnRpbWUvaGVscGVycy9pbnRlcm9wUmVxdWlyZURlZmF1bHRcIik7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJiZXppZXJDdXJ2ZVRvUG9seWxpbmVcIiwge1xuICBlbnVtZXJhYmxlOiB0cnVlLFxuICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICByZXR1cm4gX2JlemllckN1cnZlVG9Qb2x5bGluZS5iZXppZXJDdXJ2ZVRvUG9seWxpbmU7XG4gIH1cbn0pO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiZ2V0QmV6aWVyQ3VydmVMZW5ndGhcIiwge1xuICBlbnVtZXJhYmxlOiB0cnVlLFxuICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICByZXR1cm4gX2JlemllckN1cnZlVG9Qb2x5bGluZS5nZXRCZXppZXJDdXJ2ZUxlbmd0aDtcbiAgfVxufSk7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJwb2x5bGluZVRvQmV6aWVyQ3VydmVcIiwge1xuICBlbnVtZXJhYmxlOiB0cnVlLFxuICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICByZXR1cm4gX3BvbHlsaW5lVG9CZXppZXJDdXJ2ZVtcImRlZmF1bHRcIl07XG4gIH1cbn0pO1xuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSB2b2lkIDA7XG5cbnZhciBfYmV6aWVyQ3VydmVUb1BvbHlsaW5lID0gcmVxdWlyZShcIi4vY29yZS9iZXppZXJDdXJ2ZVRvUG9seWxpbmVcIik7XG5cbnZhciBfcG9seWxpbmVUb0JlemllckN1cnZlID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChyZXF1aXJlKFwiLi9jb3JlL3BvbHlsaW5lVG9CZXppZXJDdXJ2ZVwiKSk7XG5cbnZhciBfZGVmYXVsdCA9IHtcbiAgYmV6aWVyQ3VydmVUb1BvbHlsaW5lOiBfYmV6aWVyQ3VydmVUb1BvbHlsaW5lLmJlemllckN1cnZlVG9Qb2x5bGluZSxcbiAgZ2V0QmV6aWVyQ3VydmVMZW5ndGg6IF9iZXppZXJDdXJ2ZVRvUG9seWxpbmUuZ2V0QmV6aWVyQ3VydmVMZW5ndGgsXG4gIHBvbHlsaW5lVG9CZXppZXJDdXJ2ZTogX3BvbHlsaW5lVG9CZXppZXJDdXJ2ZVtcImRlZmF1bHRcIl1cbn07XG5leHBvcnRzW1wiZGVmYXVsdFwiXSA9IF9kZWZhdWx0OyIsImZ1bmN0aW9uIF9hcnJheVdpdGhIb2xlcyhhcnIpIHtcbiAgaWYgKEFycmF5LmlzQXJyYXkoYXJyKSkgcmV0dXJuIGFycjtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBfYXJyYXlXaXRoSG9sZXM7IiwiZnVuY3Rpb24gX2FycmF5V2l0aG91dEhvbGVzKGFycikge1xuICBpZiAoQXJyYXkuaXNBcnJheShhcnIpKSB7XG4gICAgZm9yICh2YXIgaSA9IDAsIGFycjIgPSBuZXcgQXJyYXkoYXJyLmxlbmd0aCk7IGkgPCBhcnIubGVuZ3RoOyBpKyspIHtcbiAgICAgIGFycjJbaV0gPSBhcnJbaV07XG4gICAgfVxuXG4gICAgcmV0dXJuIGFycjI7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBfYXJyYXlXaXRob3V0SG9sZXM7IiwiZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHtcbiAgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHtcbiAgICBcImRlZmF1bHRcIjogb2JqXG4gIH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdDsiLCJmdW5jdGlvbiBfaXRlcmFibGVUb0FycmF5KGl0ZXIpIHtcbiAgaWYgKFN5bWJvbC5pdGVyYXRvciBpbiBPYmplY3QoaXRlcikgfHwgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGl0ZXIpID09PSBcIltvYmplY3QgQXJndW1lbnRzXVwiKSByZXR1cm4gQXJyYXkuZnJvbShpdGVyKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBfaXRlcmFibGVUb0FycmF5OyIsImZ1bmN0aW9uIF9pdGVyYWJsZVRvQXJyYXlMaW1pdChhcnIsIGkpIHtcbiAgaWYgKCEoU3ltYm9sLml0ZXJhdG9yIGluIE9iamVjdChhcnIpIHx8IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChhcnIpID09PSBcIltvYmplY3QgQXJndW1lbnRzXVwiKSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHZhciBfYXJyID0gW107XG4gIHZhciBfbiA9IHRydWU7XG4gIHZhciBfZCA9IGZhbHNlO1xuICB2YXIgX2UgPSB1bmRlZmluZWQ7XG5cbiAgdHJ5IHtcbiAgICBmb3IgKHZhciBfaSA9IGFycltTeW1ib2wuaXRlcmF0b3JdKCksIF9zOyAhKF9uID0gKF9zID0gX2kubmV4dCgpKS5kb25lKTsgX24gPSB0cnVlKSB7XG4gICAgICBfYXJyLnB1c2goX3MudmFsdWUpO1xuXG4gICAgICBpZiAoaSAmJiBfYXJyLmxlbmd0aCA9PT0gaSkgYnJlYWs7XG4gICAgfVxuICB9IGNhdGNoIChlcnIpIHtcbiAgICBfZCA9IHRydWU7XG4gICAgX2UgPSBlcnI7XG4gIH0gZmluYWxseSB7XG4gICAgdHJ5IHtcbiAgICAgIGlmICghX24gJiYgX2lbXCJyZXR1cm5cIl0gIT0gbnVsbCkgX2lbXCJyZXR1cm5cIl0oKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgaWYgKF9kKSB0aHJvdyBfZTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gX2Fycjtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBfaXRlcmFibGVUb0FycmF5TGltaXQ7IiwiZnVuY3Rpb24gX25vbkl0ZXJhYmxlUmVzdCgpIHtcbiAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkludmFsaWQgYXR0ZW1wdCB0byBkZXN0cnVjdHVyZSBub24taXRlcmFibGUgaW5zdGFuY2VcIik7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gX25vbkl0ZXJhYmxlUmVzdDsiLCJmdW5jdGlvbiBfbm9uSXRlcmFibGVTcHJlYWQoKSB7XG4gIHRocm93IG5ldyBUeXBlRXJyb3IoXCJJbnZhbGlkIGF0dGVtcHQgdG8gc3ByZWFkIG5vbi1pdGVyYWJsZSBpbnN0YW5jZVwiKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBfbm9uSXRlcmFibGVTcHJlYWQ7IiwidmFyIGFycmF5V2l0aEhvbGVzID0gcmVxdWlyZShcIi4vYXJyYXlXaXRoSG9sZXNcIik7XG5cbnZhciBpdGVyYWJsZVRvQXJyYXlMaW1pdCA9IHJlcXVpcmUoXCIuL2l0ZXJhYmxlVG9BcnJheUxpbWl0XCIpO1xuXG52YXIgbm9uSXRlcmFibGVSZXN0ID0gcmVxdWlyZShcIi4vbm9uSXRlcmFibGVSZXN0XCIpO1xuXG5mdW5jdGlvbiBfc2xpY2VkVG9BcnJheShhcnIsIGkpIHtcbiAgcmV0dXJuIGFycmF5V2l0aEhvbGVzKGFycikgfHwgaXRlcmFibGVUb0FycmF5TGltaXQoYXJyLCBpKSB8fCBub25JdGVyYWJsZVJlc3QoKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBfc2xpY2VkVG9BcnJheTsiLCJ2YXIgYXJyYXlXaXRob3V0SG9sZXMgPSByZXF1aXJlKFwiLi9hcnJheVdpdGhvdXRIb2xlc1wiKTtcblxudmFyIGl0ZXJhYmxlVG9BcnJheSA9IHJlcXVpcmUoXCIuL2l0ZXJhYmxlVG9BcnJheVwiKTtcblxudmFyIG5vbkl0ZXJhYmxlU3ByZWFkID0gcmVxdWlyZShcIi4vbm9uSXRlcmFibGVTcHJlYWRcIik7XG5cbmZ1bmN0aW9uIF90b0NvbnN1bWFibGVBcnJheShhcnIpIHtcbiAgcmV0dXJuIGFycmF5V2l0aG91dEhvbGVzKGFycikgfHwgaXRlcmFibGVUb0FycmF5KGFycikgfHwgbm9uSXRlcmFibGVTcHJlYWQoKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBfdG9Db25zdW1hYmxlQXJyYXk7Il19
