import traceback
from flask import Flask, request, jsonify
from flask_cors import CORS
from simple_simplex import (
    create_tableau,
    add_constraint,
    add_objective,
    optimize_json_format,
)

app = Flask(__name__)
CORS(app, origins="http://localhost:3000")

def validate_and_normalize_payload(data):
    required_keys = ["numVars", "constraints", "objective"]
    for key in required_keys:
        if key not in data:
            raise ValueError(f"Missing required key: '{key}'")

    num_vars = data["numVars"]
    if not isinstance(num_vars, int) or num_vars < 1:
        raise ValueError("'numVars' must be a positive integer")

    objective = [float(x) for x in data["objective"]]
    if len(objective) != num_vars:
        raise ValueError(f"Objective function must have {num_vars} coefficients")

    constraints = []
    for i, cons in enumerate(data["constraints"]):
        coeffs = [float(x) for x in cons["coeffs"]]
        if len(coeffs) != num_vars:
            raise ValueError(f"Constraint #{i + 1} must have {num_vars} coefficients")

        rhs = float(cons["rhs"])
        inequality = cons.get("inequality", "L").strip().upper()
        if inequality not in {"L", "G"}:
            raise ValueError(f"Constraint #{i + 1} has invalid inequality type: {inequality}")
        
        constraints.append({
            "coeffs": coeffs,
            "rhs": rhs,
            "inequality": inequality
        })

    optimization = data.get("optimization", "max").strip().lower()
    if optimization not in {"max", "min"}:
        raise ValueError(f"Optimization type must be 'max' or 'min', got: {optimization}")

    return num_vars, constraints, objective, optimization


@app.route("/solve", methods=["POST"])
def solve():
    print("POST/solve triggered")
    try:
        data = request.get_json(force=True)
        print("Payload received:", data)
        num_vars, constraints, objective, optimization = validate_and_normalize_payload(data)
        print("Generating matrix...")
        tableau = create_tableau(num_vars, len(constraints))
        print("Adding constraints...")
        for cons in constraints:
            eq_str = f"{','.join(map(str, cons['coeffs']))},{cons['inequality']},{cons['rhs']}"
            add_constraint(tableau, eq_str)
        print("Adding objective...")
        obj_str = ",".join(map(str, objective)) + ",0"
        add_objective(tableau, obj_str)
        print("Solving...")
        result = optimize_json_format(tableau, maximize=(optimization == "max"))
        print("Solution:", result["optimalValue"])
        return jsonify(result)

    except Exception as e:
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)
