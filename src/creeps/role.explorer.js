/*
Memory Layout
.role = "explorer"
.harvesting = true/false
.renewSelf = true/false
*/

var roleExplorer =  {
    run: function(creep) {
        if (!creep.memory.harvesting && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.harvesting = true;
        }
        if (creep.memory.harvesting && creep.store.getFreeCapacity() == 0) {
            creep.memory.harvesting = false;
        }
    }, 
    
    
    
};


module.exports = roleExplorer;