package scanner

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
)

type Import struct {
	Source string   `json:"source"`
	Names  []string `json:"names,omitempty"`
	Type   string   `json:"type"`
}

type Function struct {
	Name      string   `json:"name"`
	Params    []string `json:"params"`
	Type      string   `json:"type"`
	File      string   `json:"file,omitempty"`
	StartLine int      `json:"startLine,omitempty"`
	EndLine   int      `json:"endLine,omitempty"`
	Calls     []string `json:"calls,omitempty"`
	Body      string   `json:"-"`
}

type ExtractionGraph struct {
	Files       []FileGraph  `json:"files"`
	Nodes       []GraphNode  `json:"nodes"`
	Edges       []GraphEdge  `json:"edges"`
	EntryPoints []string     `json:"entryPoints"`
	ExitPoints  []string     `json:"exitPoints"`
	Features    []string     `json:"features"`
	Metadata    GraphMetrics `json:"metadata"`
}

type FileGraph struct {
	File      string     `json:"file"`
	Imports   []Import   `json:"imports"`
	Functions []Function `json:"functions"`
}

type GraphNode struct {
	ID    string `json:"id"`
	Label string `json:"label"`
	Kind  string `json:"kind"`
	File  string `json:"file,omitempty"`
}

type GraphEdge struct {
	From string `json:"from"`
	To   string `json:"to"`
	Kind string `json:"kind"`
}

type GraphMetrics struct {
	Files     int `json:"files"`
	Functions int `json:"functions"`
	Calls     int `json:"calls"`
	Imports   int `json:"imports"`
	Nodes     int `json:"nodes"`
	Edges     int `json:"edges"`
}

type CodebaseMap struct {
	Overview   GraphMetrics    `json:"overview"`
	Features   []FeatureMap    `json:"features"`
	EntryFlows []EntrypointMap `json:"entryFlows"`
	LayerEdges []LayerEdge     `json:"layerEdges"`
}

type FeatureMap struct {
	Name          string   `json:"name"`
	FileCount     int      `json:"fileCount"`
	FunctionCount int      `json:"functionCount"`
	ImportCount   int      `json:"importCount"`
	Entrypoints   []string `json:"entrypoints"`
	Dependencies  []string `json:"dependencies"`
}

type EntrypointMap struct {
	Entrypoint string   `json:"entrypoint"`
	Exit       string   `json:"exit"`
	Features   []string `json:"features"`
	Functions  []string `json:"functions"`
}

type LayerEdge struct {
	From string `json:"from"`
	To   string `json:"to"`
	Kind string `json:"kind"`
}

type fnRef struct {
	ID string
}

type frameworkContext struct {
	IsNext  bool
	IsReact bool
}

var (
	functionDeclRegex     = regexp.MustCompile(`(?m)^\s*(?:export\s+(?:default\s+)?)?(?:async\s+)?function\s+([a-zA-Z_]\w*)\s*\(([^)]*)\)\s*{`)
	arrowParenRegex       = regexp.MustCompile(`(?m)^\s*(?:export\s+)?(?:const|let|var)\s+([a-zA-Z_]\w*)\s*=\s*(?:async\s*)?\(([^)]*)\)\s*=>\s*{`)
	arrowSingleParamRegex = regexp.MustCompile(`(?m)^\s*(?:export\s+)?(?:const|let|var)\s+([a-zA-Z_]\w*)\s*=\s*(?:async\s*)?([a-zA-Z_]\w*)\s*=>\s*{`)
)

func extractFunctions(root string, frameworks []string, sortedFiles map[string][]string) (ExtractionGraph, error) {
	graph := ExtractionGraph{}
	ctx := buildFrameworkContext(frameworks)
	functions := make(map[string][]string)
	importsByFile := make(map[string][]Import)
	callsByFile := make(map[string][]string)

	files := sortedSearchableFiles(sortedFiles)
	if len(files) == 0 {
		return graph, nil
	}

	localFnByFile := make(map[string]map[string]string)
	globalFnIndex := make(map[string][]fnRef)
	importSymbolIndex := make(map[string]map[string]string)

	for _, file := range files {
		content, err := ReadFileContent(file)
		if err != nil {
			return graph, err
		}
		displayFile := trimBasePath(root, file)

		imports := ExtractImports(content)
		fns := ExtractFunctions(content)
		for i := range fns {
			fns[i].File = displayFile
			fns[i].Calls = extractFunctionCalls(fns[i].Body)
			functions[functionKey(displayFile, fns[i].Name)] = fns[i].Params
		}

		importsByFile[displayFile] = imports
		importSymbolIndex[displayFile] = buildImportSymbolIndex(imports)

		fnMap := make(map[string]string)
		callSet := make(map[string]struct{})
		for _, fn := range fns {
			id := functionNodeID(displayFile, fn.Name)
			fnMap[fn.Name] = id
			globalFnIndex[fn.Name] = append(globalFnIndex[fn.Name], fnRef{ID: id})
			for _, c := range fn.Calls {
				callSet[c] = struct{}{}
			}
		}
		localFnByFile[displayFile] = fnMap
		callsByFile[displayFile] = mapKeysSorted(callSet)

		graph.Files = append(graph.Files, FileGraph{File: displayFile, Imports: imports, Functions: fns})
	}

	addBaseNodesAndEdges(&graph)
	addCallEdges(&graph, localFnByFile, globalFnIndex, importSymbolIndex)
	addEntryNodes(&graph, ctx)
	addExitNodes(&graph, ctx)
	sortGraph(&graph)

	fmt.Println("Total unique function calls detected:", totalUniqueCalls(callsByFile))
	fmt.Println("Total unique functions detected:", len(functions))
	fmt.Println("Total files with imports detected:", len(importsByFile))

	exportExtractedData(functions, importsByFile, callsByFile)
	if err := saveGraphArtifacts(graph); err != nil {
		return graph, err
	}

	return graph, nil
}

func buildFrameworkContext(frameworks []string) frameworkContext {
	ctx := frameworkContext{}
	for _, fw := range frameworks {
		f := strings.ToLower(strings.TrimSpace(fw))
		switch f {
		case "next", "next.js", "nextjs":
			ctx.IsNext = true
		case "react":
			ctx.IsReact = true
		}
	}
	return ctx
}

func trimBasePath(base, target string) string {
	rel, err := filepath.Rel(base, target)
	if err == nil && rel != "." && !strings.HasPrefix(rel, "..") {
		return filepath.ToSlash(rel)
	}

	cleanTarget := filepath.ToSlash(filepath.Clean(target))
	cleanBase := filepath.ToSlash(filepath.Clean(base))
	trimmed := strings.TrimPrefix(cleanTarget, cleanBase)
	trimmed = strings.TrimPrefix(trimmed, "/")
	if trimmed == "" {
		return cleanTarget
	}
	return trimmed
}

func exportExtractedData(functions map[string][]string, imports map[string][]Import, calls map[string][]string) {
	fmt.Println("\n--- Extracted Functions ---")
	functionKeys := make([]string, 0, len(functions))
	for name := range functions {
		functionKeys = append(functionKeys, name)
	}
	sort.Strings(functionKeys)
	for _, name := range functionKeys {
		fmt.Printf("Function: %s, Params: %v\n", name, functions[name])
	}

	fmt.Println("\n--- Extracted Imports ---")
	importFiles := make([]string, 0, len(imports))
	for file := range imports {
		importFiles = append(importFiles, file)
	}
	sort.Strings(importFiles)
	for _, file := range importFiles {
		fmt.Printf("File: %s\n", file)
		for _, imp := range imports[file] {
			fmt.Printf("  Import: Source=%s, Names=%v, Type=%s\n", imp.Source, imp.Names, imp.Type)
		}
	}

	fmt.Println("\n--- Extracted Function Calls ---")
	callFiles := make([]string, 0, len(calls))
	for file := range calls {
		callFiles = append(callFiles, file)
	}
	sort.Strings(callFiles)
	for _, file := range callFiles {
		fmt.Printf("File: %s\n", file)
		for _, call := range calls[file] {
			fmt.Printf("  Call: %s\n", call)
		}
	}
}

func splitAndClean(s string) []string {
	var result []string

	for _, part := range strings.Split(s, ",") {
		part = strings.TrimSpace(part)
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
	return ExtractImports(content), nil
}

func ExtractImports(content string) []Import {
	if len(content) > 100_000 {
		return nil
	}

	var imports []Import

	importFromRegex := regexp.MustCompile(`(?m)import\s+(.*?)\s+from\s+['"]([^'"]+)['"]`)
	sideEffectRegex := regexp.MustCompile(`(?m)import\s+['"]([^'"]+)['"]`)
	requireRegex := regexp.MustCompile(`(?m)(?:const|let|var)\s+(\w+)\s*=\s*require\(['"]([^'"]+)['"]\)`)
	dynamicImportRegex := regexp.MustCompile(`(?m)import\(['"]([^'"]+)['"]\)`)

	for _, m := range importFromRegex.FindAllStringSubmatch(content, -1) {
		raw := strings.TrimSpace(m[1])
		source := m[2]

		imp := Import{Source: source}
		switch {
		case strings.HasPrefix(raw, "*"):
			imp.Type = "namespace"
			parts := strings.Fields(raw)
			if len(parts) >= 3 && strings.EqualFold(parts[1], "as") {
				imp.Names = []string{parts[2]}
			}
		case strings.Contains(raw, "{"):
			left := strings.Split(raw, "{")[0]
			left = strings.Trim(strings.TrimSpace(left), ",")
			right := raw[strings.Index(raw, "{")+1:]
			right = strings.TrimSuffix(right, "}")
			if left != "" {
				imp.Names = append(imp.Names, left)
			}
			imp.Names = append(imp.Names, splitAndClean(right)...)
			imp.Type = "named"
		default:
			imp.Names = []string{raw}
			imp.Type = "default"
		}

		imports = append(imports, imp)
	}

	for _, m := range sideEffectRegex.FindAllStringSubmatch(content, -1) {
		imports = append(imports, Import{Source: m[1], Type: "side-effect"})
	}

	for _, m := range requireRegex.FindAllStringSubmatch(content, -1) {
		imports = append(imports, Import{Source: m[2], Names: []string{m[1]}, Type: "require"})
	}

	for _, m := range dynamicImportRegex.FindAllStringSubmatch(content, -1) {
		imports = append(imports, Import{Source: m[1], Type: "dynamic"})
	}

	return imports
}

func extractFunctionsFromFile(filePath string) ([]Function, error) {
	content, err := ReadFileContent(filePath)
	if err != nil {
		return nil, err
	}
	return ExtractFunctions(content), nil
}

func extractFunctionCallsFromFile(filePath string) ([]string, error) {
	content, err := ReadFileContent(filePath)
	if err != nil {
		return nil, err
	}
	return extractFunctionCalls(content), nil
}

func ExtractFunctions(content string) []Function {
	if len(content) > 100_000 {
		return nil
	}

	var result []Function
	result = append(result, extractFunctionByPattern(content, functionDeclRegex, 1, 2, "function")...)
	result = append(result, extractFunctionByPattern(content, arrowParenRegex, 1, 2, "arrow")...)
	result = append(result, extractFunctionByPattern(content, arrowSingleParamRegex, 1, 2, "arrow")...)

	fnMap := make(map[string]Function)
	for _, fn := range result {
		if fn.Name == "" || isKeyword(fn.Name) {
			continue
		}
		key := fmt.Sprintf("%s:%d", fn.Name, fn.StartLine)
		fnMap[key] = fn
	}

	result = result[:0]
	for _, fn := range fnMap {
		result = append(result, fn)
	}

	sort.Slice(result, func(i, j int) bool {
		if result[i].StartLine == result[j].StartLine {
			return result[i].Name < result[j].Name
		}
		return result[i].StartLine < result[j].StartLine
	})

	return result
}

func extractFunctionByPattern(content string, re *regexp.Regexp, nameIdx, paramIdx int, fnType string) []Function {
	matches := re.FindAllStringSubmatchIndex(content, -1)
	functions := make([]Function, 0, len(matches))

	for _, idx := range matches {
		if len(idx) <= paramIdx*2+1 {
			continue
		}

		name := content[idx[nameIdx*2]:idx[nameIdx*2+1]]
		paramRaw := content[idx[paramIdx*2]:idx[paramIdx*2+1]]

		openBraceIdx := idx[1] - 1
		closeBraceIdx := findMatchingBrace(content, openBraceIdx)
		if closeBraceIdx <= openBraceIdx {
			continue
		}

		body := content[openBraceIdx+1 : closeBraceIdx]
		functions = append(functions, Function{
			Name:      name,
			Params:    parseParams(paramRaw),
			Type:      fnType,
			StartLine: lineNumberAt(content, idx[0]),
			EndLine:   lineNumberAt(content, closeBraceIdx),
			Body:      body,
		})
	}

	return functions
}

func findMatchingBrace(content string, openIdx int) int {
	if openIdx < 0 || openIdx >= len(content) || content[openIdx] != '{' {
		return -1
	}

	depth := 0
	inSingle := false
	inDouble := false
	inTemplate := false
	escaped := false

	for i := openIdx; i < len(content); i++ {
		ch := content[i]
		if escaped {
			escaped = false
			continue
		}
		if ch == '\\' {
			escaped = true
			continue
		}

		if !inDouble && !inTemplate && ch == '\'' {
			inSingle = !inSingle
			continue
		}
		if !inSingle && !inTemplate && ch == '"' {
			inDouble = !inDouble
			continue
		}
		if !inSingle && !inDouble && ch == '`' {
			inTemplate = !inTemplate
			continue
		}
		if inSingle || inDouble || inTemplate {
			continue
		}

		if ch == '{' {
			depth++
			continue
		}
		if ch == '}' {
			depth--
			if depth == 0 {
				return i
			}
		}
	}

	return -1
}

func lineNumberAt(content string, index int) int {
	if index <= 0 {
		return 1
	}
	if index > len(content) {
		index = len(content)
	}
	return strings.Count(content[:index], "\n") + 1
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

	calls := make([]string, 0, len(callSet))
	for c := range callSet {
		calls = append(calls, c)
	}
	sort.Strings(calls)
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

func sortedSearchableFiles(sortedFiles map[string][]string) []string {
	filesToSearch := []string{".ts", ".js", ".jsx", ".tsx"}
	allowed := make(map[string]struct{}, len(filesToSearch))
	for _, ext := range filesToSearch {
		allowed[ext] = struct{}{}
	}

	exts := make([]string, 0, len(sortedFiles))
	for ext := range sortedFiles {
		exts = append(exts, ext)
	}
	sort.Strings(exts)

	var files []string
	for _, ext := range exts {
		if _, ok := allowed[ext]; !ok {
			continue
		}
		group := append([]string(nil), sortedFiles[ext]...)
		sort.Strings(group)
		files = append(files, group...)
	}

	return files
}

func functionKey(file, name string) string {
	return file + "::" + name
}

func functionNodeID(file, name string) string {
	return "fn:" + functionKey(file, name)
}

func fileNodeID(file string) string {
	return "file:" + file
}

func featureNodeID(source string) string {
	return "feature:" + source
}

func externalNodeID(name string) string {
	return "external:" + name
}

func entryNodeID(file string) string {
	return "entry:" + file
}

func exitNodeID(file string) string {
	return "exit:" + file
}

func isKeyword(word string) bool {
	keywords := map[string]struct{}{
		"if": {}, "for": {}, "while": {}, "switch": {}, "catch": {}, "return": {}, "function": {},
	}
	_, ok := keywords[word]
	return ok
}

func addBaseNodesAndEdges(graph *ExtractionGraph) {
	nodeSet := make(map[string]GraphNode)
	edgeSet := make(map[string]GraphEdge)
	featureSet := make(map[string]struct{})

	for _, fileGraph := range graph.Files {
		fileID := fileNodeID(fileGraph.File)
		nodeSet[fileID] = GraphNode{ID: fileID, Label: fileGraph.File, Kind: "file", File: fileGraph.File}

		for _, imp := range fileGraph.Imports {
			featureID := featureNodeID(imp.Source)
			nodeSet[featureID] = GraphNode{ID: featureID, Label: imp.Source, Kind: "feature"}
			edge := GraphEdge{From: fileID, To: featureID, Kind: "imports"}
			edgeSet[edgeKey(edge)] = edge
			featureSet[featureID] = struct{}{}
		}

		for _, fn := range fileGraph.Functions {
			fnID := functionNodeID(fileGraph.File, fn.Name)
			nodeSet[fnID] = GraphNode{ID: fnID, Label: fn.Name, Kind: "function", File: fileGraph.File}
			edge := GraphEdge{From: fileID, To: fnID, Kind: "declares"}
			edgeSet[edgeKey(edge)] = edge
		}
	}

	graph.Nodes = mapNodeValues(nodeSet)
	graph.Edges = mapEdgeValues(edgeSet)
	graph.Features = mapKeysSorted(featureSet)
}

func addCallEdges(graph *ExtractionGraph, localFnByFile map[string]map[string]string, globalFnIndex map[string][]fnRef, importSymbolIndex map[string]map[string]string) {
	nodeSet := nodeSliceToMap(graph.Nodes)
	edgeSet := edgeSliceToMap(graph.Edges)

	for _, fileGraph := range graph.Files {
		for _, fn := range fileGraph.Functions {
			fromID := functionNodeID(fileGraph.File, fn.Name)
			for _, call := range fn.Calls {
				if localID, ok := localFnByFile[fileGraph.File][call]; ok {
					edgeSet[edgeKey(GraphEdge{From: fromID, To: localID, Kind: "call-local"})] = GraphEdge{From: fromID, To: localID, Kind: "call-local"}
					continue
				}

				if source, ok := importSymbolIndex[fileGraph.File][call]; ok {
					featureID := featureNodeID(source)
					nodeSet[featureID] = GraphNode{ID: featureID, Label: source, Kind: "feature"}
					edgeSet[edgeKey(GraphEdge{From: fromID, To: featureID, Kind: "call-feature"})] = GraphEdge{From: fromID, To: featureID, Kind: "call-feature"}
					continue
				}

				if refs := globalFnIndex[call]; len(refs) == 1 {
					edgeSet[edgeKey(GraphEdge{From: fromID, To: refs[0].ID, Kind: "call-global"})] = GraphEdge{From: fromID, To: refs[0].ID, Kind: "call-global"}
					continue
				}

				extID := externalNodeID(call)
				nodeSet[extID] = GraphNode{ID: extID, Label: call, Kind: "external"}
				edgeSet[edgeKey(GraphEdge{From: fromID, To: extID, Kind: "call-external"})] = GraphEdge{From: fromID, To: extID, Kind: "call-external"}
			}
		}
	}

	graph.Nodes = mapNodeValues(nodeSet)
	graph.Edges = mapEdgeValues(edgeSet)
}

func addEntryNodes(graph *ExtractionGraph, ctx frameworkContext) {
	nodeSet := nodeSliceToMap(graph.Nodes)
	edgeSet := edgeSliceToMap(graph.Edges)
	entrySet := make(map[string]struct{})

	hasAnyEntry := false
	for _, fileGraph := range graph.Files {
		if !isEntryFile(fileGraph.File, ctx) {
			continue
		}
		hasAnyEntry = true
		entryID := entryNodeID(fileGraph.File)
		nodeSet[entryID] = GraphNode{ID: entryID, Label: "entry", Kind: "entry", File: fileGraph.File}
		entrySet[entryID] = struct{}{}

		for _, fn := range fileGraph.Functions {
			edge := GraphEdge{From: entryID, To: functionNodeID(fileGraph.File, fn.Name), Kind: "entry"}
			edgeSet[edgeKey(edge)] = edge
		}
	}

	if !hasAnyEntry && len(graph.Files) > 0 {
		fallback := graph.Files[0]
		entryID := entryNodeID(fallback.File)
		nodeSet[entryID] = GraphNode{ID: entryID, Label: "entry", Kind: "entry", File: fallback.File}
		entrySet[entryID] = struct{}{}
		for _, fn := range fallback.Functions {
			edge := GraphEdge{From: entryID, To: functionNodeID(fallback.File, fn.Name), Kind: "entry"}
			edgeSet[edgeKey(edge)] = edge
		}
	}

	graph.Nodes = mapNodeValues(nodeSet)
	graph.Edges = mapEdgeValues(edgeSet)
	graph.EntryPoints = mapKeysSorted(entrySet)
}

func addExitNodes(graph *ExtractionGraph, ctx frameworkContext) {
	nodeSet := nodeSliceToMap(graph.Nodes)
	edgeSet := edgeSliceToMap(graph.Edges)
	outgoing := make(map[string]int)
	exitSet := make(map[string]struct{})

	for _, edge := range mapEdgeValues(edgeSet) {
		if strings.HasPrefix(edge.From, "fn:") && (strings.HasPrefix(edge.To, "fn:") || strings.HasPrefix(edge.To, "external:") || strings.HasPrefix(edge.To, "feature:")) {
			outgoing[edge.From]++
		}
	}

	for _, fileGraph := range graph.Files {
		if !isCandidateExitFile(fileGraph.File, ctx) {
			continue
		}

		exitID := exitNodeID(fileGraph.File)
		nodeSet[exitID] = GraphNode{ID: exitID, Label: "exit", Kind: "exit", File: fileGraph.File}
		exitSet[exitID] = struct{}{}

		for _, fn := range fileGraph.Functions {
			fnID := functionNodeID(fileGraph.File, fn.Name)
			if outgoing[fnID] > 0 {
				continue
			}
			edge := GraphEdge{From: fnID, To: exitID, Kind: "exit"}
			edgeSet[edgeKey(edge)] = edge
		}
	}

	graph.Nodes = mapNodeValues(nodeSet)
	graph.Edges = mapEdgeValues(edgeSet)
	graph.ExitPoints = mapKeysSorted(exitSet)
}

func sortGraph(graph *ExtractionGraph) {
	sort.Slice(graph.Files, func(i, j int) bool {
		return graph.Files[i].File < graph.Files[j].File
	})

	for i := range graph.Files {
		sort.Slice(graph.Files[i].Functions, func(a, b int) bool {
			if graph.Files[i].Functions[a].StartLine == graph.Files[i].Functions[b].StartLine {
				return graph.Files[i].Functions[a].Name < graph.Files[i].Functions[b].Name
			}
			return graph.Files[i].Functions[a].StartLine < graph.Files[i].Functions[b].StartLine
		})
		sort.Slice(graph.Files[i].Imports, func(a, b int) bool {
			if graph.Files[i].Imports[a].Source == graph.Files[i].Imports[b].Source {
				return graph.Files[i].Imports[a].Type < graph.Files[i].Imports[b].Type
			}
			return graph.Files[i].Imports[a].Source < graph.Files[i].Imports[b].Source
		})
	}

	sort.Slice(graph.Nodes, func(i, j int) bool {
		if graph.Nodes[i].Kind == graph.Nodes[j].Kind {
			return graph.Nodes[i].ID < graph.Nodes[j].ID
		}
		return graph.Nodes[i].Kind < graph.Nodes[j].Kind
	})

	sort.Slice(graph.Edges, func(i, j int) bool {
		if graph.Edges[i].From == graph.Edges[j].From {
			if graph.Edges[i].To == graph.Edges[j].To {
				return graph.Edges[i].Kind < graph.Edges[j].Kind
			}
			return graph.Edges[i].To < graph.Edges[j].To
		}
		return graph.Edges[i].From < graph.Edges[j].From
	})

	sort.Strings(graph.EntryPoints)
	sort.Strings(graph.ExitPoints)
	sort.Strings(graph.Features)

	graph.Metadata = GraphMetrics{
		Files:     len(graph.Files),
		Functions: countFunctions(graph.Files),
		Calls:     countCallEdges(graph.Edges),
		Imports:   countImports(graph.Files),
		Nodes:     len(graph.Nodes),
		Edges:     len(graph.Edges),
	}
}

func buildImportSymbolIndex(imports []Import) map[string]string {
	idx := make(map[string]string)
	for _, imp := range imports {
		for _, name := range imp.Names {
			idx[name] = imp.Source
		}
	}
	return idx
}

func mapKeysSorted[T any](m map[string]T) []string {
	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	return keys
}

func nodeSliceToMap(nodes []GraphNode) map[string]GraphNode {
	out := make(map[string]GraphNode, len(nodes))
	for _, n := range nodes {
		out[n.ID] = n
	}
	return out
}

func edgeSliceToMap(edges []GraphEdge) map[string]GraphEdge {
	out := make(map[string]GraphEdge, len(edges))
	for _, e := range edges {
		out[edgeKey(e)] = e
	}
	return out
}

func mapNodeValues(m map[string]GraphNode) []GraphNode {
	out := make([]GraphNode, 0, len(m))
	for _, v := range m {
		out = append(out, v)
	}
	return out
}

func mapEdgeValues(m map[string]GraphEdge) []GraphEdge {
	out := make([]GraphEdge, 0, len(m))
	for _, v := range m {
		out = append(out, v)
	}
	return out
}

func edgeKey(e GraphEdge) string {
	return e.From + "|" + e.Kind + "|" + e.To
}

func totalUniqueCalls(callsByFile map[string][]string) int {
	set := make(map[string]struct{})
	for _, calls := range callsByFile {
		for _, c := range calls {
			set[c] = struct{}{}
		}
	}
	return len(set)
}

func isEntryFile(file string, ctx frameworkContext) bool {
	f := strings.ToLower(filepath.ToSlash(file))
	n := filepath.Base(f)

	if ctx.IsNext {
		if n == "middleware.ts" || n == "middleware.tsx" {
			return true
		}
		if pathEndsWith(f, "app/page.tsx") || pathEndsWith(f, "app/layout.tsx") {
			return true
		}
		if pathContainsSegment(f, "app") && (strings.HasSuffix(f, "/page.tsx") || strings.HasSuffix(f, "/route.ts")) {
			return true
		}
		if pathEndsWith(f, "pages/_app.tsx") || pathEndsWith(f, "pages/index.tsx") {
			return true
		}
	}

	if ctx.IsReact {
		if n == "main.tsx" || n == "main.ts" || n == "index.tsx" || n == "index.ts" {
			return true
		}
		if pathEndsWith(f, "src/app.tsx") || pathEndsWith(f, "src/app.jsx") {
			return true
		}
	}

	if n == "main.ts" || n == "main.tsx" || n == "index.ts" || n == "index.tsx" {
		return true
	}

	return false
}

func isCandidateExitFile(file string, ctx frameworkContext) bool {
	f := strings.ToLower(filepath.ToSlash(file))
	n := filepath.Base(f)

	if ctx.IsNext {
		if pathContainsSegment(f, "app") && strings.Contains("/"+f, "/app/api/") && strings.HasSuffix(f, "/route.ts") {
			return true
		}
		if pathContainsSegment(f, "app") && strings.HasSuffix(f, "/page.tsx") {
			return true
		}
		if pathEndsWith(f, "middleware.ts") {
			return true
		}
	}

	if ctx.IsReact {
		if pathEndsWith(f, "src/app.tsx") || pathEndsWith(f, "src/app.jsx") {
			return true
		}
		if n == "main.tsx" || n == "main.ts" || n == "index.tsx" || n == "index.ts" {
			return true
		}
	}

	if pathContainsSegment(f, "app") && strings.HasSuffix(f, "/page.tsx") {
		return true
	}

	return false
}

func pathContainsSegment(p, seg string) bool {
	p = strings.Trim(filepath.ToSlash(p), "/")
	parts := strings.Split(p, "/")
	for _, part := range parts {
		if part == seg {
			return true
		}
	}
	return false
}

func pathEndsWith(p, suffix string) bool {
	p = strings.TrimPrefix(filepath.ToSlash(p), "./")
	suffix = strings.TrimPrefix(filepath.ToSlash(suffix), "./")
	return p == suffix || strings.HasSuffix(p, "/"+suffix)
}

func countFunctions(files []FileGraph) int {
	total := 0
	for _, f := range files {
		total += len(f.Functions)
	}
	return total
}

func countImports(files []FileGraph) int {
	total := 0
	for _, f := range files {
		total += len(f.Imports)
	}
	return total
}

func countCallEdges(edges []GraphEdge) int {
	total := 0
	for _, e := range edges {
		if strings.HasPrefix(e.Kind, "call") {
			total++
		}
	}
	return total
}

func saveGraphArtifacts(graph ExtractionGraph) error {
	dir := filepath.Join("tmp", "checkpoints")
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return err
	}

	codebaseMap := buildCodebaseMap(graph)

	jsonPath := filepath.Join(dir, "function_graph.json")
	jsonPayload, err := json.MarshalIndent(graph, "", "  ")
	if err != nil {
		return err
	}
	if err := os.WriteFile(jsonPath, jsonPayload, 0o644); err != nil {
		return err
	}

	mermaidPath := filepath.Join(dir, "function_graph.mmd")
	if err := os.WriteFile(mermaidPath, []byte(buildMermaidOverview(graph)), 0o644); err != nil {
		return err
	}

	parts, err := writeDetailedMermaidShards(graph, dir, 400)
	if err != nil {
		return err
	}

	indexPath := filepath.Join(dir, "function_graph_parts.txt")
	if err := os.WriteFile(indexPath, []byte(strings.Join(parts, "\n")+"\n"), 0o644); err != nil {
		return err
	}

	featureParts, err := writeFeatureMermaidShards(graph, dir, 300)
	if err != nil {
		return err
	}

	featureIndexPath := filepath.Join(dir, "function_graph_feature_parts.txt")
	if err := os.WriteFile(featureIndexPath, []byte(strings.Join(featureParts, "\n")+"\n"), 0o644); err != nil {
		return err
	}

	mapJSONPath := filepath.Join(dir, "codebase_map.json")
	mapJSON, err := json.MarshalIndent(codebaseMap, "", "  ")
	if err != nil {
		return err
	}
	if err := os.WriteFile(mapJSONPath, mapJSON, 0o644); err != nil {
		return err
	}

	mapMDPath := filepath.Join(dir, "codebase_map.md")
	if err := os.WriteFile(mapMDPath, []byte(buildCodebaseMapMarkdown(codebaseMap)), 0o644); err != nil {
		return err
	}

	architecturePath := filepath.Join(dir, "architecture_map.mmd")
	if err := os.WriteFile(architecturePath, []byte(buildArchitectureMapMermaid(codebaseMap)), 0o644); err != nil {
		return err
	}

	entryFlowPath := filepath.Join(dir, "entry_flow_map.mmd")
	if err := os.WriteFile(entryFlowPath, []byte(buildEntrypointMapMermaid(codebaseMap)), 0o644); err != nil {
		return err
	}

	featureMapPath := filepath.Join(dir, "feature_map.mmd")
	if err := os.WriteFile(featureMapPath, []byte(buildFeatureMapMermaid(codebaseMap)), 0o644); err != nil {
		return err
	}

	fmt.Println("Graph JSON saved:", jsonPath)
	fmt.Println("Codebase map JSON saved:", mapJSONPath)
	fmt.Println("Codebase map markdown saved:", mapMDPath)
	fmt.Println("Architecture map saved:", architecturePath)
	fmt.Println("Entrypoint map saved:", entryFlowPath)
	fmt.Println("Feature map saved:", featureMapPath)
	fmt.Println("Graph Mermaid overview saved:", mermaidPath)
	fmt.Println("Graph Mermaid part index saved:", indexPath)
	fmt.Println("Graph feature part index saved:", featureIndexPath)
	return nil
}

func buildCodebaseMap(graph ExtractionGraph) CodebaseMap {
	fileByPath := make(map[string]FileGraph, len(graph.Files))
	for _, f := range graph.Files {
		fileByPath[f.File] = f
	}

	entrySet := make(map[string]struct{}, len(graph.EntryPoints))
	for _, e := range graph.EntryPoints {
		entrySet[strings.TrimPrefix(e, "entry:")] = struct{}{}
	}

	exitSet := make(map[string]struct{}, len(graph.ExitPoints))
	for _, e := range graph.ExitPoints {
		exitSet[strings.TrimPrefix(e, "exit:")] = struct{}{}
	}

	type featureAccumulator struct {
		FileCount     int
		FunctionCount int
		ImportCount   int
		Entrypoints   map[string]struct{}
		Dependencies  map[string]struct{}
	}

	featureAcc := make(map[string]*featureAccumulator)
	for _, fg := range graph.Files {
		feature := fileFeatureGroup(fg.File)
		if feature == "" {
			feature = "shared"
		}
		acc, ok := featureAcc[feature]
		if !ok {
			acc = &featureAccumulator{Entrypoints: map[string]struct{}{}, Dependencies: map[string]struct{}{}}
			featureAcc[feature] = acc
		}

		acc.FileCount++
		acc.FunctionCount += len(fg.Functions)
		acc.ImportCount += len(fg.Imports)

		if _, ok := entrySet[fg.File]; ok {
			acc.Entrypoints[fg.File] = struct{}{}
		}

		for _, imp := range fg.Imports {
			dep := dependencyGroup(imp.Source)
			if dep != "" && dep != feature {
				acc.Dependencies[dep] = struct{}{}
			}
		}
	}

	features := make([]FeatureMap, 0, len(featureAcc))
	for name, acc := range featureAcc {
		features = append(features, FeatureMap{
			Name:          name,
			FileCount:     acc.FileCount,
			FunctionCount: acc.FunctionCount,
			ImportCount:   acc.ImportCount,
			Entrypoints:   mapKeysSorted(acc.Entrypoints),
			Dependencies:  mapKeysSorted(acc.Dependencies),
		})
	}
	sort.Slice(features, func(i, j int) bool {
		if features[i].FileCount == features[j].FileCount {
			return features[i].Name < features[j].Name
		}
		return features[i].FileCount > features[j].FileCount
	})

	entryFlows := make([]EntrypointMap, 0, len(entrySet))
	for entry := range entrySet {
		fg, ok := fileByPath[entry]
		if !ok {
			continue
		}

		featuresSet := map[string]struct{}{}
		for _, imp := range fg.Imports {
			featuresSet[dependencyGroup(imp.Source)] = struct{}{}
		}

		fnNames := make([]string, 0, len(fg.Functions))
		for _, fn := range fg.Functions {
			fnNames = append(fnNames, fn.Name)
		}
		sort.Strings(fnNames)
		if len(fnNames) > 8 {
			fnNames = fnNames[:8]
		}

		exit := ""
		if _, ok := exitSet[entry]; ok {
			exit = entry
		}

		entryFlows = append(entryFlows, EntrypointMap{
			Entrypoint: entry,
			Exit:       exit,
			Features:   limitedKeys(featuresSet, 10),
			Functions:  fnNames,
		})
	}
	sort.Slice(entryFlows, func(i, j int) bool { return entryFlows[i].Entrypoint < entryFlows[j].Entrypoint })

	layerEdges := []LayerEdge{}
	seen := map[string]struct{}{}
	for _, ef := range entryFlows {
		entryNode := "entry:" + ef.Entrypoint
		for _, feat := range ef.Features {
			e := LayerEdge{From: entryNode, To: "feature:" + feat, Kind: "entry-feature"}
			k := e.From + "|" + e.Kind + "|" + e.To
			if _, ok := seen[k]; !ok {
				seen[k] = struct{}{}
				layerEdges = append(layerEdges, e)
			}
		}
	}
	for _, f := range features {
		for _, dep := range f.Dependencies {
			e := LayerEdge{From: "feature:" + f.Name, To: "dependency:" + dep, Kind: "feature-dependency"}
			k := e.From + "|" + e.Kind + "|" + e.To
			if _, ok := seen[k]; !ok {
				seen[k] = struct{}{}
				layerEdges = append(layerEdges, e)
			}
		}
	}
	sort.Slice(layerEdges, func(i, j int) bool {
		if layerEdges[i].From == layerEdges[j].From {
			if layerEdges[i].To == layerEdges[j].To {
				return layerEdges[i].Kind < layerEdges[j].Kind
			}
			return layerEdges[i].To < layerEdges[j].To
		}
		return layerEdges[i].From < layerEdges[j].From
	})

	return CodebaseMap{
		Overview:   graph.Metadata,
		Features:   features,
		EntryFlows: entryFlows,
		LayerEdges: layerEdges,
	}
}

func dependencyGroup(source string) string {
	source = strings.TrimSpace(source)
	if source == "" {
		return "unknown"
	}
	if strings.HasPrefix(source, "@/") {
		s := strings.TrimPrefix(source, "@/")
		parts := strings.Split(s, "/")
		if len(parts) > 0 && parts[0] != "" {
			return parts[0]
		}
		return "project"
	}
	if strings.HasPrefix(source, "./") || strings.HasPrefix(source, "../") {
		return "local"
	}
	parts := strings.Split(source, "/")
	if len(parts) > 0 {
		return "vendor:" + parts[0]
	}
	return "vendor"
}

func limitedKeys(m map[string]struct{}, limit int) []string {
	keys := mapKeysSorted(m)
	if limit > 0 && len(keys) > limit {
		return keys[:limit]
	}
	return keys
}

func buildCodebaseMapMarkdown(m CodebaseMap) string {
	var b strings.Builder
	b.WriteString("# Codebase Map\n\n")
	b.WriteString("## Overview\n")
	b.WriteString(fmt.Sprintf("- Files: %d\n", m.Overview.Files))
	b.WriteString(fmt.Sprintf("- Functions: %d\n", m.Overview.Functions))
	b.WriteString(fmt.Sprintf("- Calls: %d\n", m.Overview.Calls))
	b.WriteString(fmt.Sprintf("- Imports: %d\n", m.Overview.Imports))
	b.WriteString(fmt.Sprintf("- Graph Nodes: %d\n", m.Overview.Nodes))
	b.WriteString(fmt.Sprintf("- Graph Edges: %d\n\n", m.Overview.Edges))

	b.WriteString("## Features\n")
	for _, f := range m.Features {
		b.WriteString(fmt.Sprintf("- %s: files=%d, functions=%d, imports=%d\n", f.Name, f.FileCount, f.FunctionCount, f.ImportCount))
		if len(f.Dependencies) > 0 {
			deps := f.Dependencies
			if len(deps) > 8 {
				deps = deps[:8]
			}
			b.WriteString(fmt.Sprintf("  deps: %s\n", strings.Join(deps, ", ")))
		}
	}

	b.WriteString("\n## Entrypoint Flows\n")
	for _, ef := range m.EntryFlows {
		b.WriteString(fmt.Sprintf("- %s -> %s\n", ef.Entrypoint, nonEmpty(ef.Exit, "(no explicit exit)")))
		if len(ef.Features) > 0 {
			b.WriteString(fmt.Sprintf("  features: %s\n", strings.Join(ef.Features, ", ")))
		}
	}

	return b.String()
}

func nonEmpty(v, fallback string) string {
	if strings.TrimSpace(v) == "" {
		return fallback
	}
	return v
}

func buildArchitectureMapMermaid(m CodebaseMap) string {
	var b strings.Builder
	b.WriteString("flowchart LR\n")
	b.WriteString("  ENTRY((Entrypoints))\n")

	maxFeatures := len(m.Features)
	if maxFeatures > 18 {
		maxFeatures = 18
	}

	for i := 0; i < maxFeatures; i++ {
		f := m.Features[i]
		fid := "F_" + mermaidID(f.Name)
		b.WriteString(fmt.Sprintf("  %s[\"%s\\nfiles:%d fn:%d\"]\n", fid, escapeMermaidLabel(f.Name), f.FileCount, f.FunctionCount))
		b.WriteString(fmt.Sprintf("  ENTRY --> %s\n", fid))
		for j, dep := range f.Dependencies {
			if j >= 4 {
				break
			}
			did := "D_" + mermaidID(dep)
			b.WriteString(fmt.Sprintf("  %s((\"%s\"))\n", did, escapeMermaidLabel(dep)))
			b.WriteString(fmt.Sprintf("  %s --> %s\n", fid, did))
		}
	}

	return b.String()
}

func buildEntrypointMapMermaid(m CodebaseMap) string {
	var b strings.Builder
	b.WriteString("flowchart LR\n")

	maxEntries := len(m.EntryFlows)
	if maxEntries > 20 {
		maxEntries = 20
	}

	for i := 0; i < maxEntries; i++ {
		ef := m.EntryFlows[i]
		eid := "E_" + mermaidID(ef.Entrypoint)
		xid := "X_" + mermaidID(nonEmpty(ef.Exit, ef.Entrypoint+"_exit"))
		b.WriteString(fmt.Sprintf("  %s([\"%s\"])\n", eid, escapeMermaidLabel(ef.Entrypoint)))
		b.WriteString(fmt.Sprintf("  %s((\"%s\"))\n", xid, escapeMermaidLabel(nonEmpty(ef.Exit, "exit"))))

		if len(ef.Features) == 0 {
			b.WriteString(fmt.Sprintf("  %s --> %s\n", eid, xid))
			continue
		}

		for j, feat := range ef.Features {
			if j >= 4 {
				break
			}
			fid := "F_" + mermaidID(ef.Entrypoint+"_"+feat)
			b.WriteString(fmt.Sprintf("  %s[\"%s\"]\n", fid, escapeMermaidLabel(feat)))
			b.WriteString(fmt.Sprintf("  %s --> %s --> %s\n", eid, fid, xid))
		}
	}

	return b.String()
}

func buildFeatureMapMermaid(m CodebaseMap) string {
	var b strings.Builder
	b.WriteString("flowchart LR\n")

	maxFeatures := len(m.Features)
	if maxFeatures > 25 {
		maxFeatures = 25
	}

	for i := 0; i < maxFeatures; i++ {
		f := m.Features[i]
		fid := "F_" + mermaidID(f.Name)
		b.WriteString(fmt.Sprintf("  %s[\"%s\"]\n", fid, escapeMermaidLabel(f.Name)))
		for j, dep := range f.Dependencies {
			if j >= 6 {
				break
			}
			did := "D_" + mermaidID(f.Name+"_"+dep)
			b.WriteString(fmt.Sprintf("  %s((\"%s\"))\n", did, escapeMermaidLabel(dep)))
			b.WriteString(fmt.Sprintf("  %s --> %s\n", fid, did))
		}
	}

	return b.String()
}

func buildMermaidOverview(graph ExtractionGraph) string {
	exitByFile := make(map[string]string)
	for _, exitID := range graph.ExitPoints {
		exitByFile[strings.TrimPrefix(exitID, "exit:")] = exitID
	}

	nodeMap := make(map[string]GraphNode)
	for _, n := range graph.Nodes {
		nodeMap[n.ID] = n
	}

	usedNodeIDs := make(map[string]struct{})
	edges := make([]GraphEdge, 0, len(graph.EntryPoints))
	for _, entryID := range graph.EntryPoints {
		file := strings.TrimPrefix(entryID, "entry:")
		exitID := exitByFile[file]
		if exitID == "" {
			continue
		}
		usedNodeIDs[entryID] = struct{}{}
		usedNodeIDs[exitID] = struct{}{}
		edges = append(edges, GraphEdge{From: entryID, To: exitID, Kind: "flow"})
	}

	featuresToShow := 15
	if len(graph.Features) < featuresToShow {
		featuresToShow = len(graph.Features)
	}
	for i := 0; i < featuresToShow; i++ {
		featureID := graph.Features[i]
		usedNodeIDs[featureID] = struct{}{}
	}

	nodes := make([]GraphNode, 0, len(usedNodeIDs))
	for id := range usedNodeIDs {
		if n, ok := nodeMap[id]; ok {
			nodes = append(nodes, n)
		}
	}
	sort.Slice(nodes, func(i, j int) bool { return nodes[i].ID < nodes[j].ID })

	return buildMermaid(nodes, edges)
}

func buildMermaid(nodes []GraphNode, edges []GraphEdge) string {
	var b strings.Builder
	b.WriteString("flowchart LR\n")

	idMap := make(map[string]string, len(nodes))
	for _, n := range nodes {
		safeID := mermaidID(n.ID)
		idMap[n.ID] = safeID
		label := escapeMermaidLabel(n.Label)
		switch n.Kind {
		case "entry":
			b.WriteString(fmt.Sprintf("  %s([\"%s\"])\n", safeID, label))
		case "exit":
			b.WriteString(fmt.Sprintf("  %s((\"%s\"))\n", safeID, label))
		case "feature":
			b.WriteString(fmt.Sprintf("  %s{{\"%s\"}}\n", safeID, label))
		case "file":
			b.WriteString(fmt.Sprintf("  %s[/\"%s\"/]\n", safeID, label))
		default:
			b.WriteString(fmt.Sprintf("  %s[\"%s\"]\n", safeID, label))
		}
	}

	for _, e := range edges {
		from := idMap[e.From]
		to := idMap[e.To]
		if from == "" || to == "" {
			continue
		}
		b.WriteString(fmt.Sprintf("  %s -->|%s| %s\n", from, escapeMermaidLabel(e.Kind), to))
	}

	return b.String()
}

func writeDetailedMermaidShards(graph ExtractionGraph, dir string, maxEdges int) ([]string, error) {
	if maxEdges <= 0 {
		maxEdges = 400
	}

	nodeMap := make(map[string]GraphNode, len(graph.Nodes))
	for _, n := range graph.Nodes {
		nodeMap[n.ID] = n
	}

	partDir := filepath.Join(dir, "function_graph_parts")
	if err := os.MkdirAll(partDir, 0o755); err != nil {
		return nil, err
	}

	parts := []string{}
	partNum := 1
	for start := 0; start < len(graph.Edges); start += maxEdges {
		end := start + maxEdges
		if end > len(graph.Edges) {
			end = len(graph.Edges)
		}

		edges := graph.Edges[start:end]
		used := make(map[string]struct{})
		for _, e := range edges {
			used[e.From] = struct{}{}
			used[e.To] = struct{}{}
		}

		nodes := make([]GraphNode, 0, len(used))
		for id := range used {
			if n, ok := nodeMap[id]; ok {
				nodes = append(nodes, n)
			}
		}
		sort.Slice(nodes, func(i, j int) bool { return nodes[i].ID < nodes[j].ID })

		name := fmt.Sprintf("function_graph_part_%03d.mmd", partNum)
		path := filepath.Join(partDir, name)
		if err := os.WriteFile(path, []byte(buildMermaid(nodes, edges)), 0o644); err != nil {
			return nil, err
		}
		parts = append(parts, fmt.Sprintf("%s (edges=%d)", filepath.ToSlash(filepath.Join("function_graph_parts", name)), len(edges)))
		partNum++
	}

	if len(parts) == 0 {
		emptyPath := filepath.Join(partDir, "function_graph_part_001.mmd")
		if err := os.WriteFile(emptyPath, []byte("flowchart LR\n"), 0o644); err != nil {
			return nil, err
		}
		parts = append(parts, "function_graph_parts/function_graph_part_001.mmd (edges=0)")
	}

	return parts, nil
}

func writeFeatureMermaidShards(graph ExtractionGraph, dir string, maxEdges int) ([]string, error) {
	if maxEdges <= 0 {
		maxEdges = 300
	}

	nodeMap := make(map[string]GraphNode, len(graph.Nodes))
	for _, n := range graph.Nodes {
		nodeMap[n.ID] = n
	}

	featureGroups := make(map[string][]GraphEdge)
	for _, e := range graph.Edges {
		group := "shared"

		if fromNode, ok := nodeMap[e.From]; ok {
			if g := fileFeatureGroup(fromNode.File); g != "" {
				group = g
			}
		}
		if group == "shared" {
			if toNode, ok := nodeMap[e.To]; ok {
				if g := fileFeatureGroup(toNode.File); g != "" {
					group = g
				}
			}
		}

		featureGroups[group] = append(featureGroups[group], e)
	}

	groupNames := make([]string, 0, len(featureGroups))
	for g := range featureGroups {
		groupNames = append(groupNames, g)
	}
	sort.Strings(groupNames)

	partDir := filepath.Join(dir, "function_graph_feature_parts")
	if err := os.MkdirAll(partDir, 0o755); err != nil {
		return nil, err
	}

	parts := []string{}
	for _, group := range groupNames {
		edges := featureGroups[group]
		for start, chunk := 0, 1; start < len(edges); start, chunk = start+maxEdges, chunk+1 {
			end := start + maxEdges
			if end > len(edges) {
				end = len(edges)
			}

			subEdges := edges[start:end]
			used := make(map[string]struct{})
			for _, e := range subEdges {
				used[e.From] = struct{}{}
				used[e.To] = struct{}{}
			}

			nodes := make([]GraphNode, 0, len(used))
			for id := range used {
				if n, ok := nodeMap[id]; ok {
					nodes = append(nodes, n)
				}
			}
			sort.Slice(nodes, func(i, j int) bool { return nodes[i].ID < nodes[j].ID })

			name := fmt.Sprintf("feature_%s_part_%03d.mmd", sanitizeFilename(group), chunk)
			path := filepath.Join(partDir, name)
			if err := os.WriteFile(path, []byte(buildMermaid(nodes, subEdges)), 0o644); err != nil {
				return nil, err
			}

			parts = append(parts, fmt.Sprintf("%s (edges=%d)", filepath.ToSlash(filepath.Join("function_graph_feature_parts", name)), len(subEdges)))
		}
	}

	if len(parts) == 0 {
		name := "feature_shared_part_001.mmd"
		path := filepath.Join(partDir, name)
		if err := os.WriteFile(path, []byte("flowchart LR\n"), 0o644); err != nil {
			return nil, err
		}
		parts = append(parts, fmt.Sprintf("%s (edges=0)", filepath.ToSlash(filepath.Join("function_graph_feature_parts", name))))
	}

	return parts, nil
}

func fileFeatureGroup(file string) string {
	if strings.TrimSpace(file) == "" {
		return ""
	}
	parts := strings.Split(filepath.ToSlash(file), "/")
	if len(parts) == 0 {
		return ""
	}
	if parts[0] == "." {
		return "shared"
	}
	if parts[0] == "app" && len(parts) > 1 {
		return "app-" + parts[1]
	}
	return parts[0]
}

func sanitizeFilename(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	if s == "" {
		return "shared"
	}
	var b strings.Builder
	for _, ch := range s {
		if (ch >= 'a' && ch <= 'z') || (ch >= '0' && ch <= '9') || ch == '-' || ch == '_' {
			b.WriteRune(ch)
			continue
		}
		b.WriteRune('_')
	}
	return b.String()
}

func mermaidID(raw string) string {
	var b strings.Builder
	for _, ch := range raw {
		if (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || (ch >= '0' && ch <= '9') {
			b.WriteRune(ch)
			continue
		}
		b.WriteRune('_')
	}
	result := b.String()
	if result == "" {
		return "n"
	}
	if result[0] >= '0' && result[0] <= '9' {
		return "n_" + result
	}
	return result
}

func escapeMermaidLabel(s string) string {
	s = strings.ReplaceAll(s, "\"", "'")
	s = strings.ReplaceAll(s, "\n", " ")
	return strings.TrimSpace(s)
}
