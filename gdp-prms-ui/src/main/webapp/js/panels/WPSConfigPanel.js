Ext.ns("PRMS");

PRMS.WPSConfigPanel = Ext.extend(Ext.Panel, {
    layerCombo : undefined,
    layerComboId : 'input-layer',
    inputAttributeId : 'input-attribute',
    inputDatasetUriId : 'input-dataset-uri',
    datasetIdId : 'input-dataset-id',
    datasetDateBeginId : 'input-dataset-date-begin',
    datasetDateEndId : 'input-dataset-date-end',
    requireFullCoverageId : 'input-dataset-require-full-coverage',
    datasetEmailId : 'input-dataset-email',
    'wfs-url' : undefined,
    'wps-processing-url' : undefined,
    constructor : function(config) {
        if (!config) config = {};
        
        this.layerCombo = new Ext.form.ComboBox({
            id : this.layerComboId
            });
        this['wfs-url'] = config['wfs-url'];
        this['wps-processing-url'] = config['wps-processing-url'];

        config = Ext.apply({
            id: 'panel-wpsconfig',
            layout : 'form',
            items: [
            this.layerCombo,
            {
                xtype : 'textfield',
                fieldLabel : 'Attribtue',
                id : this.inputAttributeId
            },
            {
                xtype : 'textfield',
                fieldLabel : 'Dataset URI',
                id : this.inputDatasetUriId
            },
            {
                xtype : 'textfield',
                fieldLabel : 'Dataset ID',
                id : this.datasetIdId
            },
            {
                xtype : 'datefield',
                fieldLabel : 'Begin Date',
                allowBlank: true,
                id : this.datasetDateBeginId
            },
            {
                xtype : 'datefield',
                fieldLabel : 'End Date',
                allowBlank: true,
                id : this.datasetDateEndId
            },
            {
                xtype : 'checkbox',
                fieldLabel : 'Require Full Coverage',
                id : this.requireFullCoverageId
            },{
                xtype : 'textfield',
                fieldLabel : 'E-Mail',
                id : this.datasetEmailId
            }
            ],
            buttons: [
            {
                xtype : 'button',
                text : 'Submit',
                listeners : {
                    click : this.submitButtonClicked,
                    scope : this
                }
            },
            {
                xtype : 'button',
                text : 'Clear'
            }
            ]
        }, config);
        PRMS.WPSConfigPanel.superclass.constructor.call(this, config);
    
        this.initializeLayerCombo();
    
    },
    comboSelectFunctionality : function(store, record) {
        var chosenLayer = record.id;
        
    },
    initializeLayerCombo : function() {
        Ext.Ajax.request({
            url : 'proxy?url=' + this['wfs-url'] + '/rest/workspaces/upload/datastores.json',
            disableCaching : false,
            success : function(response) {
                var responseJSON = Ext.util.JSON.decode(response.responseText);
                var layerStore = new Ext.data.JsonStore({
                    storeId: 'layer-store',
                    root: 'dataStores.dataStore',
                    idProperty: 'name',
                    fields: ['name']
                });
                layerStore.loadData(responseJSON);
                
                this.remove(this.layerComboId);
                this.layerCombo = new Ext.form.ComboBox({
                    id : this.layerComboId,
                    fieldLabel : 'Layer',
                    emptyText : 'Choose A Layer',
                    triggerAction: 'all',
                    mode : 'local',
                    store : layerStore,
                    valueField: 'name',
                    displayField: 'name',
                    editable: false,
                    listeners : {
                        select : this.comboSelectFunctionality,
                        scope : this
                    }
                })
                this.insert(0, this.layerCombo);
                this.doLayout();
            }, 
            failure : function() {
                LOG.debug('')
            },
            scope : this
        })
    },
    submitButtonClicked : function() {
        var form = Ext.getCmp('panel-wpsconfig');
        var layerName = form.getComponent(this.layerComboId).getValue();
        var attribute = form.getComponent(this.inputAttributeId).getValue();
        var datasetUri = form.getComponent(this.inputDatasetUriId).getValue();
        var datasetId = form.getComponent(this.datasetIdId).getValue();
        var datasetDateBegin = form.getComponent(this.datasetDateBeginId).getValue();
        var datasetDateEnd = form.getComponent(this.datasetDateEndId).getValue();
        var requireFullCoverage = form.getComponent(this.requireFullCoverageId).getValue(); 
        var datasetEmail = form.getComponent(this.datasetEmailId).getValue(); 
        
        var PRMSProcXml = new PRMS.PRMSWFGSProcess({
            layerName : layerName,
            attribute : attribute,
            datasetUri : datasetUri,
            datasetId : datasetId,
            datasetDateBegin : datasetDateBegin,
            datasetDateEnd : datasetDateEnd,
            requireFullCoverage : requireFullCoverage,
            wfsUrl : this['wfs-url'] + "/wfs"
        }).createWpsExecuteRequest();
        
        Ext.Ajax.request({
            url : 'proxy?url=' + CONFIG.WPS_PROCESS_URL + '/WebProcessingService',
            method : "POST",
            xmlData : PRMSProcXml,
            scope : {
                that : this,
                initializeEmailProcess : this.initializeEmailProcess,
                email : datasetEmail
            },
            success : function(response) {
                if ($(response.responseXML).find('ns\\:ProcessStarted').length) {
                    var statusURL = $(response.responseXML).find('ns\\:ExecuteResponse').attr('statusLocation');
                    this.initializeEmailProcess({
                        statusURL : statusURL,
                        email : this.email
                    });
                } else {
                    LOG.debug('The process failed')
                }
            },
            failure : function(response) {
                LOG.debug('')
            }
        })
        
    },
    initializeEmailProcess : function(args) {
        var emailProcXml = new PRMS.EmailWhenFinishedProcess({
            email : args.email,
            'wps-checkpoint' : args.statusURL
        }).createWpsExecuteRequest();
        
        Ext.Ajax.request({
            url : 'proxy?url=' + CONFIG.WPS_UTILITY_URL + '/WebProcessingService',
            method : "POST",
            xmlData : emailProcXml,
            scope : this,
            success : function(response) {
                if ($(response.responseXML).find('ns\\:ProcessSucceeded').length) {
                    alert($(response.responseXML).find('ns\\:Output > ns\\:Data > ns\\:LiteralData').text());
                } else {
                    LOG.debug('The process failed')
                }
            },
            failure : function(response) {
                LOG.debug('')
            }
        })
    }
});