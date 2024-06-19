import React, { Component } from "react";
import * as monaco from 'monaco-editor';

class MonacoWrapper extends Component {
  componentDidMount() {

    this.editor = monaco.editor.create(this.containerElement, {
        value: this.props.value,
        language: this.props.language || 'javascript',
        theme: this.props.theme,
        ...this.props.options
    });
    
    this.editor.getModel().onDidChangeContent((event) => {
        if (this.props.onCodeChange) {
        this.props.onCodeChange(this.editor.getValue());
        }
    });
  }

  componentDidUpdate(prevProps) {
    if (this.props.value !== prevProps.value) {
      this.editor.setValue(this.props.value);
    }
    if (this.props.theme !== prevProps.theme) {
      monaco.editor.setTheme(this.props.theme);
    }
  }

  componentWillUnmount() {
    if (this.editor) {
      this.editor.dispose();
    }
  }

  render() {
    return <div ref={ref => (this.containerElement = ref)} style={{ width: "100%", height: "100%" }} />;
  }
}

export default MonacoWrapper;
