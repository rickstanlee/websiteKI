// src/components/Terminal.js
import React, { useEffect, useRef, useContext, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import { AppContext } from '../AppContext';
import io from 'socket.io-client';
import axios from "axios"
import MongoDBExplorer from "./MongoDBExplorer"
import MonacoWrapper from "./MonacoWrapper"


const TerminalComponent = () => {
  const terminalRef = useRef(null);
  const term = useRef(null);
  const fitAddon = useRef(new FitAddon());
  const prompt = 'User:> ';
  const { state, setState } = useContext(AppContext);
  const { coordinates } = useContext(AppContext);
  const { bots, setBots } = useContext(AppContext)
  const stateRef = useRef(state);
  const coordinatesRef = useRef(coordinates)
  const socketRef = useRef(null)

  const modes = ['Datenbank', 'Code Control', 'Haus', 'Bots', 'Sportwetten'];

  const [visualizerMode, setVisualizerMode] = useState("Datenbank")
  const visualizerModeRef = useRef(visualizerMode)

  const [codeMode, setCodeMode] = useState('javascript')
  const [code, setCode] = useState(''); // State für den zu zeigenden Code
  const codeRef = useRef(code)
  const [editorKey, setEditorKey] = useState(0); // State to force re-render the editor



  // Monaco Editor Optionen
  const editorOptions = {
    selectOnLineNumbers: true,
    readOnly: false,
    automaticLayout: true,
    theme: 'vs-dark'

  };

  useEffect(() => {stateRef.current = state}, [state]);
  useEffect(() => {coordinatesRef.current = coordinates}, [coordinates]);
  useEffect(() => {visualizerModeRef.current = visualizerMode}, [visualizerMode]);
  useEffect(() => {codeRef.current = code}, [code]);

  useEffect(() => {
    socketRef.current = io('http://localhost:3023');
    
      socketRef.current.on('propose-document-create', async (data)=>{
        console.log(`PROPOSE Document Create: ${JSON.stringify(data)}`)
        await stopSpinner()
        term.current.writeln("")
        if(data.valid){
          term.current.writeln(`Neues Dokument in ${data.collection} anlegen? (J/N)`)
        }else{
          term.current.writeln(`Es konnte keine valide Buchung erstellt werden. Bitte passe die Buchung entsprechend an!`)  
        }
        setState({status: "confirm-create", data: data})
        setCodeMode('json')
        setCode(JSON.stringify(data.object, null, 2));
        setVisualizerMode('Code Control'); 
        term.current.write(prompt)
      })

      socketRef.current.on('document-created', async (data)=>{
        console.log(`DOCUMENT CREATED: ${JSON.stringify(data)}`)
        await stopSpinner()
        formatAndWriteResponse(term, JSON.stringify(data.object, null, 2))
        term.current.writeln(`Neues Dokument erfolgreich angelegt!`)
        term.current.write(prompt)
        setState({status: "warten-auf-anfrage"})
      })

    socketRef.current.on('confirm-query', async (data)=>{
      console.log(`CONFIRM QUERY: ${JSON.stringify(data)}`)
      await stopSpinner()
      term.current.writeln("")
      
      setState({status: "confirm-query"})
      setCodeMode('javascript')
      setCode(data.query.replace(/;/g, ";\n"));
      setVisualizerMode('Code Control'); 
    
      term.current.writeln("Query ausführen? (J/N)")
      term.current.write(prompt)
    })

    socketRef.current.on('confirm-google', async (googleAnfrage)=>{
      console.log(`CONFIRM GOOGLE: ${JSON.stringify(googleAnfrage)}`)
      await stopSpinner()
      term.current.writeln("")
      setState({status: "confirm-google"})
      setCodeMode('json')
      setCode(JSON.stringify(googleAnfrage).replace(/;/g, ";\n"));
      setVisualizerMode('Code Control'); 
      term.current.writeln("Google Suche ausführen? (J/N)")
      term.current.write(prompt)
    })

    socketRef.current.on('request-user-input', async (frage)=>{
      console.log(`REQUEST USER INPUT: ${frage}`)
      await stopSpinner()
      term.current.writeln("")
      term.current.writeln(`Die KI fordert weitere Informationen an: ${frage}`)
      term.current.write(prompt)
    })

    socketRef.current.on('init-anfrage', async (anfrage)=>{
      console.log(`anfrage wird bearbeitet: ${JSON.stringify(anfrage)}`)
      await stopSpinner()
      term.current.writeln("")
      formatAndWriteResponse(term, `${anfrage.aktion.name}`)
      startSpinner();
    })

    socketRef.current.on('info-answer', async (data)=>{
      await stopSpinner();
      console.log(`HANDLE INFO ANSWER: ${JSON.stringify(data)}`)
      term.current.writeln("")
      formatAndWriteResponse(term, `KI> ${data}`)
      term.current.write(prompt)
      setState({status: "warten-auf-anfrage", status_data: null})
    })

    
    socketRef.current.on('starte-query', async (data)=>{
      console.log(`starte query: ${JSON.stringify(data)}`)
      term.current.writeln("")
      term.current.writeln('Query wird ausgeführt...')
      startSpinner();
    })

    socketRef.current.on('query-fertig', async (data)=>{
      await stopSpinner()
      console.log(`anfrage fertig: ${JSON.stringify(data)}`)
      term.current.writeln("")
      term.current.writeln("Query erfolgreich ausgeführt!")
      formatAndWriteResponse(term, `${JSON.stringify(data.query.result, null, 2)}`)
      term.current.writeln("Anfrage wird weiter bearbeitet...")
      startSpinner();
    })
    
    socketRef.current.on('bot-gestartet', bot => {
      setBots(prevState => [...prevState, bot])
      setVisualizerMode('Bots')    
    })

    socketRef.current.on('server-reseted', (response) =>{
      setState({status: "warten-auf-anfrage", status_data: null})
      setVisualizerMode("Datenbank")
      term.current.writeln("")
      term.current.writeln("Programm has been successfully reseted!")
      term.current.write(prompt)
    })

    

    socketRef.current.on('error', (errorMessage) => {
      console.log(`HANDLE SOCKET ERROR: ${errorMessage}`)
      term.current.writeln(`Error: ${errorMessage}`);
      term.current.write(prompt)
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  useEffect(() => {
    if (terminalRef.current) {
      term.current = new Terminal({
        cursorBlink: true,
        fontSize: 14,
        theme: {
          background: '#000000'
        }
      });

      term.current.loadAddon(fitAddon.current);
      term.current.open(terminalRef.current);
    
        // Event Listener für Tastenkombinationen hinzufügen, nur wenn xterm den Fokus hat
      terminalRef.current.addEventListener('keydown', (event) => {
        console.log("KEYDOWN23")

        if (event.ctrlKey && event.key === 'c') {
          event.preventDefault();  // Verhindern, dass der Standard-Event ausgeführt wird
          if (document.activeElement === term.current.textarea) {  // Prüfen, ob xterm fokussiert ist
            setState({anfrage: undefined, auswahl: []})
            term.current.writeln("")
            term.current.writeln("Aktuelle Anfrage wurde abgebrochen!")
            term.current.write(prompt)
            return false;  // Verhindert die Standardbehandlung von xterm für diese Tastenkombination
          }
        }
        return true;  // Lässt andere Tastenereignisse normal weiterlaufen
      });

      const handleResize = () => {

        const newContainerHeight = document.getElementById('TerminalInnerContainer').clientHeight;
        const newRows = Math.floor(newContainerHeight / 20);
        const cols = 69
        term.current.resize(cols, newRows);
      };

      window.addEventListener('resize', handleResize);

      // Delay fit to ensure DOM is fully rendered
      setTimeout(() => {

        const terminalInnerContainer = document.getElementById('TerminalInnerContainer');  
        const resizeObserver = new ResizeObserver(handleResize);
        resizeObserver.observe(terminalInnerContainer);
        handleResize()
      }, 100);

      term.current.writeln('Welcome back Enrico, how can I assist you?');
      term.current.write(prompt);

      term.current.onKey(e => {
        const char = e.key;
        const code = e.domEvent.keyCode;

        if (code === 13) { // Enter key
          handleCommand();
        } else if (code === 8 || code === 127) { // Backspace key
          if (term.current.buffer.active.cursorX > prompt.length) {
            term.current.write('\b \b');
          }
        } else {
          term.current.write(char);
        }
      });

      return () => {
        let loContainer = document.getElementById('WindowBottom')
        if(loContainer){loContainer.removeEventListener('resize', handleResize)}
      };
    }
  }, []);

  const spinnerChars = ['/', '|', '\\', '-'];
  let spinnerIndex = 0;
  let spinnerInterval;
  let spinnerDauer = 0;
  
  const startSpinner = () => {
      if (spinnerInterval) return; // Verhindert das mehrfache Starten des Spinners
      spinnerInterval = setInterval(() => {
          spinnerDauer += 0.25  
          term.current.write('\r' + spinnerChars[spinnerIndex]); // '\r' bewegt den Cursor an den Zeilenanfang
          spinnerIndex = (spinnerIndex + 1) % spinnerChars.length; // Zyklisch durch die Spinner-Charaktere gehen
      }, 250); // 250 Millisekunden zwischen den "Frames" des Spinners
  };
  
  const stopSpinner = async () => {
      clearInterval(spinnerInterval); // Stoppt den Interval
      spinnerInterval = null;
      term.current.write('\r '); // Löscht den Spinner durch Überschreiben mit einem Leerzeichen
      term.current.write(`(${spinnerDauer}s)`)
      spinnerDauer = 0
  };

  const handleCodeChange = (newCode) => {
    console.log(`UPDATED CODE: ${newCode}`)
    setCode(newCode);  
  };

  const formatAndWriteResponse = (term, response) => {
    response = response.replace('\n\n', '\n');
    const lines = response.split('\n');
    lines.forEach(line => {
      term.current.writeln(line);
    });
  };

  function handleExecuteCode() {
    try {
      // Hier könnte eine einfache Evaluation des Codes stattfinden
      // Vorsicht: eval ist gefährlich bei nicht vertrauenswürdigem Code!
      eval(code);
      console.log("Code executed successfully");
    } catch (error) {
      console.error("Error executing code:", error);
    }
  }

  const handleCommand = async () => {
    let loPromptStart = prompt

    const buffer = term.current.buffer.active;
    const startLineIndex = buffer.baseY;
    const endLineIndex = buffer.baseY + buffer.cursorY;
  
    let promptLineIndex = -1;
    for (let i = endLineIndex; i >= startLineIndex; i--) {
      const line = buffer.getLine(i)?.translateToString(true) ?? '';
      if (line.includes(loPromptStart)) {
        promptLineIndex = i;
        break;
      }
    }
  
    let commandLines = [];
    if (promptLineIndex !== -1) {
      for (let i = promptLineIndex; i <= endLineIndex; i++) {
        const line = buffer.getLine(i)?.translateToString(true) ?? '';
        commandLines.push(line);
      }
    }
  
    const input = commandLines.join('\n').replace(loPromptStart, '').trim();
    let command = input;

    console.log(`HANDLE COMMAND: ${command}`)
    switch (command) {
        case 'help':
            term.current.writeln('Available commands:');
            term.current.writeln('help - List available commands');
            term.current.writeln('clear - Clear the terminal');
            break;
        case 'clear':
            term.current.clear();
            term.current.writeln("");
            term.current.write(prompt);
            return;
        case 'Y': 
        case 'J':
          if(stateRef.current.status === "confirm-query"){
            console.log(`CONFIRM QUERY`)
            console.log(`CODEREF: ${codeRef.current}`)
            socketRef.current.emit('confirm-query', codeRef.current)
          }else if(stateRef.current.status === "confirm-google"){
            console.log(`CONFIRM GOOGLE`)
            console.log(`CODEREF: ${codeRef.current}`)
            let loSearchObject = JSON.parse(codeRef.current)
            socketRef.current.emit('confirm-google', loSearchObject)
            term.current.writeln("")
            startSpinner()
          }else if(stateRef.current.status === "confirm-create"){
            console.log(`CONFIRM CREATE: ${JSON.stringify(stateRef.current)}`)
            console.log(codeRef.current)
            try{
              let loDocument = JSON.parse(codeRef.current)
              
              socketRef.current.emit('confirm-create', {collection: stateRef.current.data.collection, object: loDocument})
              term.current.writeln("")
              startSpinner()
            }catch(error){
              term.current.writeln("There was an error passing the document to create: " + error.message)
            }
          }else{
            term.current.writeln(`No request to confirm...`);  
            term.current.write(prompt)          
          }
          break;
        case 'reset':
            socketRef.current.emit('server-reset')
            break;
        default:
            if(command === ""){break}

            let websiteParams = {
              selected_collection: "",
              selected_document: "",
              cesium_coordinates: {longitude: coordinatesRef.current.longitude, latitude: coordinatesRef.current.latitude},
            }

            let websiteAnfrage = {
              input: command,
              metaData: websiteParams,
              context: []
            }

            term.current.writeln("")
            startSpinner()
            console.log(`HANDLE COMMAND: ${JSON.stringify(websiteAnfrage, 2, null)}`)
            socketRef.current.emit('process-command', websiteAnfrage)
            
            break;
    }
  };

  return (
    <>

      <div id="TerminalOuterContainer">
        <div id="TerminalHeader">KI TERMINAL</div>
        <div id="TerminalInnerContainer">
          <div ref={terminalRef} style={{ height: '100%', width: '100%' }}></div>
        </div>
      </div>

      <div id="TerminalVisualizerOuterContainer">
        <div id="TerminalVisualizerHeader">
          {modes.map(mode => (
              <div key={mode} onClick={()=>{setVisualizerMode(mode)}}className={`nav-item ${visualizerMode === mode ? 'active' : ''}`}>
                  {mode}
              </div>
          ))}
        </div>
        <div id="TerminalVisualizerInnerContainer">
          {visualizerMode === "Datenbank" && (
            <MongoDBExplorer />  
          )}
          {visualizerMode === "Code Control" && (
              <>
              <div id="MonacoContainer">
                {<MonacoWrapper
                  key={editorKey}
                  value={code}
                  theme='vs-dark'
                  language={codeMode}
                  options={{
                    selectOnLineNumbers: true,
                    readOnly: false,
                    automaticLayout: true,
                    fontSize: 18 
                  }}
                  onCodeChange={handleCodeChange}
                />}
              </div>
              <div id="code-execute-container">
                <button id="code-control-bar" onClick={handleExecuteCode}>Execute Code</button>
              </div>
            </>
          )}
           {visualizerMode === "Bots" && (
            bots.map(b => {
              return (
                <div>
                  {b.name}
                </div>
              )
            })
          )}
        </div> 
      </div>
    </>
  )
};

export default TerminalComponent;
