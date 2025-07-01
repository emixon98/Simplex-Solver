import React, { useState } from 'react';

function App() {
  const [numVariables, setNumVariables] = useState('');

  const handleChange = (e) => {
    setNumVariables(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Number of variables:', numVariables);
    // eventually send to backend here
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Simplex Method Input</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Number of Variables:
          <input
            type="number"
            value={numVariables}
            onChange={handleChange}
            min="1"
            required
            style={{ marginLeft: '1rem' }}
          />
        </label>
        <br /><br />
        <button type="submit">Next</button>
      </form>
    </div>
  );
}

export default App;
