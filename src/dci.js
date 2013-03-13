(function() {
  function Clone() { }
  function clone(obj) {
    Clone.prototype = obj;
    return new Clone();
  }

  function eachOwnProperty(obj, fn) {
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        fn(key, obj[key]);
      }
    }
  }

  function extend(destination, source) {
    eachOwnProperty(source, function(key, value) {
      destination[key] = value;
    });

    return destination;
  }

  function assumeRole(obj, role) {
    return extend(clone(obj), role);
  }

  function retireRole(wrapped, obj, role) {
    eachOwnProperty(wrapped, function(key, value) {
      if (role[key]) return;
      obj[key] = wrapped[key]
    });
  }

  var ContextDefinition = function() {
    this.roles = {};
    this.interactions = {};
  }

  ContextDefinition.prototype.role = function(name, definition) {
    this.roles[name] = definition;
  }

  ContextDefinition.prototype.interaction = function(name, annotation) {
    implementation = annotation.pop();
    implementation.roles = annotation;
    this.interactions[name] = implementation;
  }

  ContextDefinition.prototype.assignRoles = function(initializer) {
    this.initializer = initializer;
  }

  var RoleAssignment = function(roles) {
    this.roles = roles;
    var assignments = this.assignments = {};
    this.mapper = {
      assign: function(source) {
        return {
          to: function(role) {
            assignments[role] = source;
          }
        }
      }
    }
  }

  RoleAssignment.prototype.wrap = function(implementation) {
    this.wrapped = []
    for (var i = 0; i < implementation.roles.length; i++) {
      var name = implementation.roles[i];
      var role = this.roles[name]
      var source = this.assignments[name]
      this.wrapped.push(assumeRole(source, role))
    }
  }

  RoleAssignment.prototype.unwrap = function(implementation) {
    for (var i = 0; i < implementation.roles.length; i++) {
      var name = implementation.roles[i];

      var wrapped = this.wrapped[i]
      var role = this.roles[name]
      var source = this.assignments[name]
      retireRole(wrapped, source, role)
    }
  }

  window.Context = {
    define: function(fn) {
      definition = new ContextDefinition();
      fn(definition)

      var enact = function(interaction) {
        var implementation = definition.interactions[interaction]
        var args = [].splice.call(arguments, 1);

        var roleAssignment = new RoleAssignment(definition.roles);
        definition.initializer.apply(roleAssignment.mapper, args)
        roleAssignment.wrap(implementation)
        implementation.apply(null, roleAssignment.wrapped);
        roleAssignment.unwrap(implementation)
      }

      return { enact: enact };
    }
  }
}) ()
