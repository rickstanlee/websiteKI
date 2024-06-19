// src/App.js
import React, { useState } from 'react';
import './App.css';
import CesiumMap from './components/CesiumMap';
import logo from './assets/logo_cyp.png';
import TerminalComponent from './components/Terminal.js';
import { AppProvider } from './AppContext';
import { Terminal } from 'xterm';

function App() {
    const [panelFocused, setPanelFocused] = useState(false)

    return (
        <AppProvider>
            <div className="App">
                <div id="HeaderTop">
                    <span id="header-text">CUREYOURPLANET</span>
                    <img className="cyplogo" src={logo} alt="CureYourPlanet Logo"/>
                </div>
                <div id="WindowMain" onClick={()=>{setPanelFocused(false)}}>
                    <div id="CesiumContainer">
                        <CesiumMap />
                    </div>
                </div>
                <div id="WindowLeft"></div>
                {/*<div id="WindowRight"></div>*/}
                <div id="WindowBottom" className={panelFocused ? "focused" : ""} onClick={()=>{setPanelFocused(true)}}>
                    <TerminalComponent></TerminalComponent>
                </div>
            </div>
        </AppProvider>
    );
}

export default App;
