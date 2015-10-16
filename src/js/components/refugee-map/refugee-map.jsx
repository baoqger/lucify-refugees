
var _ = require('underscore');
var React = require('react');

var BordersLayer = require('./refugee-map-borders-layer.jsx');
var CountryCountsLayer = require('./refugee-map-country-counts-layer.jsx');
var CountryLabelsLayer = require('./refugee-map-country-labels-layer.jsx');
var CountBarsLayer = require('./refugee-map-count-bars-layer.jsx');
var PointsLayer = require('./refugee-map-points-layer.jsx')
var RefugeeMapLineChart = require('./refugee-map-line-chart.jsx');
var SimpleBordersLayer = require('./refugee-map-simple-borders-layer.jsx');
var FrameRateLayer = require('./frame-rate-layer.jsx');
var RefugeeHighlightMixin = require('./refugee-highlight-mixin.js');
var constants = require('../../model/refugee-constants.js');



var RefugeeMap = React.createClass({


  mixins: [RefugeeHighlightMixin],


  getDefaultProps: function() {
    return {
      width: 1200,
      height: 1200,
      interactionsEnabled: true
    }
  },


  getWidth: function() {
    return this.props.width;
  },


  getHeight: function() {
    return this.props.height;
  },

  
  componentWillUpdate: function(nextProps, nextState) {
      if (this.props.width !== nextProps.width) {
        this._projection = null;
      }
  },


  getConicConformalProjection: function() {
      var lo = 26.2206322; // x
      var la = 46.0485818 - 8; // y
      return d3.geo.conicConformal()
         .center([0, la])
         .rotate([-lo, 0])
         .scale(this.getWidth()*0.85)
         .translate([this.getWidth() / 2, this.getHeight() / 2]);
  },


  getAzimuthalEqualAreaProjection: function() {
      var lo = 22.2206322; // x
      var la = 34.0485818; // y

      return d3.geo.azimuthalEqualArea()
        //.clipAngle(180 - 1e-3)
        .center([0, la])
        .rotate([-lo, 0])
        .scale(this.getWidth()*0.85)
        .translate([this.getWidth() / 2, this.getHeight() / 2])
        .precision(1);
  },


  getMercatorProjection: function() {
    var lo = 26.2206322; // x
    var la = 46.0485818; // y

    return d3.geo.mercator()
        .center([0, la])
        .rotate([-lo, 0])
        .scale(this.getWidth()*0.55)
        .translate([this.getWidth() / 2, this.getHeight() / 2])
  },


  getProjection: function() {
    if (!this._projection){
      this._projection = this.getAzimuthalEqualAreaProjection();
    }
    return this._projection;
  },


  getStandardLayerParams: function() {
    return {
      mapModel: this.props.mapModel,
      projection: this.getProjection(),
      width: this.getWidth(),
      height: this.getHeight(),
      stamp: this.getStamp()
    }
  },


  handleMouseOver: function(country) {
    this.pendingHoverOut = false;
    var hl = country == "RUS" ? null : country;
    this.setHoveredCountry(hl);
  },


  handleMouseOut: function(country) {
    this.pendingHoverOut = true;
    window.setTimeout(function() {
      if (this.pendingHoverOut) {
        //console.log("setting hoveredCountry to null");
        this.setHoveredCountry(null);
      }
    }.bind(this), 500);
  },


  componentWillMount: function() {
      this.stamp = this.props.stamp;
  },


  // see refugee-play-context-decorator.jsx
  // for explanation

  updateForStamp: function(stamp) {
      this.stamp = stamp;

      if (this.refs.pointsLayer != null) {
        this.refs.pointsLayer.updateForStamp(stamp); 
      } 
      
      if (this.refs.frameRateLayer != null) {
        this.refs.frameRateLayer.update();
      }

      if (this.refs.bordersLayer != null) {
        this.refs.bordersLayer.updateForStamp(stamp);
      }

      if (this.refs.countBars != null) {
        this.refs.countBars.updateForStamp(stamp);
      }
        
      if (this.refs.countsLayer != null) {
        this.refs.countsLayer.updateForStamp(stamp);
      }
        
      if (this.props.refugeeCountsModel != null) {
        this.updateHighlight(this.getHighlightedCountry());  
      }
  },


  getStamp: function() {
      return this.stamp;
  },


  interactionsEnabled: function() {
      return this.props.interactionsEnabled
  },


  getFirstBordersLayer: function() {
    if (this.interactionsEnabled()) {
       return (
          <BordersLayer 
            ref="bordersLayer"
            updatesEnabled={true}
            enableOverlay={true}
            {...this.getStandardLayerParams()}
            {...this.getHighlightLayerParams()}
            refugeeCountsModel={this.props.refugeeCountsModel}
            subunitClass="subunit" />);
    } else {
        return <SimpleBordersLayer {...this.getStandardLayerParams()} />
    }
  },


  getSecondBordersLayer: function() {
    if (this.interactionsEnabled()) {
       return <BordersLayer
             updatesEnabled={false}
             {...this.getStandardLayerParams()}
             subunitClass="subunit-invisible"
             onMouseOver={this.handleMouseOver}
             onMouseOut={this.handleMouseOut} 
             onClick={this.handleMapClick} />
    }
  },


  getCountryLabelsLayer: function() {
    if (this.interactionsEnabled()) {
      return <CountryLabelsLayer
        ref="countryLabels"
        {...this.getStandardLayerParams()}
        {...this.getHighlightLayerParams()} />
    }
  },


  getCountryCountsLayer: function() {
    if (this.interactionsEnabled()) {
      return  <CountryCountsLayer
          ref="countsLayer"
          {...this.getStandardLayerParams()}
          {...this.getHighlightLayerParams()}
          refugeeCountsModel={this.props.refugeeCountsModel} />      
    }
  },


  render: function() {

    console.log("render refugee map");

    if (!this.props.refugeeCountsModel 
      || !this.props.refugeePointsModel
      || !this.props.mapModel) {
    
      return (
        <div className="refugee-map"
          style={{width: this.getWidth(), height: this.getHeight()}}>
          <div className="refugee-map__loading">Loading...</div>
        </div>
      );
    }

    return (
      <div className="refugee-map"
        style={{width: this.getWidth(), height: this.getHeight()}}>
        
        {this.getFirstBordersLayer()}

        <CountBarsLayer
           ref="countBars"
           {...this.getStandardLayerParams()}
           highlightedCountry={this.getHighlightedCountry()}
           refugeeCountsModel={this.props.refugeeCountsModel} />

        {this.getCountryLabelsLayer()}
        {this.getCountryCountsLayer()}

        <PointsLayer
           ref="pointsLayer"
           {...this.getStandardLayerParams()}
           highlightedCountry={this.getHighlightedCountry()}
           refugeePointsModel={this.props.refugeePointsModel} />
        
        {this.getSecondBordersLayer()}

        <FrameRateLayer ref="frameRateLayer" />

      </div>
    )
  }
});



module.exports = RefugeeMap;
    

