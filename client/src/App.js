import TextEditor from './TextEditor'
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect
} from 'react-router-dom';

function App() {
  return (
  <Router>
    <Switch>
      <Route path="/" exact>
        
      </Route>
      <Route path="/doc/:userId">
    <TextEditor />
      </Route>
    </Switch>
  </Router>
  )
}

export default App;
 