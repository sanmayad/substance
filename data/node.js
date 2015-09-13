'use strict';

var OO = require('../basics/oo');
var _ = require('../basics/helpers');
var uuid = require('../basics/uuid');
var EventEmitter = require('../basics/event_emitter');

/**
 * Base node implemention.
 *
 * @class Data.Node
 * @extends EventEmitter
 * @constructor
 * @param {Object} properties
 * @module Data
 */
function Node( properties ) {
  EventEmitter.call(this);

  /**
   * The internal storage for properties.
   * @property properties {Object}
   */
  this.properties = _.extend({}, this.getDefaultProperties(), properties);
  this.properties.type = this.constructor.static.name;
  this.properties.id = this.properties.id || uuid(this.properties.type);
}

Node.Prototype = function() {

  /**
   * Serialize to JSON.
   *
   * @method toJSON
   * @return Plain object.
   */
  this.toJSON = function() {
    return this.properties;
  };

  /**
   * Get default properties.
   *
   * Stub implementation.
   *
   * @method getDefaultProperties
   * @return An object containing default properties.
   */
  this.getDefaultProperties = function() {};

  /**
   * Check if the node is of a given type.
   *
   * @method isInstanceOf
   * @param {String} typeName
   * @return true if the node has a parent with given type, false otherwise.
   */
  this.isInstanceOf = function(typeName) {
    return Node.isInstanceOf(this.constructor, typeName);
  };

  /**
   * Get a the list of all polymorphic types.
   *
   * @method getTypeNames
   * @return An array of type names.
   */
  this.getTypeNames = function() {
    var typeNames = [];
    var staticData = this.constructor.static;
    while (staticData && staticData.name !== "node") {
      typeNames.push(staticData.name);
      staticData = Object.getPrototypeOf(staticData);
    }
    return typeNames;
  };

  /**
   * Get the type of a property.
   *
   * @method getPropertyType
   * @param {String} propertyName
   * @return The property's type.
   */
  this.getPropertyType = function(propertyName) {
    var schema = this.constructor.static.schema;
    return schema[propertyName];
  };

};

// This makes a customized Node.extend() implementation, by overriding default
// key property names, and adding a post-processing hook.
// All subclasses will use this configuration.
OO.makeExtensible(Node,
  { "name": true, "displayName": true, "properties": true },
  Node.initNodeClass
);

OO.inherit(Node, EventEmitter);

/**
 * Symbolic name for this model class. Must be set to a unique string by every subclass.
 * @static
 * @property name {String}
 */
Node.static.name = "node";

/**
 * The node schema.
 *
 * @property schema {Object}
 * @static
 */
Node.static.schema = {
  type: 'string',
  id: 'string'
};

/**
 * Read-only properties.
 *
 * @property readOnlyProperties {Array}
 * @static
 */
Node.static.readOnlyProperties = ['type', 'id'];

/**
 * Internal implementation of Node.prototype.isInstanceOf.
 *
 * @method isInstanceOf
 * @static
 * @private
 */
 Node.isInstanceOf = function(NodeClass, typeName) {
  var staticData = NodeClass.static;
  while (staticData && staticData.name !== "node") {
    if (staticData && staticData.name === typeName) {
      return true;
    }
    staticData = Object.getPrototypeOf(staticData);
  }
  return false;
};

Node.static.isInstanceOf = Node.isInstanceOf;

var defineProperty = function(prototype, property, readonly) {
  var getter, setter;
  getter = function() {
    return this.properties[property];
  };
  if (readonly) {
    setter = function() {
      throw new Error("Property " + property + " is readonly!");
    };
  } else {
    setter = function(val) {
      this.properties[property] = val;
      return this;
    };
  }
  var spec = {
    get: getter,
    set: setter
  };
  Object.defineProperty(prototype, property, spec);
};

var defineProperties = function(NodeClass) {
  var prototype = NodeClass.prototype;
  if (!NodeClass.static.schema) return;
  var properties = Object.keys(NodeClass.static.schema);
  for (var i = 0; i < properties.length; i++) {
    var property = properties[i];
    if (prototype.hasOwnProperty(property)) continue;
    var readonly = ( NodeClass.static.readOnlyProperties &&
      NodeClass.static.readOnlyProperties.indexOf(property) > 0 );
    defineProperty(prototype, property, readonly);
  }
};

var prepareSchema = function(NodeClass) {
  var schema = NodeClass.static.schema;
  var parentStatic = Object.getPrototypeOf(NodeClass.static);
  var parentSchema = parentStatic.schema;
  if (parentSchema) {
    NodeClass.static.schema = _.extend(Object.create(parentSchema), schema);
  }
};

Node.initNodeClass = function(NodeClass, proto) {
  ctor.static.schema = proto.properties;
  defineProperties(NodeClass);
  prepareSchema(NodeClass);
  NodeClass.type = NodeClass.static.name;
};

module.exports = Node;
