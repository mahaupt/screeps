module.exports = {
    
    run: function(room)
    {
    
    }, 
    
    
    
    
    roomNameToCoords: function(name)
    {
        //W1S12
        if (name == "sim") return {x: 0, y: 0};
        
        var lat = null;
        var latsig = -1;
        var latindex = name.search("S");
        if (latindex >= 0) {
            lat = "S";
        } else {
            lat = "N";
            latindex = name.search("N");
            latsig = +1;
        }
        
        var lon = name.substr(0, 1);
        var lonnum = parseInt(name.substr(1, latindex-1));
        var latnum = parseInt(name.substr(latindex+1));
        
        var lonsig = -1;
        if (lon == "E") {
            lonsig = 1;
        }
        
        var cords = {};
        cords.x = lonnum*lonsig+lonsig;
        cords.y = latnum*latsig+latsig;
        
        return cords;
    },
    
    
    roomCordsToName: function(coords)
    {
        var lat = "N";
        var lon = "E";
        
        if (coords.x < 0) {
            lon = "W";
        }
        if (coords.y < 0) {
            lat = "S";
        }
        
        var lonnum = Math.abs(coords.x)-1;
        var latnum = Math.abs(coords.y)-1;
        
        return lon + lonnum + lat + latnum;
    }
    
    
};