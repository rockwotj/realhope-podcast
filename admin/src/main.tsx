import React from 'react'
import ReactDOM from 'react-dom/client'
import {ChakraProvider} from "@chakra-ui/react"
import App from './App.tsx'
import {FirebaseAuthenticated} from './firebase.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ChakraProvider>
      <FirebaseAuthenticated>
        <App />
      </FirebaseAuthenticated>
    </ChakraProvider>
  </React.StrictMode>,
)
