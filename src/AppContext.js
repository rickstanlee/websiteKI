import React, { createContext, useState } from 'react';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [state, setState] = useState({status: "warten-auf-anfrage", status_data: null});
  const [coordinates, setCoordinates] = useState({ longitude: 0, latitude: 0 });
  const [collectionList, setCollectionList] = useState([])
  const [collection, setCollection] = useState("")
  const [DBData, setDBData] = useState([])
  const [JSONData, setJSONData] = useState([])
  const [document, setDocument] = useState({id: -1})
  const [bots, setBots] = useState([])
  
  // Erweitere den Context um die Koordinaten und den entsprechenden Setter
  const value = {
    state, setState,
    coordinates, setCoordinates,
    collectionList, setCollectionList,
    collection, setCollection,
    document, setDocument,
    DBData, setDBData,
    JSONData, setJSONData,
    bots, setBots
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
