import React from "react";
import MonacoWrapper from "./MonacoWrapper";  // Adjust the import based on your file structure

class CodeEditor extends React.Component {
  constructor() {
    super();
    this.state = {
      code: "// type your code... \n",
      theme: "vs-light",
    };
  }

  setDarkTheme = () => {
    this.setState({ theme: "vs-dark" });
  };

  setLightTheme = () => {
    this.setState({ theme: "vs-light" });
  };

  render() {
    const { code, theme } = this.state;
    return (
      <div>
        <button onClick={() => this.setState({ theme: "vs-dark" })} type="button">
          Set dark theme
        </button>
        <button onClick={() => this.setState({ theme: "vs-light" })} type="button">
          Set light theme
        </button>
        <hr />
        <MonacoWrapper
          value={code}
          theme={theme}
        />
      </div>
    );
  }
}

export default CodeEditor;
