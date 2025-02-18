module.exports = {
    base_size: 7,

    getBaseCenter: function(roomName) {
        let start = Game.cpu.getUsed();
        let distanceTransform = this.distanceTransform(roomName);
        let center = new RoomPosition(25, 25, roomName);
        let bestPos = undefined;
        let bestValue = -99999;

        for (let x = 0; x < 50; ++x) {
            for (let y = 0; y < 50; ++y) {
                let value = distanceTransform.get(x, y);
                if (value < this.base_size+1) continue;

                // source distance
                let sources = Game.rooms[roomName].find(FIND_SOURCES);
                let sdistance = 0
                for (let source of sources) {
                    sdistance += source.pos.getRangeTo(x, y);
                }
                value -= sdistance/sources.length;

                // controller distance
                let controller = Game.rooms[roomName].controller;
                value -= controller.pos.getRangeTo(x, y);

                // center pos
                value -= center.getRangeTo(x, y);

                if (value > bestValue) {
                    bestValue = value;
                    bestPos = new RoomPosition(x, y, roomName);
                }
            }
        }

        console.log('Base center calculation:', Game.cpu.getUsed() - start);
        return {pos: bestPos, points: bestValue};
    },

    distanceTransform: function(roomName) {
        let terrain = Game.map.getRoomTerrain(roomName);
        let topDownPass = new PathFinder.CostMatrix();
        for (let y = 0; y < 50; ++y) {
            for (let x = 0; x < 50; ++x) {
                if (terrain.get(x, y) == TERRAIN_MASK_WALL) {
                    topDownPass.set(x, y, 0);
                }
                else {
                    topDownPass.set(x, y,
                        Math.min(topDownPass.get(x-1, y-1), topDownPass.get(x, y-1),
                            topDownPass.get(x+1, y-1), topDownPass.get(x-1, y)) + 1);
                }
            }
        }
    
        for (let y = 49; y >= 0; --y) {
            for (let x = 49; x >= 0; --x) {
                let value = Math.min(topDownPass.get(x, y),
                        topDownPass.get(x+1, y+1) + 1, topDownPass.get(x, y+1) + 1,
                        topDownPass.get(x-1, y+1) + 1, topDownPass.get(x+1, y) + 1);
                topDownPass.set(x, y, value);
            }
        }
        
        return topDownPass;
    }
};