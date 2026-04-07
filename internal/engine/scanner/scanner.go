package scanner

import (
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"strings"
)

type ScanSummary struct {
	RepoRoot       string
	Files          int
	Languages      int
	Frameworks     []string
	GraphGenerated bool
	Graph          GraphMetrics
}

func ScanRepo(root string) (ScanSummary, error) {
	summary := ScanSummary{RepoRoot: root}

	files, err := filterFiles(root)
	if err != nil {
		return summary, err
	}
	summary.Files = len(files)

	fmt.Println("Total Files Detected: ", len(files))

	sortedFiles, err := GroupSameLanguageFiles(files)
	if err != nil {
		return summary, err
	}
	summary.Languages = len(sortedFiles)

	fmt.Println("Languages Detected: ", len(sortedFiles))

	frameworks, err := DetermineFrameworks(files)
	if err != nil {
		return summary, err
	}
	summary.Frameworks = frameworks

	fmt.Println("Frameworks: ", frameworks)

	if len(frameworks) == 0 {
		fmt.Println("No frameworks detected, scanning for function signatures and headers...")
		return summary, nil
	}

	if contains(frameworks[0], "next") || contains(frameworks[0], "react") || contains(frameworks[0], "vue") || contains(frameworks[0], "angular") || contains(frameworks[0], "express") || contains(frameworks[0], "tailwind") || contains(frameworks[0], "bootstrap") {

		fmt.Println("Scanning for function signatures and headers in .ts, .js, .jsx, .tsx files...")
		graph, err := extractFunctions(root, frameworks, sortedFiles)
		if err != nil {
			return summary, err
		}
		summary.GraphGenerated = true
		summary.Graph = graph.Metadata

	}

	return summary, nil

}

func DetermineFrameworks(files []string) ([]string, error) {
	frameworks := []string{}

	frameworksMap := map[string][]string{
		"package.json":         {"next", "react", "vue", "angular", "express", "tailwind", "bootstrap"},
		"go.mod":               {"gin", "echo", "fiber", "beego", "chi"},
		"requirements.txt":     {"django", "flask", "fastapi", "pyramid", "tornado"},
		"Gemfile":              {"rails", "sinatra", "padrino", "hanami", "grape"},
		"pom.xml":              {"spring", "struts", "jsf", "play", "gwt"},
		"composer.json":        {"laravel", "symfony", "codeigniter", "yii", "cakephp"},
		"build.gradle":         {"spring", "struts", "jsf", "play", "gwt"},
		"Cargo.toml":           {"rocket", "actix", "warp", "tide", "gotham"},
		"requirements-dev.txt": {"pytest", "unittest", "nose", "doctest", "hypothesis"},
		"Pipfile":              {"django", "flask", "fastapi", "pyramid", "tornado"},
		"setup.py":             {"django", "flask", "fastapi", "pyramid", "tornado"},
		"build.sbt":            {"play", "akka", "lagom", "spark", "scalatra"},
		"build.gradle.kts":     {"spring", "struts", "jsf", "play", "gwt"},
	}

	for _, file := range files {
		for key, fwList := range frameworksMap {
			if filepath.Base(file) == key {
				content, err := ReadFileContent(file)
				if err != nil {
					continue
				}

				for _, fw := range fwList {
					if contains(content, fw) {
						frameworks = append(frameworks, fw)
					}
				}
			}
		}
	}

	return frameworks, nil
}

func contains(content, keyword string) bool {
	return strings.Contains(strings.ToLower(content), strings.ToLower(keyword))
}

func ReadFileContent(path string) (string, error) {
	content, err := os.ReadFile(path)
	if err != nil {
		return "", err
	}
	return string(content), nil
}

func GroupSameLanguageFiles(files []string) (map[string][]string, error) {
	if files == nil {
		return nil, fmt.Errorf("no files provided")
	}

	m := make(map[string][]string)

	for _, file := range files {
		ext := filepath.Ext(file)
		if ext == "" {
			continue
		}

		m[ext] = append(m[ext], file)

	}

	if len(m) == 0 {
		return nil, fmt.Errorf("no language detected")
	}
	return m, nil

}

func filterFiles(root string) ([]string, error) {
	var files []string

	// fmt.Println("[FILETER] list files started")
	err := filepath.WalkDir(root, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return nil
		}

		if d.IsDir() {
			name := d.Name()

			if name == "node_modules" || name == ".git" || name == "dist" {
				return filepath.SkipDir
			}

			return nil
		}

		// // remove relative path
		// relPath, err := filepath.Rel(root, path)
		// if err != nil {
		// 	return err
		// }

		files = append(files, path)

		return nil
	})

	return files, err
}
