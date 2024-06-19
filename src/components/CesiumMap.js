// src/components/CesiumMap.js
import React, { useEffect, useRef, useContext } from 'react';
import { Cartesian3, createOsmBuildingsAsync, Ion, Math as CesiumMath, Terrain, Viewer } from 'cesium';
import "cesium/Build/Cesium/Widgets/widgets.css";
import { AppContext } from '../AppContext'; 

Ion.defaultAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIzZDM4MWNkOS05MDdmLTRhZDItYmMwZS01NTRmMTBiZWM4MDkiLCJpZCI6MjE4MDc0LCJpYXQiOjE3MTY3OTg4MzV9.i4abk-PykB3ZCJ69YqlBloWDuyYmtH7DU927OJ4w62w";

const CesiumMap = () => {
    const cesiumContainerRef = useRef(null);
    const { setCoordinates } = useContext(AppContext); // Verwende den Context

    useEffect(() => {
        if (cesiumContainerRef.current) {
            const viewer = new Viewer(cesiumContainerRef.current, {
                terrain: Terrain.fromWorldTerrain(),
                homeButton: false,
                timeline: false,
                navigationHelpButton: false,
                creditContainer: null,
                animation: false
            });


            viewer.camera.flyTo({
                destination: Cartesian3.fromDegrees(9.332, 47.85779, 1234),
                orientation: {
                    heading: CesiumMath.toRadians(-0.0),
                    pitch: CesiumMath.toRadians(-90.0),
                },
            });

            createOsmBuildingsAsync().then(buildingTileset => {
                viewer.scene.primitives.add(buildingTileset);
            });

            viewer.camera.moveEnd.addEventListener(() => {
                const cameraPosition = viewer.camera.positionCartographic;
                const longitude = CesiumMath.toDegrees(cameraPosition.longitude);
                const latitude = CesiumMath.toDegrees(cameraPosition.latitude);
                console.log(`SET COORDINATES: ${longitude} ${latitude}`)
                setCoordinates({ longitude, latitude });  // Update Context
            });

            return () => {
                if (viewer) {
                    viewer.destroy();
                }
            };
        }
    }, [setCoordinates]);

    return <div ref={cesiumContainerRef} style={{ width: '100%', height: '100%' }}></div>;
};

export default CesiumMap;
