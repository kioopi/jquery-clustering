/**
* jQuery Marker-Clustering Plugin
*
* Copyright (c) 2009 Codevise Solutions Ltd
*
* Licensed under the MIT License:
* http://www.opensource.org/licenses/mit-license.php
*
* @author Vangelis Tsoumenis
* @version 0.5
* @date June 2009
*
*/
(function($){


  /* private functions */
  function collect_markers(ul){
       // accepts a jquery object
       // collects data (from ul), returns a list of objects
       
       var markers = [];
       ul.find($.fn.clusters.defaults.positioned_subelement).each(function(id){
          var marker = $(this);
          var mobj = { id:id,
                    x:parseFloat(marker.css('left')),
                    y:-1*parseFloat(marker.css('top'))
                  }

          // iterate over the collector funcs and let them do their thing
          $.each($.fn.clusters.defaults.collectors, function(i,func){
              mobj = func(marker, mobj);
          });
          markers.push(mobj);
       });
       return markers;
  }
 
 
  function cluster(markers, radius ){
       // interates over markes generates clusters based on priximity
       // returns an array with clusters
       radius = radius || $.fn.clusters.defaults.radius;
       var dist = $.fn.clusters.distance_func;
       var bunches = [];
       var bunch;
       for(var m=0; m<markers.length; m++){
       var marker = markers[m];
       var bunched = false;
       for(var b=0; b<bunches.length; b++){
          bunch=bunches[b];
          if(dist(marker,bunch)<radius){
              // add marker to bunch
              bunch.add_marker(marker);
              bunched = true;
              break;
          }
       } // endfor bunches
       if(!bunched){
          bunch = new $.fn.clusters.Bunch(); 
          bunch.add_marker(marker);
          bunches.push(bunch);
       }
     } // endfor markers
     return bunches;
  }
  
  function bunch_node(bunch, node_type){
       // builds a dom-dom node for a given bunch
       // FIXME this shouldn't neccessary be in ems;
       node_type = node_type || $.fn.clusters.defaults.positioned_subelement;
       var bnode = $('<'+node_type+'>').css({width:'2em', height:'2em',
                               left: bunch.x+'em', top: (bunch.y*-1)+'em' });
       
        
       var brep = $('<span>');
 
       // iterate over the display funcs and let them do their thing
       $.each($.fn.clusters.defaults.displayers, function(i,func){
          func(brep, bunch);
       });

       bnode.append(brep);
 
       // append an ul with all the clustered markers  
       // in order to minize information loss
       var markers = $('<ul>').css('display', 'none');  
       for(var i=0, j=bunch.markers.length; i<j; i++){
          var m = bunch.markers[i];
          var li = $('<li>').css({width:'2em', height:'2em',
                    left: m.x+'em', top: (m.y*-1)+'em' });
          if(m.img){ 
            li.append($('<img>').attr('src', m.img.src)
                                .attr('alt', m.img.alt)
                                .attr('title', m.img.title));  
          } 
          markers.append(li);
       } 
       bnode.append(markers);

       
       return bnode;
  }
 
  /* plugin definition */
  $.fn.clusters = function(options){
     var opts = $.extend($.fn.clusters.defaults, options);
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
 
  /* definition of the object Bunch */ 
  // serves as prototype for bunches
  $.fn.clusters.Bunch = function(){
     this.markers = [];
     this.markers.sum = function(field){
          // takes the name of a property of a marker and returns 
          // the field summed up over all elements in Bunch.markers
         var summe = 0;
         for(var i=0, j=this.length; i<j; i++){
             summe += this[i][field];
         }
          return summe;
     };
  };
      
  $.fn.clusters.Bunch.prototype.update_center = function(){  
      this.x = this.markers.sum('x') / this.markers.length;
      this.y = this.markers.sum('y') / this.markers.length;
  }

  $.fn.clusters.Bunch.prototype.add_marker = function(marker){  
      this.markers.push(marker);
      this.update_center(); 
  }; 
  

  /* public functions */
  $.fn.clusters.collectors = {
      single_image : function(marker, obj){ 
          // check if there is an img and add its data 
          var img = marker.find('img'); 
          if(img.length){ 
             obj.img = { 
                alt : img.attr('alt'),
                title : img.attr('title'),
                src : img.attr('src')
             } 
          } 
          return obj;
      } 
 
  }; 
  
  $.fn.clusters.displayers = {
    // the functions in this objects all accept a dom node and a bunch object.
    // the dome node is the positioned element reprsenting the marker on the map
    // the contents of this node can be altered in these functions to customise the representation of the bunch
    // the bunch object is the represented bunch.
    // not all of the functions are called automaticly. the ones to act on the bunchs are listed in the array
    // $.fn.clusters.defaults.representation

  style : function(bnode, bobj){
       if(bobj.markers.length>3){
          bnode.css('font-size', '1.6em');
       } else if(bobj.markers.length>1){
          bnode.css('font-size', '1.3em');
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
  // a stand-alone representation function for modern browsers
  pure_css : function(bnode, bobj){
       bnode.css({position:'relative', padding:'0.1em 0.4em'});
       bnode.css({ background:'red'});
       bnode.css('border', '1px solid black');
       bnode.css('-moz-border-radius', '1em');
       bnode.css('-webkit-border-radius', '1em');
       bnode.css('font-size', (1+(bobj.markers.length*0.2))+'em');
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

  // appends an <img> from bunch_images to the representation 
  multi_image : function(bnode, bobj){
     var img = $('<img>');
     img.attr('src', $.fn.clusters.defaults.bunch_images.get(bobj));
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
      bunch_images: {
         1:'medium.png',
         2:'large.png',
         4:'xlarge.png',
         6:'xxlarge.png'
      },


      collectors: [$.fn.clusters.collectors.single_image  ], 

      // an array of functions that act on the dom-representation of a bunch
      // 1st arg: dom-node, 2nd arg: bunch-object
      displayers: [$.fn.clusters.displayers.label, $.fn.clusters.displayers.style, $.fn.clusters.displayers.multi_image]
      // [ bunch_pure_css ]
  };

  // function returns the proper image for a passed in bunch
  $.fn.clusters.defaults.bunch_images.get = function(bunch){
     for(n=bunch.markers.length; n>0; n--){
        if(this[n]){
           return this[n];
        }
     }
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

