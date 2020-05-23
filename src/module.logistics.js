var moduleLogistics = {
    run: function(room) {
        if (!room.memory.ltasks) {
            room.memory.ltasks = [];
        }
        room.memory.ltasks_upd = true;
        
        //ltasks = {p, t:, s:, v:, a:, [r:, res:]}
        //prio, type, source, volume, accepted volume, [receiver], [resource type]
        //moduleLogistics.updateTaskList(room);
        //moduleLogistics.sortTaskList(room);
    }, 
    
    updateTaskList: function(room)
    {
        moduleLogistics.removeInvalidTasks(room);
        moduleLogistics.genLootTasks(room);
        moduleLogistics.genLinkTask(room);
        moduleLogistics.genContainerTasks(room);
        moduleLogistics.genSpawnDistributionTask(room);
    }, 
    
    removeInvalidTasks: function(room)
    {
        //also remove inactive MC and Links
        _.remove(room.memory.ltasks, (s) => { 
            return ((s.t == 'mc' || s.t == 'l') && s.a == 0) || 
                Game.getObjectById(s.s) == null; });
    }, 
    
    //generates hauling tasks for transporting loot
    genLootTasks: function(room)
    {
        //get loot sources
        var res = room.find(FIND_DROPPED_RESOURCES);
        var ts = room.find(FIND_TOMBSTONES);
        var ru = room.find(FIND_RUINS);
        
        var targets = [].concat(res, ts, ru);
        
        for (var i=0; i < targets.length; i++)
        {
            var amount = targets[i].amount || targets[i].store.getUsedCapacity();
            
            if (amount > 0)
            {
                var task = {};
                task.p = 6;
                task.t = "loot";
                task.s = targets[i].id;
                task.v = amount;
                task.a = 0;
                
                moduleLogistics.insertOrUpdate(room, task);
            }
        }
    }, 
    
    //generates hauling tasks for emtying base links
    genLinkTask: function(room)
    {
        //find base links
        var links = room.find(FIND_STRUCTURES, {filter: (s) => {
            return s.structureType == STRUCTURE_LINK &&
            s.pos.findInRange(FIND_SOURCES, 2).length == 0 && 
            s.store.getUsedCapacity(RESOURCE_ENERGY) > 0;
        }});
        
        for (var i=0; i<links.length; i++)
        {
            var task = {};
            task.p = 7;
            task.t = "l";
            task.s = links[i].id;
            task.v = links[i].store.getUsedCapacity(RESOURCE_ENERGY);
            task.a = 0;
            
            moduleLogistics.insertOrUpdate(room, task);
        }
    }, 
    
    //
    genContainerTasks: function(room)
    {
        //find mining containers without links
        var mcontainers = room.find(FIND_STRUCTURES, {filter: (s) => {
            return s.structureType == STRUCTURE_CONTAINER && 
                (s.pos.findInRange(FIND_SOURCES, 2).length>0 || 
                s.pos.findInRange(FIND_MINERALS, 2).length>0) && 
                s.store.getUsedCapacity() >= s.store.getCapacity()*0.1 && 
                s.pos.findInRange(FIND_STRUCTURES, 2, {filter: (t) => t.structureType == STRUCTURE_LINK}).length == 0;
        }});
        
        for (var i=0; i < mcontainers.length; i++)
        {
            var task = {};
            task.p = 5;
            task.t = "mc";
            task.s = mcontainers[i].id;
            task.v = mcontainers[i].store.getUsedCapacity();
            task.a = 0;
            
            moduleLogistics.insertOrUpdate(room, task);
        }
        
    },
    
    //carries energy from Containers and Storages to Spawn
    genSpawnDistributionTask: function(room)
    {
        //calc energy need of towers (and labs?)
        var energyNeed = room.find(FIND_MY_STRUCTURES, 
            {
                filter: (s) => 
                { 
                    return s.structureType == STRUCTURE_TOWER && 
                        s.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                }
            }
        );
        var structEnergyNeed = 0;
        for (let i=0; i < energyNeed.length; i++)
        {
            structEnergyNeed += energyNeed[i].store.getFreeCapacity(RESOURCE_ENERGY);
        }
        
        //calc total energy needed
        var energyNeeded = room.energyCapacityAvailable - room.energyAvailable + structEnergyNeed;
        var source = false;
        
        //get base containers containing energy
        var containers = room.find(FIND_STRUCTURES, {filter: (s) => {
            return s.structureType == STRUCTURE_CONTAINER && 
            s.pos.findInRange(FIND_SOURCES, 2).length == 0 && 
            s.store[RESOURCE_ENERGY] > 0;
        }});
        containers = _.sortBy(containers, (s)=>-s.store[RESOURCE_ENERGY]);
        
        //get energy of fullest container
        var contStorage = 0;
        if (containers.length > 0)
        {
            contStorage = containers[0].store[RESOURCE_ENERGY];
        }
        
        if (room.storage && 
            room.storage.store[RESOURCE_ENERGY] > contStorage)
        {
            source = room.storage;
        } else if (containers.length > 0) {
            source = containers[0];
        }
        
        if (source) {
             
            var task = {};
            task.p = 4;
            task.t = "s";
            task.s = source.id;
            task.v = energyNeeded;
            task.a = 0;
            
            moduleLogistics.insertOrUpdate(room, task, true);
        } else {
            moduleLogistics.removeTaskGroup(room, "s");
        }
    },
    
    //insert or update task
    //if ignoreSource=true, only compares task type
    insertOrUpdate: function(room, task, ignoreSource=false)
    {
        var index = _.findIndex(room.memory.ltasks, (s) => { return (s.s == task.s || ignoreSource) && s.t == task.t; });
        
        if (index >= 0)
        {
            //update
            var accepted = room.memory.ltasks[index].a;
            room.memory.ltasks[index] = task;
            room.memory.ltasks[index].a = accepted;
        } else {
            //insert
            room.memory.ltasks.push(task);
        }
    }, 
    
    removeTaskGroup: function(room, taskgroup)
    {
        room.memory.ltasks = _.remove(room.memory.ltasks, (s) => { return s.t != taskgroup; });
    },
    
    
    sortTaskList: function(room)
    {
        room.memory.ltasks = _.sortBy(room.memory.ltasks, (s) => -(s.p*1000000+s.v-s.a));
    },
    
    
    getTask: function(room, capacity)
    {
        if (room.memory.ltasks_upd) {
            moduleLogistics.updateTaskList(room);
            room.memory.ltasks_upd = false;
        }
        moduleLogistics.sortTaskList(room);
        
        var index = _.findIndex(room.memory.ltasks, (s) => { return s.v > s.a;});
        
        if (index >= 0) {
            room.memory.ltasks[index].a += capacity;
            return room.memory.ltasks[index];
        }
        
        return null;
    }, 
    
    dropTask: function(room, task, capacity)
    {
        var index = _.findIndex(room.memory.ltasks, (s) => { return s.s == task.s && s.t == task.t; });
        
        if (index >= 0)
        {
            room.memory.ltasks[index].a -= capacity;
            if (room.memory.ltasks[index].a < 0) {
                room.memory.ltasks[index].a = 0;
            }
        }
    }, 
    
    deleteTask: function(room, task)
    {
        room.memory.ltasks = _.remove(room.memory.ltasks, (s) => { 
            return !(s.s == task.s && s.t == task.t); 
        });
    }
    
    
};


module.exports = moduleLogistics;