import ReactDOM from 'react-dom/client';

//
import App from './App';
import * as serviceWorker from './serviceWorker';
import reportWebVitals from './reportWebVitals';
import { offline, db } from './firebase';

// ----------------------------------------------------------------------

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(<App />);
offline(db)
  .then(() => {
    // Persistence enabled successfully
    console.log('Firestore offline persistence enabled.');
  })
  .catch((error) => {
    // Handle any errors that occur during persistence setup
    console.error('Error enabling Firestore offline persistence:', error);
  });

// If you want to enable client cache, register instead.
serviceWorker.unregister();

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
