import re
import subprocess
import os
import glob
import json
import sys

global_results = {}

def remove_nested_keys(json_data, params):
    if isinstance(json_data, dict):
        for key in list(json_data.keys()):
            # Check for both direct and nested keys
            direct_key = key in params
            nested_keys = [p for p in params if p.startswith(key + '.')]
            
            if direct_key:
                del json_data[key]
            elif nested_keys:
                # Adjust nested keys to be relative to the current depth
                adjusted_nested_keys = [p.split('.', 1)[1] for p in nested_keys]
                remove_nested_keys(json_data[key], adjusted_nested_keys)
            else:
                remove_nested_keys(json_data[key], params)
    elif isinstance(json_data, list):
        for item in json_data:
            remove_nested_keys(item, params)

def extract_data(log_directory):
    global global_results
    log_files = os.listdir(log_directory)

    for log_file in log_files:

        parts = log_file.split('-')
        test_file_name = parts[0]
        test_case_name = '-'.join(parts[1:]).rsplit('.log', 1)[0]

        print(f"Test File: {test_file_name}")
        print(f"Test Case: {test_case_name}")

        with open(os.path.join(log_directory, log_file), 'r') as file:
            content = file.read()

        # print(f"File: {log_file}")

        # Extract JSON between [CTEST] #### and ####
        json_pattern = re.compile(r"\[CTEST\]\[GET-PARAM\] #### (.*?) ####", re.DOTALL)
        json_match = json_pattern.search(content)
        json_data = None
        if json_match:
            json_data_str = json_match.group(1)
            try:
                json_data = json.loads(json_data_str)
                print("Original JSON Data:")
                print(json.dumps(json_data, indent=2))
            except json.JSONDecodeError:
                print("Invalid JSON data.")
                json_data = None
        else:
            print("No JSON data found.")

        # Extract parameter list after [CTEST][SET-PARAM]
        param_pattern = re.compile(r"\[CTEST\]\[SET-PARAM\] (.*)")
        param_match = param_pattern.search(content)
        params = []
        if param_match:
            params_str = param_match.group(1)
            params = set(param.strip() for param in params_str.split(','))
            print("Parameters: " + ', '.join(params))
        else:
            print("No parameter list found.")

        # Remove nested keys from JSON data if they are in params list
        if json_data and params:
            remove_nested_keys(json_data, params)
            print("Modified JSON Data:")
            print(json.dumps(json_data, indent=2))
        if test_file_name not in global_results:
            global_results[test_file_name] = {}
        global_results[test_file_name][test_case_name] = json_data

def extract_test_names(file_path):
    try:
        with open(file_path, 'r') as file:
            content = file.read()
    except FileNotFoundError:
        print(f"File not found: {file_path}")
        return []

    pattern = re.compile(r"test\(['\"](.*?)['\"],|it\(['\"](.*?)['\"],")
    test_names = []

    for match in pattern.finditer(content):
        test_names.append(match.group(1) or match.group(2))

    if not test_names:
        print("No test names extracted. Check the regex pattern or the file content.")

    return test_names

def run_test_case(file_path, test_name):
    file_name = os.path.basename(file_path)
    sanitized_test_name = test_name.replace(' ', '_').replace("'", "").replace('"', '')
    log_file_path = os.path.join('logs', f"{file_name}-{sanitized_test_name}.log")

    command = ["npx", "jest", file_path, "-t", test_name]
    print(f"Executing command: {' '.join(command)}")
    with open(log_file_path, 'w') as log_file:
        subprocess.run(command, stdout=log_file, text=True)

def process_directory(directory_path):
    os.makedirs('logs', exist_ok=True)

    spec_files = glob.glob(os.path.join(directory_path, '**/*.test.ts'), recursive=True)
    spec_files.extend(glob.glob(os.path.join(directory_path, '**/*.spec.ts'), recursive=True))

    if not spec_files:
        print("No spec files found in the directory.")
        return

    for file_path in spec_files:
        print(f"Processing file: {file_path}")
        test_names = extract_test_names(file_path)

        if test_names:
            for name in test_names:
                print(f"Running test: {name} in file: {file_path}")
                run_test_case(file_path, name)
        else:
            print(f"No test names found in file: {file_path}")

if len(sys.argv) != 3:
    print("Usage: script.py <directory_path> <log_directory>")
    sys.exit(1)

directory_path = sys.argv[1]
log_directory = sys.argv[2]

process_directory(directory_path)
extract_data(log_directory)
print(json.dumps(global_results))

with open('result_mapping.json', 'w') as file:
    json.dump(global_results, file, indent=2)

print("Results written to result_mapping.json")