from flask import Flask, request, jsonify
from flask_cors import CORS
from Simplex_Solver import gen_matrix, constrain, obj, maxz, minz  # import your funcs

app = Flask(__name__)
CORS(app)

@app.route('/solve', methods=['POST'])
def solve():
    data = request.get_json()

    try:
        num_vars = data['numVars']
        constraints = data['constraints']
        objective = data['objective']
        optimization = data.get('optimization', 'max')

        # 1. Generate initial tableau
        tableau = gen_matrix(num_vars, len(constraints))

        # 2. Add constraints to tableau
        for cons in constraints:
            # Build your string format expected by constrain()
            # For example: "2,-1,G,10"
            coeffs_str = ','.join(map(str, cons['coeffs']))
            inequality = cons.get('inequality', 'L')
            rhs = cons['rhs']
            eq_str = f"{coeffs_str},{inequality},{rhs}"
            constrain(tableau, eq_str)

        # 3. Add objective function
        obj_str = ','.join(map(str, objective)) + ',0'
        obj(tableau, obj_str)

        # 4. Solve using your own solver
        if optimization == 'max':
            result = maxz(tableau)
        else:
            result = minz(tableau)

        # 5. Return result as JSON
        return jsonify({
            "status": "optimal",
            "result": result
        })

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 400
