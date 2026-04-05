package scanner

import (
	"fmt"
	"regexp"
	"strings"
)

func extractFunctions(sortedFiles map[string][]string) (map[string][]string, error) {
	m := make(map[string][]string)
	calls := make(map[string]string)
	impotsm := make(map[string][]Import)

	filesToSearch := []string{".ts", ".js", ".jsx", ".tsx"}

	for _, files := range sortedFiles {
		for _, file := range files {
			if hasExtension(file, filesToSearch) {
				fns, err := extractFunctionsFromFile(file)
				fnCalls, err := extractFunctionCallsFromFile(file)
				imports, err := ExtractImportsFromFile(file)
				fmt.Println("Extracted imports from file: ", file, " - ", len(imports), " imports")

				fmt.Println("Extracted functions from file: ", file, " - ", len(fns), " functions")
				fmt.Println("Extracted function calls from file: ", file, " - ", len(fnCalls), " function calls")
				if err != nil {
					return nil, err
				}

				for _, call := range fnCalls {
					calls[call] = file
				}
				for _, fn := range fns {
					m[fn.Name] = fn.Params

				}
				impotsm[file] = imports
			}
		}
	}

	fmt.Println("Total unique function calls detected: ", len(calls))
	fmt.Println("Total unique functions detected: ", len(m))
	fmt.Println("Total files with imports detected: ", len(impotsm))

	return m, nil

}

type Import struct {
	Source string   // "react", "./utils"
	Names  []string // ["useState", "useEffect"]
	Type   string   // "default", "named", "namespace", "side-effect", "require", "dynamic"
}

func splitAndClean(s string) []string {
	var result []string

	for _, part := range strings.Split(s, ",") {
		part = strings.TrimSpace(part)

		// handle alias: a as b
		if strings.Contains(part, " as ") {
			part = strings.Split(part, " as ")[1]
		}

		if part != "" {
			result = append(result, part)
		}
	}

	return result
}

func ExtractImportsFromFile(filePath string) ([]Import, error) {

	content, err := ReadFileContent(filePath)
	if err != nil {
		return nil, err
	}

	imports := ExtractImports(content)

	return imports, nil

}

func ExtractImports(content string) []Import {
	if len(content) > 100_000 {
		return nil
	}

	var imports []Import

	// --- ES Modules: import ... from "..."
	importFromRegex := regexp.MustCompile(`(?m)import\s+(.*?)\s+from\s+['"]([^'"]+)['"]`)
	// --- Side effect: import "module"
	sideEffectRegex := regexp.MustCompile(`(?m)import\s+['"]([^'"]+)['"]`)
	// --- require()
	requireRegex := regexp.MustCompile(`(?m)(?:const|let|var)\s+(\w+)\s*=\s*require\(['"]([^'"]+)['"]\)`)
	// --- dynamic import()
	dynamicImportRegex := regexp.MustCompile(`(?m)import\(['"]([^'"]+)['"]\)`)

	// 1. import ... from ...
	for _, m := range importFromRegex.FindAllStringSubmatch(content, -1) {
		raw := strings.TrimSpace(m[1])
		source := m[2]

		imp := Import{
			Source: source,
		}

		if strings.HasPrefix(raw, "{") {
			// named imports
			names := strings.Trim(raw, "{} ")
			imp.Names = splitAndClean(names)
			imp.Type = "named"

		} else if strings.HasPrefix(raw, "*") {
			// namespace import
			imp.Type = "namespace"

		} else {
			// default import
			imp.Names = []string{raw}
			imp.Type = "default"
		}

		imports = append(imports, imp)
	}

	// 2. side-effect imports
	for _, m := range sideEffectRegex.FindAllStringSubmatch(content, -1) {
		source := m[1]

		imports = append(imports, Import{
			Source: source,
			Type:   "side-effect",
		})
	}

	// 3. require()
	for _, m := range requireRegex.FindAllStringSubmatch(content, -1) {
		name := m[1]
		source := m[2]

		imports = append(imports, Import{
			Source: source,
			Names:  []string{name},
			Type:   "require",
		})
	}

	// 4. dynamic import()
	for _, m := range dynamicImportRegex.FindAllStringSubmatch(content, -1) {
		source := m[1]

		imports = append(imports, Import{
			Source: source,
			Type:   "dynamic",
		})
	}

	return imports
}

func hasExtension(filePath string, extensions []string) bool {
	for _, ext := range extensions {
		if strings.HasSuffix(filePath, ext) {
			return true
		}
	}
	return false
}

func extractFunctionsFromFile(filePath string) ([]Function, error) {

	content, err := ReadFileContent(filePath)
	if err != nil {
		return nil, err
	}
	functions := ExtractFunctions(content)

	return functions, nil

}

func extractFunctionCallsFromFile(filePath string) ([]string, error) {

	content, err := ReadFileContent(filePath)
	if err != nil {
		return nil, err
	}
	functionCalls := extractFunctionCalls(content)

	return functionCalls, nil

}

func ExtractFunctions(content string) []Function {
	if len(content) > 100_000 {
		return nil
	}

	fnMap := make(map[string]Function)

	functionRegex := regexp.MustCompile(`(?m)^\s*(?:export\s+(?:default\s+)?)?(?:async\s+)?function\s*([a-zA-Z_]\w*)?\s*\(([^)]*)\)`)
	arrowFunctionRegex := regexp.MustCompile(`(?m)^\s*(?:export\s+)?(?:const|let|var)\s+([a-zA-Z_]\w*)\s*=\s*(?:async\s*)?\(?([^)]*)\)?\s*=>`)
	classMethodRegex := regexp.MustCompile(`(?m)^\s*(?:async\s+)?([a-zA-Z_]\w*)\s*\(([^)]*)\)\s*{`)

	for _, m := range functionRegex.FindAllStringSubmatch(content, -1) {
		name := m[1]
		params := parseParams(m[2])

		fnMap[name] = Function{
			Name:   name,
			Params: params,
			Type:   "function",
		}
	}

	for _, m := range arrowFunctionRegex.FindAllStringSubmatch(content, -1) {
		name := m[1]
		params := parseParams(m[2])

		fnMap[name] = Function{
			Name:   name,
			Params: params,
			Type:   "arrow",
		}
	}

	for _, m := range classMethodRegex.FindAllStringSubmatch(content, -1) {
		name := m[1]

		if name == "if" || name == "for" || name == "while" || name == "switch" {
			continue
		}

		params := parseParams(m[2])

		fnMap[name] = Function{
			Name:   name,
			Params: params,
			Type:   "method",
		}
	}

	for k, fn := range fnMap {
		fnMap[k] = fn
	}

	var result []Function
	for _, fn := range fnMap {
		result = append(result, fn)
	}

	return result
}

func extractFunctionCalls(content string) []string {
	if len(content) > 100_000 {
		return nil
	}

	functionCallRegex := regexp.MustCompile(`(?m)(?:\b|\.)\s*([a-zA-Z_]\w*)\s*\(`)

	ignore := map[string]bool{
		"if": true, "for": true, "while": true, "switch": true,
		"return": true, "catch": true, "function": true,
	}

	callSet := make(map[string]bool)

	for _, m := range functionCallRegex.FindAllStringSubmatch(content, -1) {
		name := m[1]

		if ignore[name] {
			continue
		}

		callSet[name] = true
	}

	var calls []string
	for c := range callSet {
		calls = append(calls, c)
	}

	return calls
}

func parseParams(paramStr string) []string {
	var params []string

	for _, p := range strings.Split(paramStr, ",") {
		p = strings.TrimSpace(p)
		if p == "" {
			continue
		}

		if strings.Contains(p, "=") {
			p = strings.Split(p, "=")[0]
		}

		params = append(params, p)
	}

	return params
}

type Function struct {
	Name   string
	Params []string
	Type   string
}
