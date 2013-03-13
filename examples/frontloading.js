frontloading = Context.define(function(context) {
  context.role("predecessors", {})
  context.role("currentActivity", {
    earliestStart: function(predecessors) {
      if (predecessors.length == 0) {
        this.start = 0;
        this.finish = this.duration;
        return;
      }

      this.start = Number.MIN_VALUE;
      for (var i = 0; i < predecessors.length; i++) {
        var predecessor = predecessors[i];
        if (predecessor.finish > this.start) {
          this.start = predecessor.finish;
        }
      }
      this.finish = this.start + this.duration;
    }
  })

  context.interaction("earliestFinish", ["currentActivity", "predecessors", function(currentActivity, predecessors){
    currentActivity.earliestStart(predecessors);
  }])

  context.assignRoles(function(activity) {
    for (var i = 0; i < activity.dependsOn.length; i++) {
      frontloading.enact("earliestFinish", activity.dependsOn[i]);
    }

    this.assign(activity).to("currentActivity");
    this.assign(activity.dependsOn).to("predecessors");
  })
});

var Activity = function(duration, dependsOn) {
  this.duration = duration;
  this.dependsOn = dependsOn || [];
}

var a = new Activity(6)
var b = new Activity(4, [a])
var c = new Activity(7, [a])
var d = new Activity(4, [b, c])
var e = new Activity(3, [c])
var f = new Activity(2, [d, e])

frontloading.enact('earliestFinish', f);
console.log(f.start, f.finish);
