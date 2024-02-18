import {useState} from 'react'
import {Picker} from './Picker';
import {Trimmer, TrimmerOutput} from './Trimmer';
import {Uploader} from './Uploader';

function App() {
  const [state, setState] = useState<TrimmerOutput | string | null>(null);
  if (state == null) {
    return <Picker onVideoURL={setState} />
  } else if (typeof state == 'string') {
    return <Trimmer url={state} onSubmit={setState} />
  } else {
    return <Uploader
      start={state.start}
      end={state.end}
      title={state.title}
      url={state.url}
      duration={state.duration}
    />
  }
}

export default App
