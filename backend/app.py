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


@app.route("/solve", methods=["POST"])
def solve():
    print("POST/solve triggered")
    try:
        data = request.get_json(force=True)
        print("Payload received:", data)

        num_vars = data["numVars"]
        constraints = data["constraints"]
        objective = data["objective"]
        optimization = data.get("optimization", "max")

        print("Generating matrix...")
        tableau = create_tableau(num_vars, len(constraints))
        print("Matrix generated")

        print("Adding constraints...")
        for cons in constraints:
            coeffs_str = ",".join(map(str, cons["coeffs"]))
            inequality = cons.get("inequality", "L")
            rhs = cons["rhs"]
            eq_str = f"{coeffs_str},{inequality},{rhs}"
            print("→", eq_str)
            add_constraint(tableau, eq_str)
        print("All constraints added")

        print("Adding objective...")
        obj_str = ",".join(map(str, objective)) + ",0"
        add_objective(tableau, obj_str)
        print("Objective added")

        print("Solving...")
        if optimization == "max":
            result = optimize_json_format(tableau, maximize=True)
        else:
            result = optimize_json_format(tableau, maximize=False)
        print("Solution:", result["optimalValue"])

        return jsonify(result)

    except Exception as e:
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)
