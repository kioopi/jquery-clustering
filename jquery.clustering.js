/**
 * jQuery Marker-Clustering Plugin
 *
 * Copyright (c) 2009 Codevise Solutions Ltd 
 *
 * Licensed under the MIT License:
 *   http://www.opensource.org/licenses/mit-license.php
 *
 * @author Vangelis Tsoumenis
 * @version 0.5
 * @date June 2009
 *
 */
(function($){ 


  /* private functions */ 

  function collect_markers(ul){
       // accepts a qjery object
       // collects data (from ul), returns a list of objects 
       var markers = []
       ul.find($.fn.clusters.defaults.positioned_subelement).each(function(id){
          var that = $(this);  
          markers.push({ id:id,
                         x:parseFloat(that.css('left')), 
                         y:-1*parseFloat(that.css('top')), 
                         alt:that.find('img').attr('alt'), 
                       });  
       });
       return markers; 
  }

  var sum = function(field){ 
           // creates the sum of the values of field of all objects
           var summe = 0;
           for(var i=0; i<this.markers.length; i++){
               summe += this.markers[i][field];
           }
           return summe;
  }; 

  function cluster(markers, radius ){   
       // interates over markes generates clusters based on priximity 
       // returns an array with clusters
       radius = radius || $.fn.clusters.defaults.radius; 
       dist = $.fn.clusters.distance_func; 
       var bunches = []; 
       for(var m=0; m<markers.length; m++){ 
       var marker = markers[m]; 
       var bunched = false; 
       for(var b=0; b<bunches.length; b++){
          bunch=bunches[b];  
          if(dist(marker,bunch)<radius){ 
   	  // add marker to bunch
   	  bunch.markers.push(marker); 
   	  bunch.update_center(); 
   	  bunched = true;
   	  break;
          } 
       } // endfor bunches
       if(!bunched){ 
          bunches.push({
   	    markers : [marker],
   	    x : marker.x, 
   	    y : marker.y, 
   	    sum : sum,  
   	    update_center : function(){ 
   	      this.x = this.sum('x') / this.markers.length; 
   	      this.y = this.sum('y') / this.markers.length; 
   	    } 
          });
       } 
     } // endfor markers  
     return bunches;
  }
  
  function bunch_node(bunch, node_type){ 
       // builds a dom-dom node for a given bunch
       node_type = node_type || $.fn.clusters.defaults.positioned_subelement; 
       var bnode = $('<'+node_type+'>').css({width:'2em', height:'2em',
                               left: bunch.x+'em', top: (bunch.y*-1)+'em'  });  
       
        
       var brep = $('<span>');

       $.each($.fn.clusters.defaults.bunch_node_funcs, function(i,func){
          func(brep, bunch);  
       }); 

       return bnode.append(brep); 
  }

  /* plugin definition */ 

  $.fn.clusters = function(options){
     opts = $.extend($.fn.clusters.defaults, options);
     return this.each(function() {  
        var container = $(this);  
        if(!opts.marker_image){ 
           opts.marker_image = $.fn.clusters.get_marker_img(container);  
        } 
         
        var markers = collect_markers(container); 
        var bunches = cluster(markers);      
        container.empty(); 
        $.each(bunches,function(i,bunch){
           container.append(bunch_node(bunch)); 
        }); 
     });  
  };  

  /* public functions */ 
  
  $.fn.clusters.bunchnode = { 
   // function is called on creation of a bunch and can be used to  
  // add dynamic styles to a bunch's html representation
  style : function(bnode, bobj){ 
       if(bobj.markers.length>3){ 
          bnode.css('font-size', '1.6em')
       }  else if(bobj.markers.length>1){ 
          bnode.css('font-size', '1.3em')
       } else {
         // bnode.css('background', 'none').append($('<img src="'+$.fn.clusters.defaults.marker_image+'" alt="'+bunch.markers[0].alt+'">'));
       } 
         
       return bnode;
  }, 
  bg_image : function(bnode, bobj){ 
       if($.fn.clusters.defaults.marker_image){ 
            bnode.css('background', 'url('+$.fn.clusters.defaults.marker_image+') center no-repeat');
       } 
  }, 
  pure_css : function(bnode, bobj){ 
       bnode.css({position:'relative', padding:'0.1em 0.4em'}); 
       bnode.css({ background:'red'}); 
       bnode.css('border', '1px solid black');
       bnode.css('-moz-border-radius', '1em'); 
       bnode.css('font-size', (1+(bobj.markers.length*0.2))+'em')
       bnode.html(bobj.markers.length); 
       return bnode;
  },
  image : function(bnode, bobj){ 
     var img = $('<img>'); 
     img.attr('src', $.fn.clusters.defaults.marker_image); 
     img.css('position', 'absolute'); 
     img.css({top:'auto', left:'auto'});
     img.css('z-index', 0); 
     bnode.append(img);
     return bnode;
  }, 
  label : function(bnode, bobj){
      var span = $('<span>'+ bobj.markers.length + '</span>'); 
      span.css('position', 'absolute'); 
      span.css({top:'auto', left:'auto'});
     
      span.css('padding-left', '0.2em'); 
     // span.css('width', '100%'); 
      span.css('text-align', 'center'); 
      span.css('z-index', 100); 
      bnode.append(span);
  } 

    
  }; 
 

/* defaults that can be overridden by the user */
  $.fn.clusters.defaults = { 
      // selector to the subelements that contain the positioning 
      positioned_subelement : 'li', 
      radius: 2.3, 
      marker_image: false, 
      bunch_node_funcs:  [$.fn.clusters.bunchnode.label, $.fn.clusters.bunchnode.style, $.fn.clusters.bunchnode.image]
      // [ bunch_pure_css ]
  }; 

  // returns distance between two objects based on their x and y attributes 
  $.fn.clusters.distance_func = function(p1, p2){
    // euclidean distance 
    return Math.sqrt(Math.pow(p1.x - p2.x,2) + Math.pow(p1.y - p2.y,2));
  }; 

  // returns the image representing a single marker 
  $.fn.clusters.get_marker_img = function(container){  
    return $(container).find('img').eq(0).attr('src');     
  }; 

})(jQuery);  
