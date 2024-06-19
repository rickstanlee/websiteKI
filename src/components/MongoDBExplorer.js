import React, { useState, useEffect, useRef, useContext } from 'react';
import { AppContext } from '../AppContext'; 

function MongoDBExplorer() {
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState({});
    const [selected, setSelected] = useState(new Set()); // Verwende einen Set für ausgewählte Elemente
    const { JSONData, setJSONData } = useContext(AppContext);

    useEffect(() => {
        fetch('http://localhost:3023/db-data')
            .then(response => response.json())
            .then(data => {
                setJSONData(data);
                setLoading(false);
            })
            .catch(error => console.error('Fehler beim Laden der Collections:', error));
    }, []);

    const toggleExpand = (path) => {
        setExpanded(prev => ({...prev, [path]: !prev[path]}));
    };

    const handleSelect = (event, path) => {
        event.stopPropagation(); // Verhindert, dass das Event weiter nach oben im DOM propagiert wird
        const isSelected = selected.has(path);
        if (isSelected) {
            selected.delete(path);
        } else {
            selected.add(path);
        }
        setSelected(new Set(selected)); // Aktualisiere den State mit einer neuen Set-Instanz, um Re-Rendering zu triggern
    };


    const getValueBez = (key, value) =>{
        if((key === "soll") || (key === "haben")){
            return `${JSONData.konto.find(k=>k.id===value).bezeichnung} (${value})`
        }else{
            return value.toString()
        }
    }

    const getBezeichnung = (item, path) =>{
        if(typeof item === 'object'){
            if(path.endsWith('konto')){
                return `Konto ${item.id} (${item.bezeichnung})`
            }else if(path.endsWith('buchung')){
                return `Buchung ${item.id} (${item.bezeichnung})`
            }else{
                return path
            }
        }else{
            return item.toString()
        }
    }

    const renderJSON = (data, path = '') => {
        if (Array.isArray(data)) {
            return (
                <ul className='json-data-list'>
                    <div className="add-record-container">
                        <button>Add</button>
                    </div>
                    {data.map((item, index) => {
                        const newPath = `${path}[${index}]`;
                        return (
                            <li key={newPath}>
                                <input type="checkbox" checked={selected.has(newPath)} onChange={(e) => handleSelect(e, newPath)} />
                                <span onClick={() => toggleExpand(newPath)} style={{ cursor: 'pointer' }}>
                                    {getBezeichnung(item, path)}
                                </span>
                                {expanded[newPath] && renderJSON(item, newPath)}
                            </li>
                        );
                    })}
                </ul>
            );
        } else if (typeof data === 'object' && data !== null) {
            // Sortieren der Einträge des Objekts alphabetisch nach dem Schlüssel
            let sortedEntries
            if(data.soll){
                // Spezielle Sortierung für Objekte mit 'soll' (Buchungen)
                const order = ['id', 'bezeichnung', 'betrag', 'soll', 'haben', 'datum'];

                sortedEntries = Object.entries(data).sort((a, b) => {
                    const indexA = order.indexOf(a[0]);
                    const indexB = order.indexOf(b[0]);

                    // Wenn Schlüssel nicht in der 'order'-Liste enthalten ist, wird es ans Ende sortiert
                    if (indexA === -1) return 1; // a ans Ende sortieren
                    if (indexB === -1) return -1; // b ans Ende sortieren

                    return indexA - indexB;
                });
            }else{
                sortedEntries = Object.entries(data).sort((a, b) => a[0].localeCompare(b[0]));
            }

            
            return (
                <ul className='json-data-list'>
                    {(!data.buchung) && (

                        <div className="add-record-container">
                            <button onClick={()=>{
                                document.getElementById("")
                            }}>Edit</button>
                        </div>
                        )
                    }
                    {sortedEntries.map(([key, value]) => {
                        const newPath = `${path}.${key}`;
                        if (typeof value === 'object') {
                            return (
                                <li key={newPath}>
                                    <input type="checkbox" checked={selected.has(newPath)} onChange={(e) => handleSelect(e, newPath)} />
                                    <span onClick={() => toggleExpand(newPath)} style={{ cursor: 'pointer' }}>
                                        <strong>{key}:</strong> {typeof value === 'object' ? `${Object.entries(value).length} Records` : value.toString()}
                                    </span>                                    
                                    {expanded[newPath] && renderJSON(value, newPath)}
                                </li>
                            );
                        } else {
                            // Für einfache Datentypen keine Checkbox und keine Klick-Aktion
                            return (
                                <li key={newPath}>
                                    <span className="json-data-simple-value" style={{ cursor: 'default', userSelect: 'text' }}>
                                        <span><strong>{key}:</strong></span> 
                                        <span>{getValueBez(key, value)}</span>
                                    </span>
                                </li>
                            );
                        }
                    })}
                </ul>
            );
        } else {
            return (<>
                        <span>{data.toString()}</span>
                        <div className="add-record-container">
                            <button>Edit</button>
                        </div>
                    </>
            );
        }
    };
    
    return (
        <div id="DatenbankContainer">
            {loading ? <p>Lädt...</p> : (
                <>
                <div id="json-visualizer-inner-container">
                    <div id="json-data-container">
                        {JSONData && renderJSON(JSONData)}
                    </div>
                </div>
                </>
            )}
        </div>
    );
}

export default MongoDBExplorer;
