import Spiderfy from './Spiderfy';
import { calcAngleDegrees, generateLegImage } from './utils/helpers';
import { point as PointFunc, transformRotate, distance, destination } from '@turf/turf';


class SpiderfyFlat extends Spiderfy {
  _createSpiderfyLayers(map, layerId, features, clusterCoords) {
    const { circleSpiralSwitchover, spiderLegsAreHidden } = this.options;
    const drawCircle = features.length < circleSpiralSwitchover;
    const points = drawCircle ? this._calculatePointsInCircle(features.length) 
      : this._calculatePointsInSpiral(features.length);
    const spiderLegs = !spiderLegsAreHidden && this._generateLegs(points, drawCircle);
    
    this._drawFeaturesOnMap(map, points, spiderLegs, layerId, clusterCoords);
  }

  _generateLegs(points, drawCircle) {
    const { spiderLegsWidth, spiderLegsColor } = this.options;
    const legs = [];
    let legImg;

    points.forEach((point, index) => {
      if (!drawCircle || index === 0) {
        legImg = generateLegImage(
          [0, 0],
          point,
          spiderLegsWidth,
          spiderLegsColor,
        );
      }
      const leg = { img: legImg, rotation: 90 + calcAngleDegrees(point[0], point[1]) };
      legs.push(leg);
    });
    return legs;
  }

  _drawFeaturesOnMap(map, points, spiderLegs, layerId, coordinates) {
    const { spiderLegsAreHidden } = this.options;

    points.forEach((point, index) => {

      var offsetToDegrees = (map, pointOffset, spiderLeg, clusterCoords) => {
        const center = map.getCenter();
        const scale =  1 / Math.cos(center.lat * Math.PI /  180) / Math.pow(2, map.getZoom());
        const heightFactored = spiderLeg.img.height * (scale * 70)
        const destinationPoint = destination(clusterCoords, heightFactored, spiderLeg.rotation);
        return destinationPoint.geometry.coordinates
      }
      
      const circleCoordinates = offsetToDegrees(map, point, spiderLegs[index],coordinates)
      const feature = {
        type: 'Feature',
        geometry: { type: 'Point', coordinates },
        properties: this.spiderifiedCluster?.leaves[index]?.properties || {},
      };

      const circleFeature = {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: circleCoordinates },
        properties: this.spiderifiedCluster?.leaves[index]?.properties || {},
      }

      if (!spiderLegsAreHidden) {
        if (this.map.hasImage(`${layerId}-spiderfy-leg${index}`)) {
          this.map.removeImage(`${layerId}-spiderfy-leg${index}`);
        }
        this.map.addImage(`${layerId}-spiderfy-leg${index}`, spiderLegs[index].img);
        this.map.addLayer({
          id: `${layerId}-spiderfy-leg${index}`,
          type: 'symbol',
          source: {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [feature] },
          },
          layout: {
            'icon-image': `${layerId}-spiderfy-leg${index}`,
            'icon-allow-overlap': true,
            'icon-anchor': 'bottom',
            'icon-rotate': spiderLegs[index].rotation,
          },
        });
        this.activeSpiderfyLayerIds.push(`${layerId}-spiderfy-leg${index}`);
        this.map.moveLayer(`${layerId}-spiderfy-leg${index}`, layerId);
      }
      this.map.addLayer({
        id: `${layerId}-spiderfy-leaf${index}-circle`,
        source: {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [circleFeature] },
        },
        type: 'circle',
        paint: {
          "circle-radius": 75,
          "circle-opacity": 0.3,
          "circle-color": "#FFE400",
        },
      });
      this.activeSpiderfyLayerIds.push(`${layerId}-spiderfy-leaf${index}-circle`);

      this.map.addLayer({
        id: `${layerId}-spiderfy-leaf${index}`,
        source: {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [circleFeature] },
        },
        type: 'symbol',
        layout: {
          "icon-size": 0.25,
          "icon-offset": [180, 0],
          "icon-image": ["get", "icon"], // Use the icon property
          "icon-allow-overlap": true,
          "text-field": ["get", "title"],
          "text-size": 11,
          "text-offset": [-2, 0],
          // Add other layout properties for text styling
        },
        paint: {
          "text-color": "#FFEBCD", // Example - adjust styling
        },
      });
      this.activeSpiderfyLayerIds.push(`${layerId}-spiderfy-leaf${index}`);
      this.map.addLayer({
        id: `${layerId}-spiderfy-leaf${index}-market-icon`,
        source: {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [circleFeature] },
        },
        type: 'symbol',
        layout: {
          "icon-image": ["get", "marketIcon"], // Use zoomIcon property
          "icon-size": 0.3,
          "icon-offset": [0, 150],
          // Add other layout properties for styling
        },
      });
      this.activeSpiderfyLayerIds.push(`${layerId}-spiderfy-leaf${index}-market-icon`);
    })
  }

  _updateSpiderifiedClusterCoords() {
    if (!this.spiderifiedCluster) return;
    var coordinates;
    this.activeSpiderfyLayerIds.forEach((id) => {
      if (id.includes('market-icon')) return;
      if (id.includes('leg')){
        coordinates = this.spiderifiedCluster.cluster.geometry.coordinates
      }else{
        const sourceObject = this.map.getSource(id);
        coordinates = sourceObject._data.features[0].geometry.coordinates
      }
      const source = this.map.getSource(id);
      const feature = this.spiderifiedCluster?.leaves[id.split('-spiderfy-leaf')[1]];

      source.setData({
        type: 'FeatureCollection', 
        features: [{
          type: 'Feature',
          geometry: { type: 'Point', coordinates },
          properties: feature?.properties || {},
        }],
      })
    })
  }
}

export default SpiderfyFlat;
