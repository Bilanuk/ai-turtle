import React, { useEffect, useState, useRef } from 'react';
import './App.css';
import styled from 'styled-components';
import RealTurtle from 'real-turtle'

import * as tf from '@tensorflow/tfjs';
import * as speech from "@tensorflow-models/speech-commands"

const canvasWidth = 500;
const canvasHeight = 500;
const turtleStep = 40;
const allowedCommands = ['right', 'left', 'go']

const StyledButton = styled.button`
  background-color: #4CAF50;
  border: none;
  color: white;
  padding: 15px 32px;
  text-align: center;
  display: inline-block;
  font-size: 16px;
  margin: 4px 2px;
  cursor: pointer;
  transition-duration: 0.4s;

  &:active { 
    background-color: #3e8e41;
    box-shadow: 0 5px #666;
    transform: translateY(4px);
  }

  &:hover {
    background-color: #3e8e41;
  }
`;

const StyledCanvas = styled.canvas`
  border: 1px solid #000000;
  width: canvasWidth;
  height: canvasHeight;
  margin: 20px;
  background-color: white;
`;

const App = () => {
  const [model, setModel] = useState(null)
  const [isRecording, setIsRecording] = useState(false)
  const [action, setAction] = useState(null)
  const [labels, setLabels] = useState(null)

  const turtle = useRef()

  const loadModel = async () => {
    const recognizer = await speech.create("BROWSER_FFT")
    console.log('Model Loaded')
    await recognizer.ensureModelLoaded();
    console.log(recognizer.wordLabels())
    setModel(recognizer)
    setLabels(recognizer.wordLabels())

  }

  useEffect(() => {
    loadModel()
    setTimeout(() => {
      console.log('create turtle')
      var target_element = document.getElementById('real-turtle')
      turtle.current = new RealTurtle(target_element, { autoStart: true, async: true })
      moveForward()
    }, 100)
  }, []);

  function argMax(arr) {
    return arr.map((x, i) => [x, i]).reduce((r, a) => (a[0] > r[0] ? a : r))[1];
  }

  const recognizeCommands = async () => {
    if (model.isListening()) {
      console.log('Stop listening')
      setIsRecording(false)
      model.stopListening()
      setAction(null)
      return
    }

    console.log('Listening for commands')
    setIsRecording(true)
    model.listen(result => {
      if (!allowedCommands.includes(labels[argMax(Object.values(result.scores))])) return

      setAction(labels[argMax(Object.values(result.scores))])
      move(labels[argMax(Object.values(result.scores))])
    }, { includeSpectrogram: true, probabilityThreshold: 0.8, overlapFactor: 0.34 })
  }

  const clearTurtle = () => {
    resetTurtle()
  }

  async function resetTurtle() {
    await turtle.current.clear()
    await turtle.current.setPosition(250, 250)
  }

  async function rotateRight() {
    await turtle.current.right(90)
  }
  async function rotateLeft() {
    await turtle.current.left(90)
  }
  async function moveForward() {
    await turtle.current.forward(turtleStep)
  }
  async function moveBackward() {
    await turtle.current.back(turtleStep)
  }


  function move(action) {
    console.log('move ', action)
    if (action == 'right') {
      rotateRight()
    }
    if (action == 'left') {
      rotateLeft()
    }
    if (action == 'go') {
      moveForward()
    }
    if (action == 'no') {
      moveBackward()
    }
  }

  return (
    <div className="App">
      <header className="App-header">
        <StyledCanvas width={canvasWidth} height={canvasHeight} id="real-turtle"></StyledCanvas>
        <StyledButton onClick={recognizeCommands}>{isRecording ? "Stop" : "Record"}</StyledButton>
        <StyledButton onClick={clearTurtle}>Clear turtle</StyledButton>

        {action ? <div>{action}</div> : <div>Waiting to start...</div>}
      </header>
    </div>
  );
}

export default App;
