import React, { useState } from 'react';

function App() {
  const [numVars, setNumVars] = useState(0);
  const [numConstraints, setNumConstraints] = useState(0);
  const [objectiveCoeffs, setObjectiveCoeffs] = useState([]);
  const [constraints, setConstraints] = useState([]);
  const [showFields, setShowFields] = useState(false);
  const [optimizationType, setOptimizationType] = useState('max');
  const [solutionResult, setSolutionResult] = useState(null);



  const generateFields = () => {
    setObjectiveCoeffs(Array(numVars).fill(''));
    setConstraints(Array(numConstraints).fill(
      { coeffs: Array(numVars).fill(''), rhs: '' }
    ));
    setShowFields(true);
  };

  const handleObjectiveChange = (index, value) => {
    const updated = [...objectiveCoeffs];
    updated[index] = value;
    setObjectiveCoeffs(updated);
  };

const handleConstraintChange = (constraintIndex, coeffIndex, value) => {
  setConstraints(prevConstraints => {
    return prevConstraints.map((constraint, i) => {
      if (i === constraintIndex) {
        // Copy constraint.coeffs array immutably, update only one coeff
        const newCoeffs = [...constraint.coeffs];
        newCoeffs[coeffIndex] = value;

        return {
          ...constraint,
          coeffs: newCoeffs
        };
      }
      return constraint; // unchanged
    });
  });
};


const handleRHSChange = (constraintIndex, value) => {
  setConstraints(prevConstraints => {
    return prevConstraints.map((constraint, i) =>
      i === constraintIndex ? { ...constraint, rhs: value } : constraint
    );
  });
};

const handleInequalityChange = (constraintIndex, value) => {
  setConstraints(prevConstraints => {
    return prevConstraints.map((constraint, i) =>
      i === constraintIndex ? { ...constraint, inequality: value } : constraint
    );
  });
};


const handleSubmit = async (e) => {
  e.preventDefault();

  const payload = {
    numVars,
    objective: objectiveCoeffs.map(Number),  // convert strings to numbers
    constraints: constraints.map(c => ({
      coeffs: c.coeffs.map(Number),
      rhs: Number(c.rhs),
      inequality: c.inequality || 'L'  // default to 'L' if none selected
    })),
    optimization: optimizationType || 'max'  // set this in state if user chooses
  };

  try {
    const res = await fetch('http://localhost:5000/solve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await res.json();
    setSolutionResult(result);
  } catch (err) {
    console.error('Submission error:', err);
    alert("Submission failed. Check console.");
  }
};

  
  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial' }}>
      <h2>Simplex Problem Builder</h2>

      <label>Number of Variables:</label>
      <input
        type="number"
        value={numVars}
        onChange={(e) => setNumVars(parseInt(e.target.value))}
        min="1"
        style={{ margin: '0 1rem' }}
      />

      <label>Number of Constraints:</label>
      <input
        type="number"
        value={numConstraints}
        onChange={(e) => setNumConstraints(parseInt(e.target.value))}
        min="1"
        style={{ margin: '0 1rem' }}
      />

      <button onClick={generateFields}>Generate Fields</button>
      {showFields && (
        <>
          {/* Optimization Type Selector */}
          <div className="mb-3">
            <label className="form-label">Optimization Type:</label>
            <select
              className="form-select"
              value={optimizationType}
              onChange={(e) => setOptimizationType(e.target.value)}
            >
              <option value="max">Maximize</option>
              <option value="min">Minimize</option>
            </select>
          </div>

          {/* Now the actual form begins */}
          <form onSubmit={handleSubmit}>
            {/* Objective, Constraints, etc. */}
          </form>
        </>
      )}

      {showFields && (
        <form onSubmit={handleSubmit}>
          <h3>Objective Function</h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {objectiveCoeffs.map((val, i) => (
              <input
                key={i}
                type="number"
                value={val}
                onChange={(e) => handleObjectiveChange(i, e.target.value)}
                placeholder={`x${i + 1}`}
              />
            ))}
          </div>

          <h3>Constraints</h3>
          {constraints.map((constraint, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              {constraint.coeffs.map((val, j) => (
                <input
                  key={j}
                  type="number"
                  value={val}
                  onChange={(e) => handleConstraintChange(i, j, e.target.value)}
                  placeholder={`x${j + 1}`}
                />
              ))}
            <select
              className="form-select"
              value={constraint.inequality || 'L'}
              onChange={(e) => handleInequalityChange(i, e.target.value)}
              style={{ maxWidth: '80px' }}
            >
              <option value="L">≤</option>
              <option value="G">≥</option>
            </select>

              <input
                type="number"
                value={constraint.rhs}
                onChange={(e) => handleRHSChange(i, e.target.value)}
                placeholder="RHS"
              />
            </div>
          ))}
      {solutionResult && (
    <div className="alert alert-success mt-3">
      <pre>{JSON.stringify(solutionResult, null, 2)}</pre>
    </div>
   )}
          <button type="submit">Submit</button>
        </form>
      )}
    </div>
  );
}

export default App;
