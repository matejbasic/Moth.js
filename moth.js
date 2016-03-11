/*
 * MothJS 
 * Canvas framework
 * Matej Bašiæ, FOI
 * završni rad
 * 
 */
 
 
Function.prototype.clone = function() {
    var cloneObj = this;
    if(this.__isClone) {
      cloneObj = this.__clonedFrom;
    }

    var temp = function() { return cloneObj.apply(this, arguments); };
    for(var key in this) {
        temp[key] = this[key];
    }

    temp.__isClone = true;
    temp.__clonedFrom = cloneObj;

    return temp;
};

window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          function (callback){
            window.setTimeout(callback, 1000 / 60);
          };
})();
window.cancelAnimFrame = (function(){
  return  window.cancelAnimationFrame       ||
          window.webkitCancelAnimationFrame ||
          window.mozCancelAnimationFrame    ||
          function (id){
            window.clearTimeout(id);
          };
})();

var Moth = {};
(function(ctx) {
    var version = "0.1";
 
    ctx.getVersion = function() {
        return version; 
    };
})(Moth);

Moth.Events = function() {
	var that = this;
	var eventSupported = ['mousedown', 'mouseup', 'click', 'dblclick', 'mousemove', 'mouseover', 'mouseout', 'keydown', 'keyup', 'keypress'];
	var eventList = [];
	var eventCount = 0;
	
	function unknownEventException(eType, eID, eFunc) {
		var message = 'unknown event: ' + eType + ' ' + eID + ', ' + eFunc;
		return message;
	}
	function typeException(eType, eID, eFunc, eParam) {
		var message = 'invalid type: ' + eType + ' ' + eID + ', ' + eFunc + '(' + eParam + ')';
		return message;
	}
	
	function isEventSupported(pType) {
		for (var i = 0; i < eventSupported.length; i++) {
			if (pType === eventSupported[i]) {
				return true;
			}
		}
		return false;
	}
	function getCoords(e, parent) {
		return [e.pageX - parent.getOffsetLeft(), e.pageY - parent.getOffsetTop()];
	}
	this.on = function(pType, pFunction, pName) {
		var newListener;
		var eventID = eventCount;
		var parentObject;
		if (that.getType() === 'canvas') {
			parentObject = that;
		}
		else {
			parentObject = that.getParent();
		}
		var parentID = parentObject.getID();
		var parentElement = document.getElementById(parentID);
		
		if (!isEventSupported(pType)) {
			throw unknownEventException(this.getType(), this.ID, 'on');
		}
		else {
			if (pName === undefined) {
				pName = '';
			}
			else if (typeof pName !== 'string') {
				throw typeException(this.getType(), this.ID, 'on', 'string');
			}
			else if (typeof pFunction !== 'function') {
				throw typeException(this.getType(), this.ID, 'on', 'function');
			}
			
			if (that.getType() === 'canvas') {
				newListener = function(e) {
					pFunction(e);
				}
				if (pType === 'keydown' || pType === 'keyup' || pType === 'keypress') {
					window.addEventListener(pType, newListener, false);
				}
				else {
					parentElement.addEventListener(pType, newListener, false);
				}
			}
			else {
				if (pType === 'mouseout') {
					newListener = function(e) {
						for (var i = 0; i < eventList.length; i++) {
							if (eventID === eventList[i].ID) {
								break;
							}
						}
						
						var coords = getCoords(e, parentObject);
						if (parentObject.getHitRegion(coords[0], coords[1]) !== that.getID() && eventList[i].inHost) {
							pFunction(e);
							eventList[i].inHost = false;
						}
						else if (parentObject.getHitRegion(coords[0], coords[1]) === that.getID() && !eventList[i].inHost) {
							eventList[i].inHost = true;
						}
					}
					parentElement.addEventListener('mousemove', newListener, false);
				}			
				else if (pType === 'mouseover') {
					newListener = function(e) {
						for (var i = 0; i < eventList.length; i++) {
							if (eventID === eventList[i].ID) {
								break;
							}
						}
						
						var coords = getCoords(e, parentObject);
						if (parentObject.getHitRegion(coords[0], coords[1]) !== that.getID() && eventList[i].inHost) {
							eventList[i].inHost = false;
						}
						else if (parentObject.getHitRegion(coords[0], coords[1]) === that.getID() && !eventList[i].inHost) {
							pFunction(e);
							eventList[i].inHost = true;
						}
					}
					parentElement.addEventListener('mousemove', newListener, false);
				}
				else if (pType === 'keydown' || pType === 'keyup' || pType === 'keypress') {
					newListener = function(e) {
						pFunction(e);
					}
					window.addEventListener(pType, newListener, false);
				}
				else {
					newListener = function(e) {
						var coords = getCoords(e, parentObject);
						if (parentObject.getHitRegion(coords[0], coords[1]) === that.getID()) {
							pFunction(e);
						}
					}
					parentElement.addEventListener(pType, newListener, false);
				}
			}
			eventList.push({name: pName, listener: newListener, type: pType, ID: eventCount++, inHost: false});
		}
	}
	
	this.off = function(pType, pName) {
		var parentObject;
		if (that.getType() === 'canvas') {
			parentObject = that;
		}
		else {
			parentObject = that.getParent();
		}
		var parentID = parentObject.getID();
		var parentElement = document.getElementById(parentID);
		var deletedEvents = [];
		
		if (typeof pType !== 'string') {
			throw typeException(this.getType(), this.ID, 'off', 'string');
		}
		else if (!isEventSupported(pType)) {
			throw unknownEventException(this.getType(), this.ID, 'on');
		}
		
		if (typeof pName !== 'string' && pName !== undefined) {
			throw typeException(this.getType(), this.ID, 'off', 'string');
		}
		else if (pName === undefined) {
			for (var i = 0; i < eventList.length; i++) {
				if (pType === eventList[i].type) {
					if (pType === 'keydown' || pType === 'keyup' || pType === 'keypress') {
						window.removeEventListener(eventList[i].type, eventList[i].listener, false);
					}
					else {
						parentElement.removeEventListener(eventList[i].type, eventList[i].listener, false);
					}
					deletedEvents.push(i);
				}
			}
		}
		else if (typeof pName === 'string') {
			for (var i = 0; i < eventList.length; i++) {
				if (pType === eventList[i].type && pName === eventList[i].name) {
					if (pType === 'keydown' || pType === 'keyup' || pType === 'keypress') {
						window.removeEventListener(eventList[i].type, eventList[i].listener, false);
					}
					else {
						parentElement.removeEventListener(eventList[i].type, eventList[i].listener, false);
					}
					deletedEvents.push(i);
				}
			}
		}
		for (var j = 0; j < deletedEvents.length; j++) {
			eventList.splice(deletedEvents[j], 1);
		}
	}
	
}

Moth.Animation = function() {
	this.animations = [];
	var that = this;
	function typeException(eType, eID, eFunc, eParam) {
		var message = 'invalid type: ' + eType + ' ' + eID + ', ' + eFunc + '(' + eParam + ')';
		return message;
	}
	
	this.animate = function(pFunction, pName) {
			var animation = {};
			if (typeof pFunction !== 'function') {
				throw typeException(this.getType(), this.ID, 'animate', 'function');
			}
			else if (typeof pName !== 'string') {
				throw typeException(this.getType(), this.ID, 'animate', 'string');
			}
			else {
				animation.name = pName;
				animation.status = 'paused';
				animation.func = function() {
					pFunction.call(this);
					animation.ID = requestAnimFrame(animation.func);
				}.bind(this);
				that.animations.push(animation);
			}	
	}
	
	this.start = function(pName) {
		if (typeof pName === 'string') {
			for (var i = 0; i < this.animations.length; i++) {
				if (this.animations[i].name === pName) { 
					if (this.animations[i].status !== 'running') {
						this.animations[i].ID = requestAnimFrame(this.animations[i].func);
						this.animations[i].status = 'running';
					}
					break;
				}
			}
		}
		else {
			throw typeException(this.getType(), this.ID, 'start', 'string');
		}
	}
	this.stop = function(pName) {
		if (typeof pName === 'string') {
				for (var i = 0; i < this.animations.length; i++) {
					if (this.animations[i].name === pName) {
						if (this.animations[i].status !== 'paused') {
							cancelAnimFrame(this.animations[i].ID);
							this.animations[i].status = 'paused';
						}
						break;
					}
				}
			}
		else {
			throw typeException(this.getType(), this.ID, 'stop', 'string');
		}
	}
	
	this.getAnimationStatus = function(pName) {
		if (typeof pName === 'string') {
			for (var i = 0; i < this.animations.length; i++) {
				if (this.animations[i].name === pName) {
					return this.animations[i].status;
				}
			}
		}
		else {
			throw typeException(this.getType(), this.ID, 'getAnimationStatus', 'string');
		}
	}
}

Moth.Shape = function() {
	Moth.Events.call(this);
	Moth.Animation.call(this);
    var type = 'shape';
	this.ID = parseInt(Math.random() * 10000).toString();
	this.visible = true;
	this.x = 0;
	this.y = 0;
	this.z = 0;
	this.parent = '';
	this.transformation = {
		matrix: [1, 0, 0, 1, 0, 0],
		xOffset: 0,
		yOffset: 0
	};
	this.shadow = {
		offsetX: 0,
		offsetY: 0,
		color: "rgba(0, 0, 0, 0)",
		blur: 0,
		visible: true
	}
	this.fill = {
		enabled: true,
		type: 'color', //color, pattern, linear gradient, radial gradient
		color: 'rgba(125, 255, 125, 1)',
		
		pattern: {
			image: {},
			repetition: 'repeat'
		},
		gradient: {
			colorStops: [],
			linear: {
				startX: 0,
				startY: 0,
				endX: 0,
				endY: 0,
			},
			radial: {
				startX: 0,
				startY: 0,
				startR: 0,
				endX: 0,
				endY: 0,
				endR: 0
			}
		}
	}
	this.stroke = {
		enabled: true,
		type: 'color',
		color: 'rgba(0, 0, 0, 0)',
		width: 1,
		lineJoin: 'miter',
		lineCap: 'butt',
		
		pattern: {
			image: {},
			repetition: 'repeat'
		},
		gradient: {
			colorStops: [],
			linear: {
				startX: 0,
				startY: 0,
				endX: 0,
				endY: 0,
			},
			radial: {
				startX: 0,
				startY: 0,
				startR: 0,
				endX: 0,
				endY: 0,
				endR: 0
			}
		}
	}
	this.drawing; 
	
	function typeException(eType, eID, eFunc, eParam) {
		var message = 'invalid type: ' + eType + ' ' + eID + ', ' + eFunc + '(' + eParam + ')';
		return message;
	}
	function unknownValException(eType, eID, eFunc) {
		var message = 'unknown value: ' + eType + ' ' + eID + ', ' + eFunc;
		return message;
	}
	function ppException(eMsg, eType, eID, eFunc) {
		var message = eMsg + ': ' + eType + ' ' + eID + ', ' + eFunc;
		return message;
	}
	
	this.setAttributes = function(config) {
		function loopAttributes(cCounter, aCounter, keys, iObject, oObject) {
			if (cCounter > 0 && aCounter > 0) {
				for (i = 0; i < keys.length && aCounter > 0; i++) {
					if (oObject[keys[i]] !== undefined) {
						iObject[keys[i]] = oObject[keys[i]];
						aCounter--;
					}
				}
			}
		}
		function setFillStrokeAttributes(iObject, oObject) {
				if (oObject !== undefined) {
					attrCounter = Object.keys(oObject).length;
					if (configCounter > 0 && attrCounter > 0) {
						keys = Object.keys(iObject);
						keys.splice(keys.indexOf('pattern'), 1);
						keys.splice(keys.indexOf('gradient'), 1);
						
						loopAttributes(configCounter, attrCounter, keys, iObject, oObject);
						if (oObject.pattern !== undefined) {
							attrCounter = Object.keys(oObject.pattern).length; 
							if (attrCounter > 0) {
								keys = Object.keys(iObject.pattern);
								loopAttributes(configCounter, attrCounter, keys, iObject.pattern, oObject.pattern);
							}
						}
						if (oObject.gradient !== undefined) {
							attrCounter = Object.keys(oObject.gradient).length; 
							if (attrCounter > 0) {
								keys = Object.keys(iObject.gradient);
								keys.splice(keys.indexOf('linear'), 1);
								keys.splice(keys.indexOf('radial'), 1);
								loopAttributes(configCounter, attrCounter, keys, iObject.gradient, oObject.gradient);
								
								attrCounter = Object.keys(oObject.gradient.linear).length; 
								if (attrCounter > 0) {
									keys = Object.keys(iObject.gradient.linear);
									loopAttributes(configCounter, attrCounter, keys, iObject.gradient.linear, oObject.gradient.linear);
								}
								
								attrCounter = Object.keys(oObject.gradient.radial).length; 
								if (attrCounter > 0) {
									keys = Object.keys(iObject.gradient.radial);
									loopAttributes(configCounter, attrCounter, keys, iObject.gradient.radial, oObject.gradient.radial);
								}
							}
						}
						configCounter--;
					}
				}
			}
			
		if (typeof config === 'object' && config.length === 1) {
			config = config[0];
			var keys = [];
			keys = Object.keys(this);
			var configCounter = Object.keys(config).length;
			for (var i = 0; i < keys.length && configCounter > 0; i++) {
				if (keys[i].indexOf('set') === -1 && keys[i].indexOf('get') === -1 && keys[i].indexOf('update') === -1 && keys[i].indexOf('reset') === -1 && keys[i].indexOf('_') === -1) {
					if (config[keys[i]] !== undefined && typeof this[keys[i]] !== 'object' && typeof this[keys[i]] !== 'function') {
						this[keys[i]] = config[keys[i]];
						configCounter--;
					}
				}
			}
			if (config.drawing !== undefined) {
				if (type === 'shape') {
					this.drawing = config.drawing.clone();
				}
			}			
			
			var attrCounter = 0;
			if (config.animations !== undefined) {
				attrCounter = Object.keys(config.animations).length;
				this.animations = [];
				for (var i = 0; i < attrCounter; i++) {
					this.animations.push({});
					keys = Object.keys(config.animations[i]);
					for (var j = 0; j < keys.length; j++) {
						if (config.animations[i][keys[j]] === 'function') {
							this.animations[i][keys[j]] = config.animations[i][keys[j]].clone(); 
							
						}
						else {
							this.animations[i][keys[j]] = config.animations[i][keys[j]];
						}
					}
					
				}
			}
			if (config.shadow !== undefined) {
				attrCounter = Object.keys(config.shadow).length;
				keys = Object.keys(this.shadow);
				loopAttributes(configCounter, attrCounter, keys, this.shadow, config.shadow);
				configCounter--;
			}
			if (config.points !== undefined) {
				this.points = config.points.slice(0);
			}
			if (config.transformation !== undefined) {
				attrCounter = Object.keys(config.transformation).length;
				keys = Object.keys(this.transformation);
				loopAttributes(configCounter, attrCounter, keys, this.transformation, config.transformation);
				configCounter--;
			}
			
			setFillStrokeAttributes(this.fill, config.fill);
			setFillStrokeAttributes(this.stroke, config.stroke);
		}
	}
	this.getAttributes = function() {
		var newKeys = [];
		var obj = {};
		keys = Object.keys(this);
		for (var i = 0; i < keys.length; i++) {
			if (typeof this[keys[i]] !== 'function') {
				newKeys.push(keys[i]);
			}
			else if(keys[i] === 'drawing') {
				obj[keys[i]] = this[keys[i]].clone();
			}
		}
		keys = newKeys;
		for (i = 0; i < keys.length; i++) {
			if (typeof this[keys[i]] !== 'object') {
				obj[keys[i]] = this[keys[i]];
			}
			else {
				if (keys[i] === 'parent') {
					obj[keys[i]] = this[keys[i]];
				}
				else if (keys[i] === 'points') {
					obj[keys[i]] = this[keys[i]].slice(0);
				}
				else if (keys[i] === 'src') {
					obj[keys[i]] = this[keys[i]];
				}				
				else if (keys[i] === 'animations') {
					obj[keys[i]] = [];
					for (var j = 0; j < this[keys[i]].length; j++) {
						newKeys = Object.keys(this[keys[i]][j]);
						obj[keys[i]].push({});
						for (var k = 0; k < newKeys.length; k++) {
							if (typeof this[keys[i]][j][newKeys[k]] !== 'function') {
								if (newKeys[k] === 'status') {
									obj[keys[i]][j][newKeys[k]] = 'paused';
								}
								else {
									obj[keys[i]][j][newKeys[k]] = this[keys[i]][j][newKeys[k]]; 
								}
							}
							else {
								obj[keys[i]][j][newKeys[k]] = this[keys[i]][j][newKeys[k]].clone();
							}
						}
					}
				}
				else if (keys[i] === 'transformation') { 
					obj[keys[i]] = {};
					newKeys = Object.keys(this[keys[i]]);
					for (var j = 0; j < newKeys.length; j++) {
						if (newKeys[j] === 'matrix') {
							obj[keys[i]][newKeys[j]] = this[keys[i]][newKeys[j]].slice(0);
						}
						else {
							obj[keys[i]][newKeys[j]] = this[keys[i]][newKeys[j]];
						}
						
					}
				}
				else if (keys[i] === 'shadow') { 
					obj[keys[i]] = {};
					newKeys = Object.keys(this[keys[i]]);
					for (var j = 0; j < newKeys.length; j++) {
						obj[keys[i]][newKeys[j]] = this[keys[i]][newKeys[j]];
					}
				}
				else if (keys[i] === 'fill' || keys[i] === 'stroke') {
					obj[keys[i]] = {};
					newKeys = Object.keys(this[keys[i]]);
					for (var j = 0; j < newKeys.length; j++) {
						if (typeof this[keys[i]][newKeys[j]] !== 'object') {
							obj[keys[i]][newKeys[j]] = this[keys[i]][newKeys[j]];
						}
						else {
							obj[keys[i]][newKeys[j]] = {};
							if (newKeys[j] === 'pattern') {
								obj[keys[i]][newKeys[j]]['image'] = this[keys[i]][newKeys[j]]['image'];
								obj[keys[i]][newKeys[j]]['repetition'] = this[keys[i]][newKeys[j]]['repetition'];
							}
							else {
								var newNewKeys = Object.keys(this[keys[i]][newKeys[j]]);
								for (var k = 0; k < newNewKeys.length; k++) {
									if (newNewKeys[k] === 'colorStops') {
										obj[keys[i]][newKeys[j]]['colorStops'] = this[keys[i]][newKeys[j]]['colorStops'].slice(0);
									}
									else {
										obj[keys[i]][newKeys[j]][newNewKeys[k]] = {};
										var nnnKeys = Object.keys(this[keys[i]][newKeys[j]][newNewKeys[k]]);
										for (var l = 0; l < nnnKeys.length; l++) {
											obj[keys[i]][newKeys[j]][newNewKeys[k]][nnnKeys[l]] = this[keys[i]][newKeys[j]][newNewKeys[k]][nnnKeys[l]];
										}
									}
								}
							}
						}
					}
				}
			}
		}
		
		return obj;
	}
	this.setAttributes(arguments);
	this.clone = function() {
		var newAttrs = this.getAttributes();
		var newShape = new Moth.Shape(newAttrs);
		newShape.ID = 'new_' + type + '_' + parseInt(Math.random() * 100000).toString();
		return newShape; 
	}
	
	this.updateContext = function(pCtx) {
		pCtx.setTransform(1,0,0,1,0,0);
		pCtx.translate(this.x + this.transformation.xOffset, this.y + this.transformation.yOffset);
		pCtx.transform(this.transformation.matrix[0], this.transformation.matrix[1], this.transformation.matrix[2], this.transformation.matrix[3], this.transformation.matrix[4], this.transformation.matrix[5]);
		
		if (this.fill.enabled) {
				if (this.fill.type === 'color') {
					pCtx.fillStyle = this.fill.color;
				}
				else if (this.fill.type === 'pattern') {
					pCtx.fillStyle = pCtx.createPattern(this.fill.pattern.image, this.fill.pattern.repetition);
				}
				else if (this.fill.type === 'linear gradient') {
					var gradient = pCtx.createLinearGradient(this.fill.gradient.linear.startX, this.fill.gradient.linear.startY, this.fill.gradient.linear.endX, this.fill.gradient.linear.endY);
				}
				else if (this.fill.type === 'radial gradient') {
					var gradient = pCtx.createRadialGradient(this.fill.gradient.radial.startX, this.fill.gradient.radial.startY, this.fill.gradient.radial.startR, this.fill.gradient.radial.endX, this.fill.gradient.radial.endY, this.fill.gradient.radial.endR);
				}
				
				if (this.fill.type === 'linear gradient' || this.fill.type === 'radial gradient') {
					for(var i = 0; i < this.fill.gradient.colorStops.length; i += 2) {
						if (i % 2 === 0) {
							gradient.addColorStop(this.fill.gradient.colorStops[i], this.fill.gradient.colorStops[i + 1]);
						}
					}
					pCtx.fillStyle = gradient;
				}
			}
		if (this.stroke.enabled) {
			if (this.stroke.type === 'color') {
				pCtx.strokeStyle = this.stroke.color;
			}
			else if (this.stroke.type === 'pattern') {
				pCtx.strokeStyle = pCtx.createPattern(this.stroke.pattern.image, this.stroke.pattern.repetition);
			}
			else if (this.stroke.type === 'linear gradient') {
				var gradient = pCtx.createLinearGradient(this.stroke.gradient.linear.startX, this.stroke.gradient.linear.startY, this.stroke.gradient.linear.endX, this.stroke.gradient.linear.endY);
			}
			else if (this.stroke.type === 'radial gradient') {
				var gradient = pCtx.createRadialGradient(this.stroke.gradient.radial.startX, this.stroke.gradient.radial.startY, this.stroke.gradient.radial.startR, this.stroke.gradient.radial.endX, this.stroke.gradient.radial.endY, this.stroke.gradient.radial.endR);
			}
			
			if (this.stroke.type === 'linear gradient' || this.stroke.type === 'radial gradient') {
				for(var i = 0; i < this.stroke.gradient.colorStops.length; i += 2) {
					if (i % 2 === 0) {
						gradient.addColorStop(this.stroke.gradient.colorStops[i], this.stroke.gradient.colorStops[i + 1]);
					}
				}
				pCtx.strokeStyle = gradient;
			}
			
			pCtx.lineWidth = this.stroke.width;
			pCtx.lineJoin = this.stroke.lineJoin;
			pCtx.lineCap = this.stroke.lineCap;
		}
			
		if (this.shadow.visible) {
			pCtx.shadowColor = this.shadow.color;
			pCtx.shadowOffsetX = this.shadow.offsetX;
			pCtx.shadowOffsetY = this.shadow.offsetY;
			pCtx.shadowBlur = this.shadow.blur;
		}
	}
	this.setDrawing = function(pFunc, pFunc2) {
		if (pFunc !== undefined) {
			//var beginCount = (pFunc.toString().match(/beginPath/g) || []).length;
			//var endCount = (pFunc.toString().match(/closePath/g) || []).length;
		
			this.drawing = function(pCtx, hitColor) {
				if (typeof hitColor === 'string') {
					var tempSettings = {
						shadow: this.shadow.visible,
						fillColor: this.fill.color,
						fillType: this.fill.type,
						strokeColor: this.stroke.color,
						strokeType: this.stroke.type
					}
					this.fill.type = 'color';
					this.fill.color = hitColor;
					this.stroke.type = 'color';
					this.stroke.color = hitColor;
					this.shadow.visible = false;
				}
				this.updateContext(pCtx);
				
				if ((this.getType() === 'image' || this.getType() === 'sprite') && hitColor !== undefined) {
					this.hitShape(pCtx);
					pCtx.fill();
					pCtx.stroke();
				}
				else {
					if (pFunc2 === undefined) {
						pFunc(pCtx);
					}
					if (this.stroke.enabled) {
						if (pFunc2 !== undefined) {
							pFunc2(pCtx);
						}
						pCtx.stroke();
					}
					if (pFunc2 !== undefined) {
						pFunc(pCtx);
					}
					if (this.fill.enabled) {
						pCtx.fill();
					}
					if (this.stroke.enabled) {
						pCtx.shadowColor = 'rgba(0, 0, 0, 0)';
						if (pFunc2 !== undefined) {
							pFunc2(pCtx);
						}
						pCtx.stroke();
					}
				}
				
				if (typeof hitColor === 'string') {
					this.shadow.visible = tempSettings.shadow;
					this.fill.type = tempSettings.fillType;
					this.fill.color = tempSettings.fillColor;
					this.stroke.type = tempSettings.strokeType;
					this.stroke.color = tempSettings.strokeColor;
				}
			}
		}
	}
	this.draw = function(pCtx, hitColor) {
		if (this.visible) {
			pCtx.save();
			this.drawing(pCtx, hitColor);
			pCtx.restore();
		}
	}
	
	this.getX = function() {
		return this.x;
	}
	this.setX = function(pX) {
		if (typeof pX === 'number') {
			this.x = pX;
		}
		else {
			throw typeException(type, this.ID, 'setX', 'number');
		}
	}
	
	this.getY = function() {
		return this.y;
	}
	this.setY = function(pY) {
		if (typeof pY === 'number') {
			this.y = pY;
		}
		else {
			throw typeException(type, this.ID, 'setY', 'number');
		}
	}
	
	this.getZ = function() {
		return this.z;
	}
	this.setZ = function(pZ) {
		if (typeof pZ === 'number') {
			this.z = pZ;
		}
		else {
			throw typeException(type, this.ID, 'setZ', 'number');
		}
	}
	
	this.getType = function() {
		return type;
	}
	
	this.getID = function() {
		return this.ID;
	}
	this.setID = function(pID) {
		if (typeof pID === 'string') {
			this.ID = pID;
		}
		else {
			throw typeException(type, this.ID, 'setID', 'string');
		}
	}
	
	this.getVisible = function() {
		return this.visible;
	}
	this.setVisible = function(pVisible) {
		if (typeof pVisible === 'boolean') {
			this.visible = pVisible;
		}
		else {
			throw typeException(type, this.ID, 'setVisible', 'boolean');
		}
	}
	
	this.getParent = function() {
		return this.parent;
	}
	
	this.getShadow = function() {
		return this.shadow;
	}
	//setShadow(offsetX, offsetY, color, blur, visible);
	this.setShadow = function() {
		var iMax = arguments.length;
		var params = ['offsetX', 'offsetY', 'color', 'blur', 'visible'];
		if (iMax > 5) {
			iMax = 5;
		}
		for (var i = 0; i < iMax; i++) {
			if ((i === 0 || i === 1 || i === 3) && typeof arguments[i] !== 'number') {
				throw typeException(type, this.ID, 'setShadow', 'number');
			}
			else if (i === 2 && typeof arguments[i] !== 'string') {
				throw typeException(type, this.ID, 'setShadow', 'string');
			}
			else if (i === 4 && typeof arguments[i] !== 'boolean') {
				throw typeException(type, this.ID, 'setShadow', 'boolean');
			}
		}
		for (var i = 0; i < iMax; i++) {
			this.shadow[params[i]] = arguments[i];
		}
	}
	
	this.getShadowOffsetX = function() {
		return this.shadow.offsetX;
	}
	this.setShadowOffsetX = function(pOffsetX) {
		if (typeof pOffsetX === 'number') {
			this.shadow.offsetX = pOffsetX;
		}
		else {
			throw typeException(type, this.ID, 'setShadowOffsetX', 'number');
		}
	}
	
	this.getShadowOffsetY = function() {
		return this.shadow.offsetY;
	}
	this.setShadowOffsetY = function(pOffsetY) {
		if (typeof pOffsetY === 'number') {
			this.shadow.offsetY = pOffsetY;
		}
		else {
			throw typeException(type, this.ID, 'setShadowOffsetY', 'number');
		}
	}
	
	this.getShadowColor = function() {
		return this.shadow.color;
	}
	this.setShadowColor = function(pColor) {
		if (typeof pColor === 'string') {
			this.shadow.color = pColor;
		}
		else {
			throw typeException(type, this.ID, 'setShadowColor', 'string');
		}
	}
	
	this.getShadowBlur = function() {
		return this.shadow.blur;
	}
	this.setShadowBlur = function(pBlur) {
		if (typeof pBlur === 'number') {
			this.shadow.blur = pBlur;
		}
		else {
			throw typeException(type, this.ID, 'setShadowBlur', 'number');
		}
	}
	
	this.getShadowVisible = function() {
		return this.shadow.visible;
	}
	this.setShadowVisible = function(pVisible) {
		if (typeof pVisible === 'boolean') {
			this.shadow.visible = pVisible;
		}
		else {
			throw typeException(type, this.ID, 'setShadowVisible', 'boolean');
		}
	}
	
	this.getFillEnabled = function() {
		return this.fill.enabled;
	}
	this.setFillEnabled = function(pEnabled) {
		if (typeof pEnabled === 'boolean') {
			this.fill.enabled = pEnabled;
		}
		else {
			throw typeException(type, this.ID, 'setFillEnabled', 'boolean');
		}
	}
	
	this.getFillType = function() {
		return this.fill.type;
	}
	this.setFillType = function(pType) {
		if (typeof pType === 'string') {
			if (pType === 'color' || pType === 'pattern' || pType === 'linear gradient' || pType === 'radial gradient') {
				this.fill.type = pType;
			}
			else {
				throw unknownValException(type, this.ID, 'setFillType');
			}
		}
		else {
			throw typeException(type, this.ID, 'setFillType', 'string');
		}
	}
	
	this.getFillColor = function() {
		return this.fill.color;
	}
	this.setFillColor = function(pColor) {
		if (typeof pColor === 'string') {
			this.fill.color = pColor;
		}
		else {
			throw typeException(type, this.ID, 'setFillColor', 'string');
		}
	}
	
	this.getFillPatternImage = function() {
		return this.fill.pattern.image;
	}
	this.getFillPatternRepetition = function() {
		return this.fill.pattern.repetition;
	}	
	this.setFillPattern = function(pImage, pRepetition) {
		if (typeof pImage === 'object') {
			this.fill.pattern.image = pImage;
			this.setFillType('pattern');
		}
		else {
			throw typeException(type, this.ID, 'setFillPattern', 'object');
		}
		
		if (pRepetition !== undefined) {
			if (typeof pRepetition === 'string') {
				if (pRepetition === 'repeat' || pRepetition === 'repeat-x' || pRepetition === 'repeat-y' || pRepetition === 'no-repeat') {
					this.fill.pattern.repetition = pRepetition;
				}
				else {
					throw unknownValException(type, this.ID, 'setFillPattern');
				}
			}
			else {
				throw typeException(type, this.ID, 'setFillPattern', 'string');
			}
		}
	}
	
	this.getFillGradientColorStops = function(stopIndex) {
		if (typeof stopIndex !== 'number' || stopIndex * 2 > this.fill.gradient.colorStops.length - 1 || stopIndex < 0) {
			return this.fill.gradient.colorStops;
		}
		else {
			return [this.fill.gradient.colorStops[stopIndex * 2], this.fill.gradient.colorStops[stopIndex * 2 + 1]];
		}
		
	}
	//setFillGradientColorStops(offset, color, offset2, color2, offset3, color3, ...);
	//setFillGradientColorStops(offset, color, index);
	this.setFillGradientColorStops = function() {
		var tempStops = [];
		var tempOffset;
		for (var i = 0; i < arguments.length; i++) {
			if (arguments.length === 3 && i === 2) {
				if (typeof arguments[i] === 'number') {
					arguments[i] *= 2;
					if (arguments[i] > this.fill.gradient.colorStops.length) {
						arguments[i] = this.fill.gradient.colorStops.length;
					}
					else if (arguments[i] < 0) {
						arguments[i] = 0;
					}
					this.fill.gradient.colorStops.splice(arguments[i], 0, tempStops[0], tempStops[1]);
					return;
				}
				else {
					throw typeException(type, this.ID, 'setFillGradientColorStops', 'number');
				}
			}
			if (i % 2 === 0) {
				if (typeof arguments[i] === 'number') {
					tempOffset = arguments[i];
				}
				else {
					throw typeException(type, this.ID, 'setFillGradientColorStops', 'number');
				}
			}
			else {
				if (typeof arguments[i] === 'string') {
					tempStops.push(tempOffset, arguments[i]);
				}
				else {
					throw typeException(type, this.ID, 'setFillGradientColorStops', 'string');
				}
			}
		}
		this.fill.gradient.colorStops = this.fill.gradient.colorStops.concat(tempStops);
	}
	
	this.getFillGradientStartPoint = function() {
		return [this.fill.gradient.linear.startX, this.fill.gradient.linear.startY];
	}
	this.setFillGradientStartPoint = function(pX, pY) {
		if (typeof pX === 'number' && typeof pY === 'number') {
			this.fill.gradient.linear.startX = pX;
			this.fill.gradient.linear.startY = pY;
		}
		else {
			throw typeException(type, this.ID, 'setFillGradientStartPoint', 'number');
		}
	}
	
	this.getFillGradientEndPoint = function() {
		return [this.fill.gradient.linear.endX, this.fill.gradient.linear.endY];
	}
	this.setFillGradientEndPoint = function(pX, pY) {
		if (typeof pX === 'number' && typeof pY === 'number') {
			this.fill.gradient.linear.endX = pX;
			this.fill.gradient.linear.endY = pY;
		}
		else {
			throw typeException(type, this.ID, 'setFillGradientEndPoint', 'number');
		}
	}
	
	this.getFillGradientStartCircle = function() {
		return [this.fill.gradient.radial.startX, this.fill.gradient.radial.startY, this.fill.gradient.radial.startR];
	}
	this.setFillGradientStartCircle = function(pX, pY, pR) {
		if (typeof pX === 'number' && typeof pY === 'number' && typeof pR === 'number') {
			this.fill.gradient.radial.startX = pX;
			this.fill.gradient.radial.startY = pY;
			this.fill.gradient.radial.startR = pR;
		}
		else {
			throw typeException(type, this.ID, 'setFillGradientStartCircle', 'number');
		}
	}
	
	this.getFillGradientEndCircle = function() {
		return [this.fill.gradient.radial.endX, this.fill.gradient.radial.endY, this.fill.gradient.radial.endR];
	}
	this.setFillGradientEndCircle = function(pX, pY, pR) {
		if (typeof pX === 'number' && typeof pY === 'number' && typeof pR === 'number') {
			this.fill.gradient.radial.endX = pX;
			this.fill.gradient.radial.endY = pY;
			this.fill.gradient.radial.endR = pR;
		}
		else {
			throw typeException(type, this.ID, 'setFillGradientEndCircle', 'number');
		}
	}
	
	this.getFillLinearGradient = function() {
		return [this.fill.gradient.linear.startX, this.fill.gradient.linear.startY, this.fill.gradient.linear.endX, this.fill.gradient.linear.endY];
	}
	this.setFillLinearGradient = function(pX, pY, pX2, pY2) {
		if (typeof pX === 'number' && typeof pY === 'number' && typeof pX2 === 'number' && typeof pY2 === 'number') {
			this.fill.gradient.linear.startX = pX;
			this.fill.gradient.linear.startY = pY;
			this.fill.gradient.linear.endX = pX2;
			this.fill.gradient.linear.endY = pY2;
			this.setFillType('linear gradient');
		}
		else {
			throw typeException(type, this.ID, 'setFillLinearGradient', 'number');
		}
	}
	
	this.getFillRadialGradient = function() {
		return [this.fill.gradient.radial.startX, this.fill.gradient.radial.startY, this.fill.gradient.radial.startR, this.fill.gradient.radial.endX, this.fill.gradient.radial.endY, this.fill.gradient.radial.endR];
	}
	this.setFillRadialGradient = function(pX, pY, pR, pX2, pY2, pR2) {
		if (typeof pX === 'number' && typeof pY === 'number' && typeof pR === 'number' && typeof pX2 === 'number' && typeof pY2 === 'number' && typeof pR2 === 'number') {
			this.fill.gradient.radial.startX = pX;
			this.fill.gradient.radial.startY = pY;
			this.fill.gradient.radial.startR = pR;
			this.fill.gradient.radial.endX = pX2;
			this.fill.gradient.radial.endY = pY2;
			this.fill.gradient.radial.endR = pR2;
			this.setFillType('radial gradient');
		}
		else {
			throw typeException(type, ID, 'setFillRadialGradient', 'number');
		}
	}
	
	this.getStrokeEnabled = function() {
		return this.stroke.enabled;
	}
	this.setStrokeEnabled = function(pEnabled) {
		if (typeof pEnabled === 'boolean') {
			this.stroke.enabled = pEnabled;
		}
		else {
			throw typeException(type, this.ID, 'setStrokeEnabled', 'boolean');
		}
	}
	
	this.getStrokeType = function() {
		return this.stroke.type;
	}
	this.setStrokeType = function(pType) {
		if (typeof pType === 'string') {
			if (pType === 'color' || pType === 'pattern' || pType === 'linear gradient' || pType === 'radial gradient') {
				this.stroke.type = pType;
			}
			else {
				throw unknownValException(type, this.ID, 'setStrokeType');
			}
		}
		else {
			throw typeException(type, this.ID, 'setStrokeType', 'string');
		}
	}
	
	this.getStrokeColor = function() {
		return this.stroke.color;
	}
	this.setStrokeColor = function(pColor) {
		if (typeof pColor === 'string') {
			this.stroke.color = pColor;
		}
		else {
			throw typeException(type, this.ID, 'setStrokeColor', 'string');
		}
	}
	
	this.getStrokePatternImage = function() {
		return this.stroke.pattern.image;
	}
	this.getStrokePatternRepetition = function() {
		return this.stroke.pattern.repetition;
	}
	this.setStrokePattern = function(pImage, pRepetition) {
		if (typeof pImage === 'object') {
			this.stroke.pattern.image = pImage;
			this.setStrokeType('pattern');
		}
		else {
			throw typeException(type, this.ID, 'setstrokePattern', 'object');
		}
		
		if (pRepetition !== undefined) {
			if (typeof pRepetition === 'string') {
				if (pRepetition === 'repeat' || pRepetition === 'repeat-x' || pRepetition === 'repeat-y' || pRepetition === 'no-repeat') {
					this.stroke.pattern.repetition = pRepetition;
				}
				else {
					throw unknownValException(type, this.ID, 'setStrokePattern');
				}
			}
			else {
				throw typeException(type, this.ID, 'setStrokePattern', 'string');
			}
		}
	}
	
	
	this.getStrokeGradientColorStops = function(stopIndex) {
		if (typeof stopIndex !== 'number' || stopIndex * 2 > this.stroke.gradient.colorStops.length - 1 || stopIndex < 0) {
			return this.stroke.gradient.colorStops;
		}
		else {
			return [this.stroke.gradient.colorStops[stopIndex * 2], this.stroke.gradient.colorStops[stopIndex * 2 + 1]];
		}
		
	}
	//setStrokeGradientColorStops(offset, color, offset2, color2, offset3, color3, ...);
	//setStrokeGradientColorStops(offset, color, index);
	this.setStrokeGradientColorStops = function() {
		var tempStops = [];
		var tempOffset;
		for (var i = 0; i < arguments.length; i++) {
			if (arguments.length === 3 && i === 2) {
				if (typeof arguments[i] === 'number') {
					arguments[i] *= 2;
					if (arguments[i] > this.stroke.gradient.colorStops.length) {
						arguments[i] = this.stroke.gradient.colorStops.length;
					}
					else if (arguments[i] < 0) {
						arguments[i] = 0;
					}
					this.stroke.gradient.colorStops.splice(arguments[i], 0, tempStops[0], tempStops[1]);
					return;
				}
				else {
					throw typeException(type, this.ID, 'setStrokeGradientColorStops', 'number');
				}
			}
			if (i % 2 === 0) {
				if (typeof arguments[i] === 'number') {
					tempOffset = arguments[i];
				}
				else {
					throw typeException(type, this.ID, 'setStrokeGradientColorStops', 'number');
				}
			}
			else {
				if (typeof arguments[i] === 'string') {
					tempStops.push(tempOffset, arguments[i]);
				}
				else {
					throw typeException(type, this.ID, 'setStrokeGradientColorStops', 'string');
				}
			}
		}
		this.stroke.gradient.colorStops = this.stroke.gradient.colorStops.concat(tempStops);
	}
	
	this.getStrokeGradientStartPoint = function() {
		return [this.stroke.gradient.linear.startX, this.stroke.gradient.linear.startY];
	}
	this.setStrokeGradientStartPoint = function(pX, pY) {
		if (typeof pX === 'number' && typeof pY === 'number') {
			this.stroke.gradient.linear.startX = pX;
			this.stroke.gradient.linear.startY = pY;
		}
		else {
			throw typeException(type, this.ID, 'setStrokeGradientStartPoint', 'number');
		}
	}
	
	this.getStrokeGradientEndPoint = function() {
		return [this.stroke.gradient.linear.endX, this.stroke.gradient.linear.endY];
	}
	this.setStrokeGradientEndPoint = function(pX, pY) {
		if (typeof pX === 'number' && typeof pY === 'number') {
			this.stroke.gradient.linear.endX = pX;
			this.stroke.gradient.linear.endY = pY;
		}
		else {
			throw typeException(type, this.ID, 'setStrokeGradientEndPoint', 'number');
		}
	}
	
	this.getStrokeGradientStartCircle = function() {
		return [this.stroke.gradient.radial.startX, this.stroke.gradient.radial.startY, this.stroke.gradient.radial.startR];
	}
	this.setStrokeGradientStartCircle = function(pX, pY, pR) {
		if (typeof pX === 'number' && typeof pY === 'number' && typeof pR === 'number') {
			this.stroke.gradient.radial.startX = pX;
			this.stroke.gradient.radial.startY = pY;
			this.stroke.gradient.radial.startR = pR;
		}
		else {
			throw typeException(type, this.ID, 'setStrokeGradientStartCircle', 'number');
		}
	}
	
	this.getStrokeGradientEndCircle = function() {
		return [this.stroke.gradient.radial.endX, this.stroke.gradient.radial.endY, this.stroke.gradient.radial.endR];
	}
	this.setStrokeGradientEndCircle = function(pX, pY, pR) {
		if (typeof pX === 'number' && typeof pY === 'number' && typeof pR === 'number') {
			this.stroke.gradient.radial.endX = pX;
			this.stroke.gradient.radial.endY = pY;
			this.stroke.gradient.radial.endR = pR;
		}
		else {
			throw typeException(type, this.ID, 'setStrokeGradientEndCircle', 'number');
		}
	}
	
	this.getStrokeLinearGradient = function() {
		return [this.stroke.gradient.linear.startX, this.stroke.gradient.linear.startY, this.stroke.gradient.linear.endX, this.stroke.gradient.linear.endY];
	}
	this.setStrokeLinearGradient = function(pX, pY, pX2, pY2) {
		if (typeof pX === 'number' && typeof pY === 'number' && typeof pX2 === 'number' && typeof pY2 === 'number') {
			this.stroke.gradient.linear.startX = pX;
			this.stroke.gradient.linear.startY = pY;
			this.stroke.gradient.linear.endX = pX2;
			this.stroke.gradient.linear.endY = pY2;
			this.setStrokeType('linear gradient');
		}
		else {
			throw typeException(type, this.ID, 'setStrokeLinearGradient', 'number');
		}
	}
	
	this.getStrokeRadialGradient = function() {
		return [this.stroke.gradient.radial.startX, this.stroke.gradient.radial.startY, this.stroke.gradient.radial.startR, this.stroke.gradient.radial.endX, this.stroke.gradient.radial.endY, this.stroke.gradient.radial.endR];
	}
	this.setStrokeRadialGradient = function(pX, pY, pR, pX2, pY2, pR2) {
		if (typeof pX === 'number' && typeof pY === 'number' && typeof pR === 'number' && typeof pX2 === 'number' && typeof pY2 === 'number' && typeof pR2 === 'number') {
			this.stroke.gradient.radial.startX = pX;
			this.stroke.gradient.radial.startY = pY;
			this.stroke.gradient.radial.startR = pR;
			this.stroke.gradient.radial.endX = pX2;
			this.stroke.gradient.radial.endY = pY2;
			this.stroke.gradient.radial.endR = pR2;
			this.setStrokeType('radial gradient');
		}
		else {
			throw typeException(type, this.ID, 'setStrokeRadialGradient', 'number');
		}
	}
	
	this.getLineWidth = function() {
		return this.stroke.width;
	}
	this.setLineWidth = function(pW) {
		if (typeof pW === 'number') {
			this.stroke.width= pW;
		}
		else {
			throw typeException(type, this.ID, 'setLineWidth', 'number');
		}
	}
	
	this.getLineJoin = function() {
		return this.stroke.lineJoin;
	}
	this.setLineJoin = function(pT) {
		if (typeof pT === 'string') {
			if (pT === 'round' || pT === 'bevel' || pT === 'miter') {
				this.stroke.lineJoin = pT;
			}
			else {
				throw unknownValException(type, this.ID, 'setLineJoin');
			}
		}
		else {
			throw typeException(type, this.ID, 'setLineJoin', 'string');
		}
	}
	
	this.getLineCap = function() {
		return this.stroke.lineCap;
	}
	this.setLineCap = function(pT) {
		if (typeof pT === 'string') {
			if (pT === 'butt' || pT === 'round' || pT === 'square') {
				this.stroke.lineJoin = pT;
			}
			else {
				throw unknownValException(type, this.ID, 'setLineCap');
			}
		}
		else {
			throw typeException(type, this.ID, 'setLineCap', 'string');
		}
	}
	
	this._setMatrix = function(matrixNew){
		var matrix = [0, 0, 0, 0, 0, 0];
		var br = 0;
		for (var i = 0; i < 2; i++) {
			br = 0;
			for	(var j = 0; j < 6; j+=2) {
				if (j === 4) {
					br = 1;
				}
				matrix[j + i] = this.transformation.matrix[i] * matrixNew[j] + this.transformation.matrix[2 + i] * matrixNew[1 + j] + this.transformation.matrix[4 + i] * br;	
			}
		}
		this.transformation.matrix = matrix;
	}
	this.setTransform = function() {
		var matrixNew = [];
		for (var i = 0; i < 6; i++) {
			if (arguments[i] === undefined || typeof arguments[i] !== 'number') {
				matrixNew.push(0);
			}
			else {
				matrixNew.push(arguments[i]);
			}
		}
		this._setMatrix(matrixNew);
	}
	this.resetTransform = function() {
		this.transformation.matrix = [1, 0, 0, 1, 0, 0];
	}
	this.getTransform = function() {
		return this.transformation.matrix;
	}

	this.setSkew = function(pX, pY) {
		if (typeof pX === 'number') {
			pX = pX * Math.PI / 180;
		}
		else {
			throw typeException(type, this.ID, 'setSkew', 'number');
		}
		if (typeof pY === 'number') {
			pY = pY * Math.PI / 180;
		}
		else {
			throw typeException(type, this.ID, 'setSkew', 'number');
		}
		this._setMatrix([1, pY, pX, 1, 0, 0]);
	}
	this.setTranslation = function(pX, pY) {
		if (typeof pX !== 'number' || typeof pY !== 'number') {
			throw typeException(type, this.ID, 'setTranslation', 'number');
		}
		else {
			this._setMatrix([1, 0, 0, 1, pX, pY]);
		}
	}
	this.setScale = function(pX, pY) {
		if (typeof pX !== 'number' || typeof pY !== 'number') {
			throw typeException(type, this.ID, 'setScale', 'number');
		}
		else {
			this._setMatrix([pX, 0, 0, pY, 0, 0]);
		}
	}
	this.setRotation = function(pAngle) {
		if (typeof pAngle !== 'number') {
			throw typeException(type, this.ID, 'setRotation', 'number');
		}
		else {
			pAngle = pAngle * Math.PI / 180;
			this._setMatrix([Math.cos(pAngle), -Math.sin(pAngle), Math.sin(pAngle), Math.cos(pAngle), 0, 0]);
		}
	}
	this.setOrigin = function(pX, pY) {
		if ((typeof pX !== 'string' && typeof pX !== 'number') || (typeof pY !== 'string' && typeof pY !== 'number')) {
			throw typeException(type, this.ID, 'setOrigin', 'string OR number');
		}
		else {
			if (pX !== 'left' && pX !== 'center' && pX !== 'right' && pY !== 'top' && pY !== 'center' && pY !== 'bottom') {
				throw unknownValException(type, this.ID, 'setOrigin');
			}
			if (this.w === 0 || this.h === 0) {
				throw ppException("W and H value must be greater than 0");
			}
			if (pX === 'left') {
				this.transformation.xOffset = 0;
			}
			else if (pX === 'center') {
				this.transformation.xOffset = this.w / 2;
			}
			else if (pX === 'right') {
				this.transformation.xOffset = this.w;
			}
			else if (typeof pX === 'number') {
				this.transformation.xOffset = pX;
			}
			
			if (pY === 'top') {
				this.transformation.yOffset = 0;
			}
			else if (pY === 'center') {
				this.transformation.yOffset = this.h / 2;
			}
			else if (pY === 'bottom') {
				this.transformation.yOffset = this.h;
			}
			else if (typeof pY === 'number') {
				this.transformation.yOffset = pY;
			}
		}
	}

};
Moth.Shape.prototype = new Moth.Events();
Moth.Shape.prototype = new Moth.Animation();
Moth.Shape.prototype.constructor = Moth.Shape;

Moth.Canvas = function() {
	Moth.Events.call(this);
	var type = 'canvas';
	var ID = 'ID';
	var shapes = [];
	var canvas;
	var hitRegion = {};
	hitRegion = {
		canvas: null,
		ctx: null,
		shapes: []
	};
	hitColor = {
		r: 0,
		g: 0,
		b: 0
	}
	var w = 0;
	var h = 0;
	var context;
	var parent = null;
	var offsetLeft;
	var offsetTop;
	var compositeOperation = 'source-over';
	init(arguments);
	
	var debug = true;
	
	function typeException(eType, eID, eFunc, eParam) {
		var message = 'invalid parameter type: ' + eType + ' ' + eID + ', ' + eFunc + '(' + eParam + ')';
		return message;
	}
	function regException(message) {
		return message;
	}
	
	function init(args) {
		var iMax = args.length;
		if (iMax === 1) {
			if (typeof args[0] === 'string') {
				ID = args[0];
				canvas = document.getElementById(ID);
				context = canvas.getContext("2d");
				w = canvas.width;
				h = canvas.height;
				offsetLeft = canvas.offsetLeft;
				offsetTop = canvas.offsetTop;
				if (canvas === null) {
					throw regException('invalid ID: canvas init');
				}
				else if (canvas.nodeName !== 'canvas' && canvas.nodeName !== 'CANVAS') {
				 throw regException('invalid element type: canvas, init');
				}
			}
			else {
				throw typeException(type, '', 'init', 'string');
			}
		}
		else if (iMax >= 3) {
			canvas = document.createElement("canvas");
			context = canvas.getContext("2d");
			if (typeof args[0] === 'string') {
				canvas.id = args[0];
			}
			else {
				throw typeException(type, '', 'init', 'string');
			}
			if (typeof args[1] === 'number' && typeof args[2] === 'number') {
				w = canvas.width = args[1];
				h = canvas.height = args[2];
			}
			else {
				throw typeException(type, '', 'init', 'number');
			}
		}
		
		if (iMax >= 4) {
			addParent(args[3]);
			offsetLeft = canvas.offsetLeft;
			offsetTop = canvas.offsetTop;
		}
	
		//hitRegion
		hitRegion.canvas = document.createElement("canvas");
		hitRegion.ctx = hitRegion.canvas.getContext("2d");
		hitRegion.canvas.width = w;
		hitRegion.canvas.height = h;
		//debug - brisi
		document.body.appendChild(hitRegion.canvas);
	}
	
	function zSort(a,b) {
		if (a.z > b.z)
			return 1;
        if (a.z < b.z)
            return 0;

        return -1;
    }
	function addParent(parentID) {
		if (typeof parentID === 'string') {
			parent = document.getElementById(parentID);
			if (parent === null) {
				throw regException('invalid parent ID: canvas init');
			}
			parent.appendChild(canvas);
		}
		else {
			throw typeException(type, '', 'addParent', 'string');
		}
	}
	
	this.getAttributes = function() {
		return {
			type: type,
			ID: ID,
			canvas: canvas,
			w: w,
			h: h,
			context: context,
			parent: parent,
			offsetLeft: offsetLeft,
			offsetTop: offsetTop
		};
	}
	this.getType = function() {
		return type;
	}
	
	this.clear = function() {
		context.clearRect(0, 0, w, h);
	}
	
	this.setParent = function(pID) {
		addParent(pID);
	}
	this.getParent = function() {
		return parent;
	}
	this.removeParent = function() {
		parent.removeChild(canvas);
		parent = null;
	}
	
	this.addShape = function(pShape) {
		shapes.push(pShape);
		pShape.parent = this;
		this.setHitRegion(pShape.getID());
	}
	this.getShapes = function() {
		return shapes;
	}
	this.draw = function() {
		shapes.sort(zSort);
		for	(var i = 0; i < shapes.length; i++) {
			shapes[i].draw(context);
		}
		this.updateHitRegion();
	}
	
	this.getW = function() {
		return w;
	}
	this.setW = function(pW) {
		if (typeof pW === 'number') {
			hitRegion.canvas.width = canvas.width = w = pW;
			this.draw();
			this.updateHitRegion();
		}
		else {
			throw typeException(type, ID, 'setW', 'number');
		}
	}
	
	this.getH = function() {
		return h;
	}
	this.setH = function(pH) {
		if (typeof pH === 'number') {
			hitRegion.canvas.height = canvas.height = h = pH;
			this.draw();
			this.updateHitRegion();
		}
		else {
			throw typeException(type, ID, 'setH', 'number');
		}
	}
	
	this.getID = function() {
		return ID;
	}
	this.setID = function(pID) {
		if (typeof pID === 'string') {
			var canvasElement = document.getElementById(ID);
			ID = pID;
			canvasElement.id = ID;
		}
		else {
			throw typeException(type, ID, 'setID', 'string');
		}
	}
	
	this.getOffsetLeft = function() {
		return offsetLeft;
	}
	this.getOffsetTop = function() {
		return offsetTop;
	}
	
	function setHitColor() {
		hitColor.b++;
		if (hitColor.b > 255) {
			hitColor.b = 0; 
			hitColor.g++;
		}
		if (hitColor.g > 255) {
			hitColor.g = 0;
			hitColor.r++;
		}
		if (hitColor.r > 255) {
			throw regException('Hit colors overload!');
		}
		return 'rgb(' + hitColor.r + ', ' + hitColor.g + ', ' + hitColor.b + ')';
	}
	function clearHitCanvas() {
		hitRegion.ctx.clearRect(0,0, hitRegion.canvas.width, hitRegion.canvas.height);
	}
	
	this.setHitRegion = function(pID) {
		for	(var i = 0; i < shapes.length; i++) {
			if (shapes[i].getID() === pID) {
				hitRegion.shapes.push({id: pID, color: setHitColor()});
				break;
			}
		}
		shapes[i].draw(hitRegion.ctx, hitRegion.shapes[i].color);
	}
	this.getHitRegion = function(pX, pY) {
		var imgData = hitRegion.ctx.getImageData(pX, pY, 1, 1);
		var color = 'rgb(' + imgData.data[0] + ', ' + imgData.data[1] + ', ' + imgData.data[2] + ')';
		
		for (var i = 0; i < hitRegion.shapes.length; i++) {
			if (hitRegion.shapes[i].color === color) {
				return hitRegion.shapes[i].id;
			}
		}
		return null;
	}
	this.updateHitRegion = function() {
		clearHitCanvas();
		for	(var i = 0; i < shapes.length; i++) {
			shapes[i].draw(hitRegion.ctx, hitRegion.shapes[i].color);
		}
	}
	
	this.setCompositeOperation = function(pAB) {
		if (typeof pAB !== 'string') {
			throw typeException(Type, this.ID, 'setCompositeOperation', 'string');
		}
		else {
			compositeOperation = context.globalCompositeOperation = pAB;
		}
	}
	this.getCompositeOperation = function() {
		return compositeOperation;
	}	
}
Moth.Canvas.prototype = new Moth.Events();
Moth.Canvas.prototype.constructor = Moth.Canvas;

Moth.Rect = function() {
	Moth.Shape.call(this);
	var type = 'rect';
	this.w = 0;
	this.h = 0;
	this.strokeLocation = 'center' // outside, inside, center
	var that = this;
	this.setAttributes(arguments);
	this.debug = true;
	function typeException(eType, eID, eFunc, eParam) {
		var message = 'invalid type: ' + eType + ' ' + eID + ', ' + eFunc + '(' + eParam + ')';
		return message;
	}
	function unknownValException(eType, eID, eFunc) {
		var message = 'unknown value: ' + eType + ' ' + eID + ', ' + eFunc;
		return message;
	}
	
	function newFillSetup() {
		var param = {x: that.x, y: that.y, w: that.w, h: that.h};
		if (that.transformation.xOffset !== 0) {
			param.x += that.transformation.xOffset * -2;
		}
		if (that.transformation.yOffset !== 0) {
			param.y += that.transformation.yOffset * -2;
		}
		return param;
	}
	function newStrokeSetup() {
		var param = newFillSetup();
		var width = that.stroke.width * 0.98;
		if (that.strokeLocation === 'outside') {
			param.x -= width / 2;
			param.y -= width / 2;
			param.w += width;
			param.h += width;
		}
		else if (that.strokeLocation === 'inside') {
			param.x += width / 2;
			param.y += width / 2;
			param.w -= width;
			param.h -= width;
		}
		return param;
	}
	function newDrawing(ctx, what) {	
		var p = {};
		if (what === 'fill') {
			p = newFillSetup();
		}
		else if (what === 'stroke') {
			p = newStrokeSetup();
		}
		ctx.beginPath();
		ctx.rect(p.x, p.y, p.w, p.h);
		ctx.closePath();
	}
	
	this.setDrawing(function(ctx) {
		newDrawing(ctx, 'fill');
	},
	function(ctx) {
		newDrawing(ctx, 'stroke');
	});
	this.setDrawing = function() {
		return null;
	}
	
	this.getType = function() {
		return type;
	}
	this.clone = function() {
		var newAttrs = this.getAttributes();
		var newShape = new Moth.Rect(newAttrs);
		newShape.ID = 'new_' + type + '_' + parseInt(Math.random() * 100000).toString();
		return newShape; 
	}
	
	this.getW = function() {
		return this.w;
	}
	this.setW = function(pW) {
		if (typeof pW === 'number') {
			this.w = pW;
		}
		else {
			throw typeException(type, this.ID, 'setW', 'number');
		}
	}
	
	this.getH = function() {
		return this.h;
	}
	this.setH = function(pH) {
		if (typeof pH === 'number') {
			this.h = pH;
		}
		else {
			throw typeException(type, this.ID, 'setH', 'number');
		}
	}
	
	this.getStrokeLocation = function() {
		return this.strokeLocation;
	}
	this.setStrokeLocation = function(pLocation) {
		if (typeof pLocation === 'string') {
			if (pLocation === 'outside' || pLocation === 'inside' || pLocation === 'center') {
				this.strokeLocation = pLocation;
			}
			else {
				throw unknownValException(type, this.ID, 'setStrokeLocation');
			}
		}
		else {
			throw typeException(type, this.ID, 'setStrokeLocation', 'string');
		}
	}
	
	this.set = function(pX, pY, pW, pH, pLocation) {
		this.setX(pX);
		this.setY(pY);
		this.setW(pW);
		this.setH(pH);
		if (pLocation !== undefined) {
			this.setStrokeLocation(pLocation);
		}
	}
}
Moth.Rect.prototype = new Moth.Shape();
Moth.Rect.prototype.constructor = Moth.Rect;

Moth.Arc = function() {
	Moth.Shape.call(this);
	var type = 'arc';
	this.closed = false;
	this.pie = false;
	this.r = 0;
	this.startAngle = 0;
	this.endAngle = 0;
	this.strokeLocation = 'center';
	var that = this;
	this.setAttributes(arguments);
	
	function typeException(eType, eID, eFunc, eParam) {
		var message = 'invalid type: ' + eType + ' ' + eID + ', ' + eFunc + '(' + eParam + ')';
		return message;
	}
	function unknownValException(eType, eID, eFunc) {
		var message = 'unknown value: ' + eType + ' ' + eID + ', ' + eFunc;
		return message;
	}
	
	function newFillSetup() {
		var param = {x: that.x, y: that.y, r: that.r, startAngle: that.startAngle, endAngle: that.endAngle};
		
		if (that.transformation.xOffset !== 0) {
			param.x = that.transformation.xOffset * -1;
		}
		if (that.transformation.yOffset !== 0) {
			param.y = that.transformation.yOffset * -1;
		}
		return param;
	}
	function newStrokeSetup() {
		var param = newFillSetup();
		var width = that.stroke.width * 0.98;
		if (that.strokeLocation === 'outside') {
			param.r += width / 2;
		}
		else if (that.strokeLocation === 'inside') {
			param.r -= width / 2;
		}
		return param;
	}
	function newDrawing(ctx, what) {	
		var p = {};
		if (what === 'fill') {
			p = newFillSetup();
		}
		else if (what === 'stroke') {
			p = newStrokeSetup();
		}
		ctx.beginPath();
		ctx.arc(p.x, p.y, p.r, p.startAngle * Math.PI / 180, p.endAngle * Math.PI / 180, false);
		if (that.pie && p.endAngle < 360) {
			ctx.lineTo(p.x, p.y);
		}
		if (that.closed || that.pie) {
			ctx.closePath();
		}
		
	}
	
	this.setDrawing(function(ctx) {
		newDrawing(ctx, 'fill');
	},
	function(ctx) {
		newDrawing(ctx, 'stroke');
	});
	this.setDrawing = function() {
		return null;
	}
	
	this.getType = function() {
		return type;
	}
	this.clone = function() {
		var newAttrs = this.getAttributes();
		var newShape = new Moth.Arc(newAttrs);
		newShape.ID = 'new_' + type + '_' + parseInt(Math.random() * 100000).toString();
		return newShape; 
	}

	this.getClosed = function() {
		return this.closed;
	}
	this.setClosed = function(pClosed) {
		if (typeof pClosed === 'boolean') {
			 this.closed = pClosed;
		}
		else {
			throw typeException(type, this.ID, 'setClosed', 'boolean');
		}
	}

	this.getPie = function() {
		return this.pie;
	}
	this.setPie = function(pPie) {
		if (typeof pPie === 'boolean') {
			 this.pie = pPie;
		}
		else {
			throw typeException(type, this.ID, 'setPie', 'boolean');
		}
	}

	this.getRadius = function() {
		return this.r;
	}
	this.setRadius = function(pR) {
		if (typeof pClose !== 'number') {
			 this.r = pR;
		}
		else {
			throw typeException(type, this.ID, 'setRadius', 'number');
		}
	}
	
	this.getStartAngle = function() {
		return this.startAngle;
	}
	this.setStartAngle = function(pAngle) {
		if (typeof pAngle === 'number') {
			 this.startAngle = pAngle;
		}
		else {
			throw typeException(type, this.ID, 'setStartAngle', 'number');
		}
	}
	
	this.getEndAngle = function() {
		return this.endAngle;
	}
	this.setEndAngle = function(pAngle) {
		if (typeof pAngle === 'number') {
			 this.endAngle = pAngle;
		}
		else {
			throw typeException(type, this.ID, 'setEndAngle', 'number');
		}
	}

	this.getStrokeLocation = function() {
		return this.strokeLocation;
	}
	this.setStrokeLocation = function(pLocation) {
		if (typeof pLocation === 'string') {
			if (pLocation === 'outside' || pLocation === 'inside' || pLocation === 'center') {
				this.strokeLocation = pLocation;
			}
			else {
				throw unknownValException(type, this.ID, 'setStrokeLocation');
			}
		}
		else {
			throw typeException(type, this.ID, 'setStrokeLocation', 'string');
		}
	}
	
	this.setOrigin = function(pX, pY) {
		if ((typeof pX !== 'string' && typeof pX !== 'number') || (typeof pY !== 'string' && typeof pY !== 'number')) {
			throw typeException(type, this.ID, 'setOrigin', 'string OR number');
		}
		else {
			if (pX !== 'left' && pX !== 'center' && pX !== 'right' && pY !== 'top' && pY !== 'center' && pY !== 'bottom') {
				throw unknownValException(type, this.ID, 'setOrigin');
			}
			if (pX === 'center') {
				this.transformation.xOffset = 0;
			}
			else if (pX === 'left') {
				this.transformation.xOffset = this.x - this.r / 2;
			}
			else if (pX === 'right') {
				this.transformation.xOffset = this.x + this.r / 2;
			}
			else if (typeof pX === 'number') {
				this.transformation.xOffset = pX;
			}
			
			if (pY === 'center') {
				this.transformation.yOffset = 0;
			}
			else if (pY === 'top') {
				this.transformation.yOffset = this.y - this.r / 2;
			}
			else if (pY === 'bottom') {
				this.transformation.yOffset = this.y + this.r / 2;
			}
			else if (typeof pY === 'number') {
				this.transformation.yOffset = pY;
			}
		}
	}

	this.set = function(pX, pY, pR, pSA, pEA, pClosed, pPie) {
		this.setX(pX);
		this.setY(pY);
		this.setRadius(pR);
		this.setStartAngle(pSA);
		this.setEndAngle(pEA);
		if (pClosed !== undefined) {
			this.setClosed(pClosed);
		}
		if (pPie !== undefined) {
			this.setPie(pPie);
		}
	}
}
Moth.Arc.prototype = new Moth.Shape();
Moth.Arc.prototype.constructor = Moth.Arc;

Moth.Line = function() {
	Moth.Shape.call(this);
	var type = 'line';
	this.closed = false;
	this.strokeLocation = 'center';
	this.points = [];
	this.w = 0;
	this.h = 0;
	var that = this;
	this.setAttributes(arguments);
	this.debug = true;
	init();
	
	function init() {
		that.setFillEnabled(false);
		that.setStrokeEnabled(true);
		that.setStrokeColor('black');
		that.setLineWidth(5);
	}
	function typeException(eType, eID, eFunc, eParam) {
		var message = 'invalid type: ' + eType + ' ' + eID + ', ' + eFunc + '(' + eParam + ')';
		return message;
	}
	function unknownValException(eType, eID, eFunc) {
		var message = 'unknown value: ' + eType + ' ' + eID + ', ' + eFunc;
		return message;
	}
	function ppException(eType, eID, eFunc, eMsg) {
		var message = eMsg + ': ' + eType + ' ' + eID + ', ' + eFunc;
		return message;
	}
	function newFillSetup() {
		var param = {x: 0, y: 0, w: that.w, h: that.h};
		if (that.transformation.xOffset !== 0) {
			param.x = that.transformation.xOffset * -1;
		}
		if (that.transformation.yOffset !== 0) {
			param.y = that.transformation.yOffset * -1;
		}
		return param;
	}
	function newStrokeSetup() {
		var param = newFillSetup();
		var width = that.stroke.width * 0.98;
		if (that.strokeLocation === 'outside') {
			param.x -= width / 2;
			param.y -= width / 2;
			param.w += width;
			param.h += width;
		}
		else if (that.strokeLocation === 'inside') {
			param.x += width / 2;
			param.y += width / 2;
			param.w -= width;
			param.h -= width;
		}
		return param;
	}
	
	function newDrawing(ctx, what) {
		var p = {};
		var midPoints = [];
		var points = {};
		var tempPoints = {};
		var offsetPoints = [];
		
		if (what === 'fill') {
			p = newFillSetup();
		}
		else if (what === 'stroke') {
			p = newStrokeSetup();
		}
		for (var i = 0; i < that.points.length; i += 2) {
			offsetPoints.push(that.points[i] + p.x);
			offsetPoints.push(that.points[i + 1] + p.y);
		}
		
		ctx.beginPath();
		for (i = 0; i < offsetPoints.length; i += 2) {
			if (i === 0) {
				ctx.moveTo(offsetPoints[i], offsetPoints[i + 1]);
			}
			else {
				ctx.lineTo(offsetPoints[i], offsetPoints[i + 1]);
			}
		}
		if (that.closed) {
			ctx.closePath();
		}
	}
	
	this.setDrawing(function(ctx) {
		newDrawing(ctx, 'fill');
	},
	function(ctx) {
		newDrawing(ctx, 'stroke');
	});
	this.setDrawing = function() {
		return null;
	}
	
	this.getType = function() {
		return type;
	}
	this.clone = function() {
		var newAttrs = this.getAttributes();
		var newShape = new Moth.Line(newAttrs);
		newShape.ID = 'new_' + type + '_' + parseInt(Math.random() * 100000).toString();
		return newShape; 
	}

	this.getPoints = function() {
		return this.points;
	}
	this.setPoints = function(pPoints) {
		if (typeof pPoints === 'object') {
			 if (pPoints.length % 2 !== 0) {
				throw ppException(type, this.ID, 'setPoints', 'number of points is odd')
			 }
			 else {
				this.points = pPoints;
				var min = {x: 0, y: 0};
				var max = {x: 0, y: 0};
				
				for (i = 0; i < this.points.length; i += 2) {
					if (this.points[i] > max.x) {
						max.x = this.points[i];
					}
					if (this.points[i + 1] > max.y) {
						max.y = this.points[i + 1];
					}
					if (this.points[i] < min.x) {
						min.x = this.points[i];
					}
					if (this.points[i + 1] < min.y) {
						min.y = this.points[i + 1];
					}
					
					if (i === 0) {
						min.x = this.points[i];
						min.y = this.points[i + 1];
					}
				}
				this.x = min.x;
				this.y = min.y;
				this.w = max.x - min.x;
				this.h = max.y - min.y;
			 }
		}
		else {
			throw typeException(type, this.ID, 'setPoints', 'array');
		}
	}
	
	this.getW = function() {
		return this.w;
	}
	this.setW = function(pW) {
		if (typeof pW === 'number') {
			this.w = pW;
		}
		else {
			throw typeException(type, this.ID, 'setW', 'number');
		}
	}
	
	this.getH = function() {
		return this.h;
	}
	this.setH = function(pH) {
		if (typeof pH === 'number') {
			this.h = pH;
		}
		else {
			throw typeException(type, this.ID, 'setH', 'number');
		}
	}
	
	this.getClosed = function() {
		return this.closed;
	}
	this.setClosed = function(pClosed) {
		if (typeof pClosed === 'boolean') {
			 this.closed = pClosed;
		}
		else {
			throw typeException(type, this.ID, 'setClosed', 'boolean');
		}
	}
	
	this.getStrokeLocation = function() {
		return this.strokeLocation;
	}
	this.setStrokeLocation = function(pLocation) {
		if (typeof pLocation === 'string') {
			if (pLocation === 'outside' || pLocation === 'inside' || pLocation === 'center') {
				this.strokeLocation = pLocation;
			}
			else {
				throw unknownValException(type, this.ID, 'setStrokeLocation');
			}
		}
		else {
			throw typeException(type, this.ID, 'setStrokeLocation', 'string');
		}
	}
	
	this.set = function(pPoints, pClosed) {
		this.setPoints(pPoints);
		if (pClosed !== undefined) {
			this.setClosed(pClosed);
		}
	}
}
Moth.Line.prototype = new Moth.Shape();
Moth.Line.prototype.constructor = Moth.Line;

Moth.Image = function() {
	Moth.Shape.call(this);
	var type = 'image';
	this.w = 0;
	this.h = 0;
	this.sX = 0;
	this.sY = 0;
	this.sW = 0;
	this.sH = 0;
	this.src = new Image();
	this.hitShape = function() {};
	this.strokeLocation = 'center' // outside, inside, center
	var that = this;
	this.setAttributes(arguments);
	this.debug = true;
	init();
	
	function init() {
		that.setFillColor("transparent");
	}
	
	function typeException(eType, eID, eFunc, eParam) {
		var message = 'invalid type: ' + eType + ' ' + eID + ', ' + eFunc + '(' + eParam + ')';
		return message;
	}
	function unknownValException(eType, eID, eFunc) {
		var message = 'unknown value: ' + eType + ' ' + eID + ', ' + eFunc;
		return message;
	}
	
	function newFillSetup() {
		var param = {x: that.x, y: that.y, w: that.w, h: that.h, sX: that.sX, sY: that.sY, sW: that.sW, sH: that.sH};
		
		if (that.transformation.xOffset !== 0) {
			param.x = that.transformation.xOffset * -1;
		}
		if (that.transformation.yOffset !== 0) {
			param.y = that.transformation.yOffset * -1;
		}
		return param;
	}
	function newStrokeSetup() {
		var param = newFillSetup();
		var width = that.stroke.width * 0.98;
		if (that.strokeLocation === 'outside') {
			param.x -= width / 2;
			param.y -= width / 2;
			param.w += width;
			param.h += width;
		}
		else if (that.strokeLocation === 'inside') {
			param.x += width / 2;
			param.y += width / 2;
			param.w -= width;
			param.h -= width;
		}
		return param;
	}
	function newDrawing(ctx, what) {	
		var p = {};
		if (what === 'fill') {
			p = newFillSetup();
		}
		else if (what === 'stroke') {
			return;
		}
		
		ctx.beginPath();
		if (that.src !== undefined) {
			if(p.sW !== 0 && p.sH !== 0) {
				ctx.drawImage(that.src, p.sX, p.sY, p.sW, p.sH, p.x, p.y, p.w, p.h);
			}
			else if (p.w !== 0 && p.h !== 0) {
				ctx.drawImage(that.src, p.x, p.y, p.w, p.h);
			}
			else {
				ctx.drawImage(that.src, p.x, p.y);
			}
		}
		ctx.closePath();
	}
	
	this.setHitShape = function(pFunc) {
		this.hitShape = function(ctx) {
			var old = {x: this.x, y: this.y, w: this.w, h: this.h};
			var p = newFillSetup();
			
			this.x = p.x;
			this.y = p.y;
			this.h = p.h;
			this.w = p.w;
			pFunc.call(this, ctx);
			this.x = old.x;
			this.y = old.y;
			this.h = old.h;
			this.w = old.w;
		}.bind(this);
	}
	
	this.setDrawing(function(ctx) {
		newDrawing(ctx, 'fill');
	},
	function(ctx) {
		newDrawing(ctx, 'stroke');
	});
	this.setDrawing = function() {
		return null;
	}
	
	this.getType = function() {
		return type;
	}
	this.clone = function() {
		var newAttrs = this.getAttributes();
		var newShape = new Moth.Image(newAttrs);
		newShape.ID = 'new_' + type + '_' + parseInt(Math.random() * 100000).toString();
		return newShape; 
	}
	
	this.getW = function() {
		return this.w;
	}
	this.setW = function(pW) {
		if (typeof pW === 'number') {
			this.w = pW;
		}
		else {
			throw typeException(type, this.ID, 'setW', 'number');
		}
	}
	
	this.getH = function() {
		return this.h;
	}
	this.setH = function(pH) {
		if (typeof pH === 'number') {
			this.h = pH;
		}
		else {
			throw typeException(type, this.ID, 'setH', 'number');
		}
	}
	
	this.getStrokeLocation = function() {
		return this.strokeLocation;
	}
	this.setStrokeLocation = function(pLocation) {
		if (typeof pLocation === 'string') {
			if (pLocation === 'outside' || pLocation === 'inside' || pLocation === 'center') {
				this.strokeLocation = pLocation;
			}
			else {
				throw unknownValException(type, this.ID, 'setStrokeLocation');
			}
		}
		else {
			throw typeException(type, this.ID, 'setStrokeLocation', 'string');
		}
	}
	
	this.setSrc = function(pImage) {
		if (typeof pImage === 'object') {
			this.src = pImage;
		}
		else {
			throw typeException(type, this.ID, 'setSrc', 'object');
		}
	}
	this.getSrc = function() {
		return this.src;
	}
	
	this.getSx = function() {
		return this.sX;
	}
	this.setSx = function(pSX) {
		if (typeof pSX === 'number') {
			this.sX = pSX;
		}
		else {
			throw typeException(type, this.ID, 'setSx', 'number');
		}
	}
	
	this.getSy = function() {
		return this.sY;
	}
	this.setSy = function(pSY) {
		if (typeof pSY === 'number') {
			this.sY = pSY;
		}
		else {
			throw typeException(type, this.ID, 'setSy', 'number');
		}
	}
	
	this.getSW = function() {
		return this.sW;
	}
	this.setSw = function(pSW) {
		if (typeof pSW === 'number') {
			this.sW = pSW;
		}
		else {
			throw typeException(type, this.ID, 'setSw', 'number');
		}
	}
	
	this.getSh = function() {
		return this.sH;
	}
	this.setSh = function(pSH) {
		if (typeof pSH === 'number') {
			this.sH = pSH;
		}
		else {
			throw typeException(type, this.ID, 'setSh', 'number');
		}
	}
	
	this.set = function(pImage, pX, pY, pW, pH, pSX, pSY, pSW, pSH) {
		this.setSrc(pImage);
		this.setX(pX);
		this.setY(pY);
		if (pW !== undefined) {
			this.setW(pW);
		}
		if (pW !== undefined) {
			this.setH(pH);
		}
		
		if (pSX !== undefined) {
			this.setSx(pSX);
		}
		if (pSY !== undefined) {
			this.setSy(pSY);
		}
		if (pSW !== undefined) {
			this.setSw(pSW);
		}
		if (pSH !== undefined) {
			this.setSh(pSH);
		}
	}
}
Moth.Image.prototype = new Moth.Shape();
Moth.Image.prototype.constructor = Moth.Image;

Moth.Sprite = function() {
	Moth.Shape.call(this);
	var type = 'sprite';
	this.w = 0;
	this.h = 0;
	this.src = new Image();
	this.hitShape = function() {};
	var that = this;
	this.setAttributes(arguments);
	this.debug = true;
	
	var animX = 0;
	var animY = 0;
	var animW = 0;
	var animH = 0;
	this.animSets = [];
	init();
	function init() {
		that.setFillColor("transparent");
		that.setStrokeColor("transparent");
	}
	
	function typeException(eType, eID, eFunc, eParam) {
		var message = 'invalid type: ' + eType + ' ' + eID + ', ' + eFunc + '(' + eParam + ')';
		return message;
	}
	function unknownValException(eType, eID, eFunc) {
		var message = 'unknown value: ' + eType + ' ' + eID + ', ' + eFunc;
		return message;
	}
	
	function newFillSetup() {
		var param = {x: that.x, y: that.y, w: that.w, h: that.h};
		
		if (that.transformation.xOffset !== 0) {
			param.x = that.transformation.xOffset * -1;
		}
		if (that.transformation.yOffset !== 0) {
			param.y = that.transformation.yOffset * -1;
		}
		return param;
	}
	function newStrokeSetup() {
		var param = newFillSetup();
		var width = that.stroke.width * 0.98;
		if (that.strokeLocation === 'outside') {
			param.x -= width / 2;
			param.y -= width / 2;
			param.w += width;
			param.h += width;
		}
		else if (that.strokeLocation === 'inside') {
			param.x += width / 2;
			param.y += width / 2;
			param.w -= width;
			param.h -= width;
		}
		return param;
	}
	function newDrawing(ctx, what) {	
		var p = {};
		if (what === 'fill') {
			p = newFillSetup();
		}
		else if (what === 'stroke') {
			return;
		}
		
		ctx.beginPath();
		if (that.src !== undefined) {
			ctx.drawImage(that.src, animX, animY, animW, animH, p.x, p.y, p.w, p.h);
		}
		ctx.closePath();
	}
	
	this.setHitShape = function(pFunc) {
		this.hitShape = function(ctx) {
			var old = {x: this.x, y: this.y, w: this.w, h: this.h};
			var p = newFillSetup();
			
			this.x = p.x;
			this.y = p.y;
			this.h = p.h;
			this.w = p.w;
			pFunc.call(this, ctx);
			this.x = old.x;
			this.y = old.y;
			this.h = old.h;
			this.w = old.w;
		}.bind(this);
	}
	
	this.setDrawing(function(ctx) {
		newDrawing(ctx, 'fill');
	},
	function(ctx) {
		newDrawing(ctx, 'stroke');
	});
	this.setDrawing = function() {
		return null;
	}
	
	this.getType = function() {
		return type;
	}
	this.clone = function() {
		var newAttrs = this.getAttributes();
		var newShape = new Moth.Image(newAttrs);
		newShape.ID = 'new_' + type + '_' + parseInt(Math.random() * 100000).toString();
		return newShape; 
	}
	
	this.getW = function() {
		return this.w;
	}
	this.setW = function(pW) {
		if (typeof pW === 'number') {
			animW = this.w = pW;
		}
		else {
			throw typeException(type, this.ID, 'setW', 'number');
		}
	}
	
	this.getH = function() {
		return this.h;
	}
	this.setH = function(pH) {
		if (typeof pH === 'number') {
			animH = this.h = pH;
		}
		else {
			throw typeException(type, this.ID, 'setH', 'number');
		}
	}
	
	this.setSrc = function(pImage) {
		if (typeof pImage === 'object') {
			this.src = pImage;
		}
		else {
			throw typeException(type, this.ID, 'setSrc', 'object');
		}
	}
	this.getSrc = function() {
		return this.src;
	}
	
	this.set = function(pImage, pX, pY, pW, pH) {
		this.setSrc(pImage);
		this.setX(pX);
		this.setY(pY);
		this.setW(pW);
		this.setH(pH);
	}
	
	this.setAnimation = function(pName, pIndices) {
		this.animSets.push([pName, 0].concat[pIndices]);
		var i = 0;
		var index = pIndices[0];
		this.animate(function(){
			index = pIndices[i];
			console.log(index + " " + i);
			animX = animW * index;
			animY = 0;
			if (animX > this.src.width) {
				animY = Math.floor(animX / this.src.width) * animH;
				animX %= this.src.width;
			}
			//animY = animH * index;
			i++;
			if (i >= pIndices.length) {
				i = 0;
			}
			
		}, pName);
	}
}
Moth.Sprite.prototype = new Moth.Shape();
Moth.Sprite.prototype.constructor = Moth.Sprite;
