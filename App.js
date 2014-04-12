// Custom Rally App that displays Stories in a grid.
//
// Note: various console debugging messages intentionally kept in the code for learning purposes

Ext.define('DefectsFixed', 
{
    extend: 'Rally.app.App',      // The parent class manages the app 'lifecycle' and calls launch() when ready
    componentCls: 'app',          // CSS styles found in app.css


      items: 
      [
          {
          // use xtype instead of Explicitly createing a Container: pulldownContainer = Ext.create('Ext.container.Container', 
          xtype: 'container',
          
          // id - unique across entire app
          // itemid - unique only for container it's in
          itemId: 'pulldown-container-id',

          layout: 
          {
              type: 'hbox',
              align: 'stretch'
          },

          width: 800
          /*
          order: 1,
          style: {borderColor:'#000000', borderStyle:'solid', borderWidth:'1px'},
          
          defaults: 
          {
            labelWidth: 80,
            implicitly create Container by specifying xtype
            xtype: 'datefield',
            flex: 1,
            style: 
            {
              padding: '10px'
            }
          },
          items: 
          [
            {
              xtype: 'datefield',
              name: 'startDate',
              fieldLabel: 'Start date'
            },

            {
              xtype: 'datefield',
              name: 'endDate',
              fieldLabel: 'End date'
            }
          ]
          */

          }
      ],


    // app level references to teh store and grid for easy access in various methods
    defectStore: undefined,
    defectGrid: undefined, 

    // Entry Point to App
    launch: function() 
    {
      var me = this;
      console.log('our first app');     // see console api: https://developers.google.com/chrome-developer-tools/docs/console-api
      
      me._loadIterations();
    },


    _onIterationsReady: function(combobox, eOpts)
    {
      var me = this;
      me._loadSeverities();
    },

    _onIterationsSelected: function(combobox, eOpts)
    {
      var me = this;
      me._loadData();
    },

    _loadIterations: function() 
    {
        var me = this; // custom app

        var iterComboBox = Ext.create('Rally.ui.combobox.IterationComboBox',
        {
          itemId: 'iter-ComboBox-id',
          fieldLabel: 'Iteration',
          labelAlign: 'right',
          width: 200,

          listeners: 
          {
            // when iterations are loaded
            ready: me._onIterationsReady,
            select: me._onIterationsSelected,
            scope: me
          }
        });

        //this.pulldownContainer.add(this.iterComboBox);

        me.down('#pulldown-container-id').add(iterComboBox);

    },

    _onSeverityReady: function(combobox, eOpts)
    {
      this._loadData();
    },

    _onSeveritySelected: function(combobox, eOpts)
    {
      this._loadData();
    },

    _loadSeverities: function()
    {
       var me = this;
       var severityComboBox = Ext.create('Rally.ui.combobox.FieldValueComboBox',
        {
          itemId: 'severity-ComboBox-id',
          field: 'Severity',
          model: 'Defect',
          
          fieldLabel: 'Severity',
          labelAlign: 'right',
          width: 200,

          listeners: 
          {
            // when first loaded
            ready: me._onSeverityReady,
            select: me._onSeveritySelected,
            scope: me
          }

        });

        //this.pulldownContainer.add(this.severityComboBox);
        me.down('#pulldown-container-id').add(severityComboBox);

    },

    // Create filters for grid
    _getFilters: function(_selectedIterationRef, _selectedSeverityValue )
    {
      var iterationFilter = Ext.create('Rally.data.wsapi.Filter', 
      {
        property: 'Iteration',
        operation: '=',
        value: _selectedIterationRef
      });

      var severityFilter = Ext.create('Rally.data.wsapi.Filter',
      {
        property: 'Severity',
        operation: '=',
        value: _selectedSeverityValue
      });

      return iterationFilter.and(severityFilter);
    },


    // Get data from Rally
    _loadData: function() 
    {
      var me = this;
      var selectedIterationRef = me.down('#iter-ComboBox-id').getRecord().get('_ref');
      var selectedSeverityValue  = me.down('#severity-ComboBox-id').getRecord().get('value');
      var allFilters = me._getFilters(selectedIterationRef, selectedSeverityValue);
      console.log('allFilters', allFilters.toString());

      // if store exists, just load new data
      if (me.defectStore)
      {
          console.log('store exists');
          me.defectStore.setFilter(allFilters);
          me.defectStore.load();
      }
      else
      {
        // create store
        console.log('creating store');
        me.defectStore = Ext.create('Rally.data.wsapi.Store', 
        {
            model: 'Defect',
            autoLoad: true,                         // <----- Don't forget to set this to true! heh
            filters: allFilters,

            listeners: 
            {
                load: function(myStore, myData, success) 
                {
                    console.log('got data!', myStore, myData);
                    if (!me.myGrid)
                    {
                      me._createGrid(myStore);      // if we did NOT pass scope:this below, this line would be incorrectly trying to call _createGrid() on the store which does not exist.
                    }
                },
                scope: me                         // This tells the wsapi data store to forward pass along the app-level context into ALL listener functions
            },
            fetch: ['FormattedID', 'Name', 'Severity', 'Iteration']   // Look in the WSAPI docs online to see all fields available!
          });
      }
    },

    // Create and Show a Grid of given stories
    _createGrid: function(myStoryStore) 
    {
      var me = this;
      me.myGrid = Ext.create('Rally.ui.grid.Grid', 
      {
        store: myStoryStore,
        columnCfgs: 
        [         // Columns to display; must be the same names specified in the fetch: above in the wsapi data store
          'FormattedID', 'Name', 'Severity', 'Iteration'
        ]
      });

      me.add(this.myGrid);       // add the grid Component to the app-level Container (by doing this.add, it uses the app container)

      console.log('what is this?', this);

    }
});
