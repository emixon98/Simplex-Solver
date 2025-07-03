import React, { useState } from 'react';
import './App.css';

// TableauRenderer component — renders a tableau matrix with pivot cell highlighted
const TableauRenderer = ({ tableau, pivotRow, pivotCol }) => {
  return (
    <table
      className="tableau-table"
      style={{ borderCollapse: 'collapse', marginTop: '0.5rem', width: 'fit-content' }}
    >
      <tbody>
        {tableau.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {row.map((cell, colIndex) => {
              const isPivot = rowIndex === pivotRow && colIndex === pivotCol;
              return (
               <td
                  key={colIndex}
                  className={`tableau-cell
                    ${rowIndex === pivotRow ? 'pivot-row' : ''}
                    ${colIndex === pivotCol ? 'pivot-col' : ''}
                    ${isPivot ? 'pivot-cell' : ''}
                  `}
              >
                  {typeof cell === 'number' ? cell.toFixed(2) : cell}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

function App() {
  const [numVars, setNumVars] = useState(0);
  const [numConstraints, setNumConstraints] = useState(0);
  const [objectiveCoeffs, setObjectiveCoeffs] = useState([]);
  const [constraints, setConstraints] = useState([]);
  const [showFields, setShowFields] = useState(false);
  const [optimizationType, setOptimizationType] = useState('max');
  const [solutionResult, setSolutionResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateFields = () => {
    setObjectiveCoeffs(Array(numVars).fill(''));
    setConstraints(
      Array(numConstraints).fill({
        coeffs: Array(numVars).fill(''),
        rhs: '',
        inequality: 'L',
      })
    );
    setShowFields(true);
    setSolutionResult(null);
  };

  const handleObjectiveChange = (index, value) => {
    const updated = [...objectiveCoeffs];
    updated[index] = value;
    setObjectiveCoeffs(updated);
  };

  const handleConstraintChange = (constraintIndex, coeffIndex, value) => {
    setConstraints((prevConstraints) =>
      prevConstraints.map((constraint, i) =>
        i === constraintIndex
          ? { ...constraint, coeffs: constraint.coeffs.map((c, j) => (j === coeffIndex ? value : c)) }
          : constraint
      )
    );
  };

  const handleRHSChange = (constraintIndex, value) => {
    setConstraints((prevConstraints) =>
      prevConstraints.map((constraint, i) => (i === constraintIndex ? { ...constraint, rhs: value } : constraint))
    );
  };

  const handleInequalityChange = (constraintIndex, value) => {
    setConstraints((prevConstraints) =>
      prevConstraints.map((constraint, i) => (i === constraintIndex ? { ...constraint, inequality: value } : constraint))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSolutionResult(null);

    const payload = {
      numVars,
      objective: objectiveCoeffs.map(Number),
      constraints: constraints.map((c) => ({
        coeffs: c.coeffs.map(Number),
        rhs: Number(c.rhs),
        inequality: c.inequality || 'L',
      })),
      optimization: optimizationType || 'max',
    };

    try {
      const res = await fetch('http://localhost:5000/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const result = await res.json();
      setSolutionResult(result);
    } catch (err) {
      console.error('Submission error:', err);
      alert('Submission failed. Check console.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <div style={{ padding: '2rem', width: '100%', maxWidth: '1000px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>Simplex Problem Builder</h2>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label>Number of Variables:</label>
            <input
              type="number"
              value={numVars}
              onChange={(e) => setNumVars(parseInt(e.target.value) || 0)}
              min="1"
              style={{ width: '60px', textAlign: 'center' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label>Number of Constraints:</label>
            <input
              type="number"
              value={numConstraints}
              onChange={(e) => setNumConstraints(parseInt(e.target.value) || 0)}
              min="1"
              style={{ width: '60px', textAlign: 'center' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', margin: '1rem 0' }}>
          <button onClick={generateFields}>Generate Fields</button>
        </div>

        {showFields && (
          <>
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

              {loading && (
                <div style={{ display: 'flex', justifyContent: 'center', margin: '1rem 0' }}>
                  <div className="progress-bar-container">
                    <div className="progress-bar" />
                  </div>
                </div>
              )}

              {solutionResult && (
                <div className="result-container">
                  <h3>Solution</h3>
                  <table>
                    <thead>
                      <tr>
                        <th>Variable</th>
                        <th>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(solutionResult.solutionValues).map(([variable, value]) => (
                        <tr key={variable}>
                          <td>{variable}</td>
                          <td>{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <h4>Optimal Value: {solutionResult.optimalValue}</h4>

                  {/* Pivot steps visualization */}
                  {solutionResult.pivotSteps && solutionResult.pivotSteps.length > 0 && (
                    <div style={{ marginTop: '2rem' }}>
                      <h3>Pivot Steps</h3>
                      {solutionResult.pivotSteps.map((step, idx) => (
                        <div key={idx} style={{ marginBottom: '2rem' }}>
                          <h4>Step {step.step}</h4>
                          <TableauRenderer
                            tableau={step.tableau}
                            pivotRow={step.pivotRowIndex ?? -1}
                            pivotCol={step.pivotColIndex ?? -1}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <button type="submit" disabled={loading}>
                {loading ? 'Solving...' : 'Solve'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
