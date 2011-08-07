Ext.ns("GDP");

GDP.BaseMap = Ext.extend(GeoExt.MapPanel, {
	layerController : undefined,
	currentLayer : undefined,
	constructor : function(config) {
            LOG.debug('BaseMap:constructor: Constructing self.');
		// From GDP (with Zoerb's comments)
		// Got this number from Hollister, and he's not sure where it came from.
		// Without this line, the esri road and relief layers will not display
		// outside of the upper western hemisphere.
		var MAX_RESOLUTION = 1.40625/2;
                
		if (!config) config = {};
		
		var map = new OpenLayers.Map({
			maxResolution: MAX_RESOLUTION
                        ,maxExtent: new OpenLayers.Bounds(-180, -90, 180, 90)
                        ,controls: [
                            new OpenLayers.Control.MousePosition()
                            ,new OpenLayers.Control.ScaleLine()
                            ,new OpenLayers.Control.Navigation()
                            ,new OpenLayers.Control.ArgParser()
                            ,new OpenLayers.Control.Attribution()
                            ,new OpenLayers.Control.PanZoomBar()
                        ]
		});
			
		config = Ext.apply({
                    map : map,
                    center : new OpenLayers.LonLat(-96, 38),
                    zoom : 4
		}, config);
                
		GDP.BaseMap.superclass.constructor.call(this, config);
		LOG.debug('BaseMap:constructor: Construction complete.');
                
                LOG.debug('BaseMap:constructor: Registering Observables.');
                this.addEvents(
                    'baselayerreplaced'
                )
                
                LOG.debug('BaseMap:constructor: Registering Listeners.');
                {
                    this.layerController = config.layerController;
                    this.layerController.on('changebaselayer', function() {
                        LOG.debug('BaseMap: Observed "changebaselayer".');
                        this.onReplaceBaseLayer(this.layerController.getBaseLayer());
                    },this);
                    this.layerController.on('changelayer', function() {
                        LOG.debug('BaseMap: Observed "changelayer".');
                        this.onChangeLayer();
                        this.currentLayer = this.findCurrentLayer();
                    }, this);
                    this.layerController.on('changedimension', function() {
                        LOG.debug('BaseMap: Observed "changedimension".');
                        this.onChangeDimension();
                        this.currentLayer = this.findCurrentLayer();
                    }, this);
                    this.layerController.on('changeopacity', function() {
                        LOG.debug('BaseMap: Observed "changeopacity".');
                        this.onChangeOpacity();
                    }, this);
                    this.layerController.on('changelegend', function() {
                        LOG.debug('BaseMap: Observed "changelegend".');
                        this.onChangeLegend();
                        this.currentLayer = this.findCurrentLayer();
                    }, this);
                    
                }
	},
        zoomToExtent : function(record) {
            if (!record) return;
            this.map.zoomToExtent(
                OpenLayers.Bounds.fromArray(record.get("llbbox"))
            );
        },
	findCurrentLayer : function() {
            LOG.debug('BaseMap: Handling "findCurrentLayer".');
            var storeIndex = this.layers.findBy(function(record, id) {
                return (this.layerController.getLayerOpacity() === record.get('layer').opacity);
            }, this, 1);
            if (-1 < storeIndex) {
                    return this.layers.getAt(storeIndex);
            } else {
                    return null;
            }
	},
	clearLayers : function() { //TODO- This needs to change to handle only regular layers. Not baselayers or vector layers
            LOG.debug('BaseMap:clearLayers: Handling request.');
            Ext.each(this.layers, function(item, index, allItems){
                var layer = item.data.get(0).data.layer;
                if (layer.isBaseLayer) {
                    LOG.debug('BaseMap:clearLayers: Layer '+layer.id+' is a base layer and will not be cleared.');
                    return;
                }                
                this.layers.remove(layer);
                LOG.debug('BaseMap:clearLayers: Cleared layer: ' + layer.id);
            },this);
            LOG.debug('BaseMap:clearLayers: Clearing layers complete');
	},
	onChangeLayer : function() {
            LOG.debug('BaseMap:onChangeLayer: Handling request.')
            
            var layer = this.layerController.getLayer();

            if (!this.currentLayer || this.currentLayer.getLayer() !== layer) {
                    this.zoomToExtent(layer);
                    this.clearLayers();

                    var params = {};
                    Ext.apply(params, this.layerController.getAllDimensions());
                    this.replaceLayer(layer, params);
            }
	},
	onChangeDimension : function() {
            LOG.debug('BaseMap:onChangeDimension: Handling request.');
		var existingLayerIndex = this.layers.findBy(function(record, id) {
                    LOG.debug(' BaseMap:onChangeDimension: Checking existing layer index.');
                    var result = true;
                    var requestedDimensions = this.layerController.getAllDimensions();
                    Ext.iterate(requestedDimensions, function(extentName, value) {
                            var layer = record.getLayer();
                            if (layer.CLASS_NAME === 'OpenLayers.Layer.Vector' || layer.isBaseLayer) {
                                // Disregard testing the vector and base layers
                                result = false;
                            } else {
                                var existingDimension = record.getLayer().params[extentName.toUpperCase()];
                                result = result && (existingDimension === value)
                            }
                    }, this);
                    LOG.debug(' BaseMap:onChangeDimension: Found existing layer index ' + result);
                    return result;
		}, this, 0);
		
		var params = {};
		Ext.apply(params, this.layerController.getAllDimensions());
		
		this.replaceLayer(
			this.layerController.getLayer(), 
			params,
			(-1 < existingLayerIndex) ? existingLayerIndex : undefined
		);
	},
        onChangeLegend : function() {
            LOG.debug('BaseMap:onChangeLegend: Handling Request.');
            if (!this.layerController.getLayer()) return;
            var record = this.layerController.getLegendRecord();
            this.clearLayers();
            this.replaceLayer(
                this.layerController.getLayer(),
                {
                    styles: record.id
                }
            );
            
        },
	onChangeOpacity : function() {
            LOG.debug('BaseMap:onChangeOpacity: Handling Request.');
            if (this.currentLayer) {
                    this.currentLayer.getLayer().setOpacity(this.layerController.getLayerOpacity());
            }
        },
        onReplaceBaseLayer : function(record) {
            LOG.debug('BaseMap:onReplaceBaseLayer: Handling Request.');
            if (!record) {
                LOG.debug('BaseMap:onReplaceBaseLayer: passed record object null or undefined. Returning without modifications.');
                return;
            }
            
            var baseLayerIndex = 0;
            if (this.layers.getCount() > 0) {
                baseLayerIndex = this.layers.findBy(function(r, id){
                    return r.data.layer.isBaseLayer
                });
                
                if (baseLayerIndex > -1 ) {
                    this.layers.removeAt(baseLayerIndex);
                    LOG.debug('BaseMap:onReplaceBaseLayer: Removed base layer from this object\'s map.layers at index ' + baseLayerIndex + '.');
                }
            }
            
            this.layers.add([record]);
            this.fireEvent('baselayerreplaced');
            LOG.debug('BaseMap:onReplaceBaseLayer: Added base layer to this object\'s map.layers at index ' + baseLayerIndex + '.');
        },
	replaceLayer : function(record, params, existingIndex) {
            LOG.debug('BaseMap:replaceLayer: Handling request.');
		if (!record) return;
		if (!params) {
			params = {};
		}
		
		if (existingIndex) {
                        LOG.debug('BaseMap:replaceLayer: Replacing current layer with already-existing layer at index ' + existingIndex);
			var newLayer = this.layers.getAt(existingIndex).getLayer();
			newLayer.setOpacity(this.layerController.getLayerOpacity());
		} else {
                        LOG.debug('BaseMap:replaceLayer: Replacing current layer with a new layer.');
			var copy = record.clone();
			
			params = Ext.apply({
				format: "image/png"
				,transparent : true
                                ,styles : (params.styles) ? params.styles : this.layerController.getLegendRecord().id
			}, params);

			copy.get('layer').mergeNewParams(params);
			copy.get('layer')['opacity'] = this.layerController.getLayerOpacity();
			copy.get('layer')['url'] = 'proxy/' + copy.get('layer')['url'];

			copy.getLayer().events.register('loadend', this, function() {
                            if (LOADMASK) LOADMASK.hide();
			});
			this.layers.add(copy);
		}
		
		if (this.currentLayer) {
                    LOG.debug('BaseMap:replaceLayer: Setting current layer opacity to 0');
                    this.currentLayer.getLayer().setOpacity(0);
		}
	}
});