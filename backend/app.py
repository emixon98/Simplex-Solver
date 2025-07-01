from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np

app = Flask(__name__)
CORS(app)

@app.route('/solve', methods=['POST'])
def solve():
    data = request.get_json()
    try:
        num_vars = data['numVars']
        constraints = data['constraints']
        objective = data['objective']
        optimization = data.get('optimization', 'max')  # default to 'max'

        # Generate matrix
        tableau = gen_matrix(num_vars, len(constraints))

        # Add constraints
        for cons in constraints:
            coeffs = ','.join([str(c) for c in cons['coeffs']])
            if 'inequality' in cons:
                coeffs += ',' + cons['inequality'] + ',' + str(cons['rhs'])
            else:
                # Assume 'L' by default
                coeffs += ',L,' + str(cons['rhs'])
            constrain(tableau, coeffs)

        # Add objective function
        objective_str = ','.join([str(c) for c in objective]) + ',0'
        obj(tableau, objective_str)

        # Solve
        result = maxz(tableau) if optimization == 'max' else minz(tableau)

        return jsonify({
            "status": "optimal",
            "result": result
        })

    except Exception as e:
        print("Error during simplex calculation:", e)
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 400
